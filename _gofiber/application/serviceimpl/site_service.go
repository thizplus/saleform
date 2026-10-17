package serviceimpl

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/models"
	"line-sales-api/domain/ports"
	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/logger"

	"github.com/google/uuid"
)

type siteServiceImpl struct {
	siteRepo        repositories.SiteRepository
	reportRepo      repositories.SiteReportRepository
	contactRepo     repositories.ContactRepository
	mediaRepo       repositories.MediaFileRepository
	siteCodeRepo    repositories.SiteCodeCounterRepository
	salesRepRepo    repositories.SalesRepRepository
	txManager       ports.TxManager
	lineMessenger   ports.LineMessenger
	r2PublicURL     string
}

func NewSiteService(
	siteRepo repositories.SiteRepository,
	reportRepo repositories.SiteReportRepository,
	contactRepo repositories.ContactRepository,
	mediaRepo repositories.MediaFileRepository,
	siteCodeRepo repositories.SiteCodeCounterRepository,
	salesRepRepo repositories.SalesRepRepository,
	txManager ports.TxManager,
	r2PublicURL string,
	lineMessenger ports.LineMessenger,
) *siteServiceImpl {
	return &siteServiceImpl{
		siteRepo:      siteRepo,
		reportRepo:    reportRepo,
		contactRepo:   contactRepo,
		mediaRepo:     mediaRepo,
		siteCodeRepo:  siteCodeRepo,
		salesRepRepo:  salesRepRepo,
		txManager:     txManager,
		r2PublicURL:   r2PublicURL,
		lineMessenger: lineMessenger,
	}
}

func (s *siteServiceImpl) photoURL(key string) string {
	if key == "" || s.r2PublicURL == "" {
		return ""
	}
	return s.r2PublicURL + "/" + key
}

func (s *siteServiceImpl) Create(ctx context.Context, repID uuid.UUID, req *dto.CreateSiteRequest) (*dto.CreateSiteResponse, error) {
	// Duplicate check (unless forceNew)
	if !req.ForceNew {
		dupResp, err := s.CheckDuplicate(ctx, req.Phone, req.Latitude, req.Longitude)
		if err == nil && dupResp.HasDuplicate {
			return nil, &DuplicateError{Matches: dupResp.Matches}
		}
	}

	// Generate site code (Buddhist year format: YYMMDD-NN)
	now := time.Now()
	buddhistYear := now.Year() + 543
	datePrefix := fmt.Sprintf("%02d%02d%02d", buddhistYear%100, now.Month(), now.Day())
	siteCode, err := s.siteCodeRepo.NextCode(ctx, datePrefix)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to generate site code", "error", err)
		return nil, errors.New("failed to generate site code")
	}

	siteID := uuid.New()
	reportID := uuid.New()

	var expectedDate *time.Time
	if req.ExpectedOrderDate != nil {
		if t, err := time.Parse("2006-01-02", *req.ExpectedOrderDate); err == nil {
			expectedDate = &t
		}
	}
	var followUpDate *time.Time
	if req.NextFollowUpDate != nil {
		if t, err := time.Parse("2006-01-02", *req.NextFollowUpDate); err == nil {
			followUpDate = &t
		}
	}

	site := &models.Site{
		BaseModel:         models.BaseModel{ID: siteID},
		SiteCode:          siteCode,
		CustomerName:      req.CustomerName,
		CustomerType:      req.CustomerType,
		ContractorName:    req.ContractorName,
		DecisionMaker:     req.DecisionMaker,
		Phone:             normalizePhone(req.Phone),
		Latitude:          req.Latitude,
		Longitude:         req.Longitude,
		Address:           req.Address,
		Tambon:            strings.TrimSpace(req.Tambon),
		Amphoe:            strings.TrimSpace(req.Amphoe),
		Stage:             firstNonEmpty(req.Stage, "new"),
		Status:            "following",
		ExpectedOrderDate: expectedDate,
		NextFollowUpDate:  followUpDate,
		OwnerRepID:        repID,
		ReportCount:       1,
		LastReportAt:      &now,
	}

	report := &models.SiteReport{
		BaseModel:        models.BaseModel{ID: reportID},
		SiteID:           siteID,
		RepID:            repID,
		ReportType:       "new",
		Note:             req.Detail,
		Stage:            site.Stage,
		Status:           "following",
		NextFollowUpDate: followUpDate,
		ReportDate:       now,
		Source:           "liff",
	}

	err = s.txManager.WithTx(ctx, func(txCtx context.Context) error {
		if err := s.siteRepo.Create(txCtx, site); err != nil {
			return fmt.Errorf("create site: %w", err)
		}

		if err := s.reportRepo.Create(txCtx, report); err != nil {
			return fmt.Errorf("create report: %w", err)
		}

		// Create contact
		if req.Phone != "" {
			contact := &models.Contact{
				BaseModel: models.BaseModel{ID: uuid.New()},
				Phone:     normalizePhone(req.Phone),
				SiteID:    siteID,
				IsPrimary: true,
			}
			if err := s.contactRepo.Create(txCtx, contact); err != nil {
				return fmt.Errorf("create contact: %w", err)
			}
		}

		// Link photos to report
		if len(req.PhotoIDs) > 0 {
			photoUUIDs := make([]uuid.UUID, 0, len(req.PhotoIDs))
			for _, id := range req.PhotoIDs {
				if uid, err := uuid.Parse(id); err == nil {
					photoUUIDs = append(photoUUIDs, uid)
				}
			}
			if len(photoUUIDs) > 0 {
				if err := s.mediaRepo.UpdateReportID(txCtx, photoUUIDs, reportID); err != nil {
					return fmt.Errorf("link photos: %w", err)
				}
			}
		}

		return nil
	})
	if err != nil {
		logger.ErrorContext(ctx, "Failed to create site", "error", err)
		return nil, errors.New("failed to create site")
	}

	logger.InfoContext(ctx, "Site created", "site_code", siteCode, "rep_id", repID)

	// Build messages (ข้อความ + รูป + ตำแหน่ง)
	rep, _ := s.salesRepRepo.GetByID(ctx, repID)
	repName := ""
	if rep != nil {
		repName = rep.DisplayName
	}

	// รวม photo URLs
	photoURLs := s.getPhotoURLs(ctx, reportID)
	lineMessages := BuildNewSiteMessages(site, report, repName, photoURLs)

	// ส่งเข้ากลุ่ม LINE (ถ้ามี GroupID + lineMessenger)
	if site.GroupID != "" && s.lineMessenger != nil {
		msgInterfaces := make([]any, len(lineMessages))
		for i, m := range lineMessages {
			msgInterfaces[i] = m
		}
		if err := s.lineMessenger.PushMessage(ctx, site.GroupID, msgInterfaces...); err != nil {
			logger.WarnContext(ctx, "Failed to push message to group", "group_id", site.GroupID, "error", err)
		} else {
			logger.InfoContext(ctx, "Message pushed to group", "group_id", site.GroupID, "site_code", siteCode)
		}
	}

	return &dto.CreateSiteResponse{
		Site: dto.SiteBrief{
			SiteCode:     site.SiteCode,
			CustomerName: site.CustomerName,
			Phone:        site.Phone,
			Status:       site.Status,
			Stage:        site.Stage,
			ReportCount:  site.ReportCount,
			IsMine:       true,
			OwnerName:    repName,
		},
		Report: dto.ReportBrief{
			ID:         report.ID.String(),
			ReportType: report.ReportType,
			Note:       report.Note,
			Stage:      report.Stage,
			Status:     report.Status,
			RepName:    repName,
			ReportDate: report.ReportDate,
		},
		ChatMessages: lineMessages,
	}, nil
}

func (s *siteServiceImpl) CheckDuplicate(ctx context.Context, phone string, lat, lng *float64) (*dto.DuplicateCheckResponse, error) {
	resp := &dto.DuplicateCheckResponse{}

	// Check by phone
	if phone != "" {
		sites, err := s.siteRepo.GetByPhone(ctx, normalizePhone(phone))
		if err == nil {
			for _, site := range sites {
				if site.Status == "following" {
					owner, _ := s.salesRepRepo.GetByID(ctx, site.OwnerRepID)
					ownerName := ""
					if owner != nil {
						ownerName = owner.DisplayName
					}
					resp.Matches = append(resp.Matches, dto.DuplicateMatch{
						SiteCode:     site.SiteCode,
						CustomerName: site.CustomerName,
						Phone:        site.Phone,
						Reason:       "phone",
						OwnerName:    ownerName,
						Status:       site.Status,
					})
				}
			}
		}
	}
	// Note: IsMine จะถูก set ใน handler (ที่รู้ repID ของคน request)

	// Check by location (150m radius)
	if lat != nil && lng != nil {
		nearbySites, err := s.siteRepo.FindNearby(ctx, *lat, *lng, 150)
		if err == nil {
			for _, site := range nearbySites {
				// Avoid duplicates from phone match
				already := false
				for _, m := range resp.Matches {
					if m.SiteCode == site.SiteCode {
						already = true
						break
					}
				}
				if already {
					continue
				}

				dist := haversineDistance(*lat, *lng, *site.Latitude, *site.Longitude)
				distInt := int(math.Round(dist))
				owner, _ := s.salesRepRepo.GetByID(ctx, site.OwnerRepID)
				ownerName := ""
				if owner != nil {
					ownerName = owner.DisplayName
				}
				resp.Matches = append(resp.Matches, dto.DuplicateMatch{
					SiteCode:     site.SiteCode,
					CustomerName: site.CustomerName,
					Phone:        site.Phone,
					Reason:       "nearby",
					DistanceM:    &distInt,
					OwnerName:    ownerName,
					Status:       site.Status,
				})
			}
		}
	}

	resp.HasDuplicate = len(resp.Matches) > 0
	return resp, nil
}

func (s *siteServiceImpl) GetByCode(ctx context.Context, code string, viewerRepID *uuid.UUID) (*dto.SiteDetailResponse, error) {
	site, err := s.siteRepo.GetByCode(ctx, code)
	if err != nil {
		return nil, errors.New("site not found")
	}

	reports, _ := s.reportRepo.GetBySiteID(ctx, site.ID)
	owner, _ := s.salesRepRepo.GetByID(ctx, site.OwnerRepID)
	ownerName := ""
	if owner != nil {
		ownerName = owner.DisplayName
	}

	canEdit := viewerRepID != nil && *viewerRepID == site.OwnerRepID

	// Build report briefs
	reportBriefs := make([]dto.ReportBrief, 0, len(reports))
	for _, r := range reports {
		repName := ""
		if rep, err := s.salesRepRepo.GetByID(ctx, r.RepID); err == nil {
			repName = rep.DisplayName
		}
		photos := make([]dto.PhotoBrief, 0, len(r.Photos))
		for _, p := range r.Photos {
			photos = append(photos, dto.PhotoBrief{
				ID:       p.ID.String(),
				ThumbURL: s.photoURL(p.ThumbKey),
				FullURL:  s.photoURL(p.StorageKey),
			})
		}
		reportBriefs = append(reportBriefs, dto.ReportBrief{
			ID:         r.ID.String(),
			ReportType: r.ReportType,
			Note:       r.Note,
			Stage:      r.Stage,
			Status:     r.Status,
			RepName:    repName,
			ReportDate: r.ReportDate,
			Photos:     photos,
		})
	}

	var mapsURL string
	if site.Latitude != nil && site.Longitude != nil {
		mapsURL = fmt.Sprintf("https://www.google.com/maps?q=%f,%f", *site.Latitude, *site.Longitude)
	}

	var expectedStr, followUpStr *string
	if site.ExpectedOrderDate != nil {
		s := site.ExpectedOrderDate.Format("2006-01-02")
		expectedStr = &s
	}
	if site.NextFollowUpDate != nil {
		s := site.NextFollowUpDate.Format("2006-01-02")
		followUpStr = &s
	}

	return &dto.SiteDetailResponse{
		SiteCode:          site.SiteCode,
		CustomerName:      site.CustomerName,
		CustomerType:      site.CustomerType,
		ContractorName:    site.ContractorName,
		DecisionMaker:     site.DecisionMaker,
		Phone:             site.Phone,
		Latitude:          site.Latitude,
		Longitude:         site.Longitude,
		Address:           site.Address,
		Amphoe:            site.Amphoe,
		Tambon:            site.Tambon,
		Stage:             site.Stage,
		Status:            site.Status,
		LostReason:        site.LostReason,
		Competitor:        site.Competitor,
		ExpectedOrderDate: expectedStr,
		NextFollowUpDate:  followUpStr,
		OwnerName:         ownerName,
		OwnerID:           site.OwnerRepID.String(),
		CanEdit:           canEdit,
		MapsURL:           mapsURL,
		CreatedAt:         site.CreatedAt,
		Reports:           reportBriefs,
	}, nil
}

func (s *siteServiceImpl) List(ctx context.Context, repID *uuid.UUID, filter *dto.SiteListFilter) (*dto.SiteListResponse, error) {
	repoFilter := repositories.SiteFilter{
		Tab:    filter.Tab,
		Search: filter.Search,
		Status: filter.Status,
		Amphoe: filter.Amphoe,
		Page:   filter.Page,
		Limit:  filter.Limit,
	}

	if filter.RepID != "" {
		if uid, err := uuid.Parse(filter.RepID); err == nil {
			repoFilter.RepID = &uid
		}
	} else if repID != nil {
		repoFilter.RepID = repID
	}

	if repoFilter.Page <= 0 {
		repoFilter.Page = 1
	}
	if repoFilter.Limit <= 0 {
		repoFilter.Limit = 20
	}

	sites, total, err := s.siteRepo.List(ctx, repoFilter)
	if err != nil {
		return nil, err
	}

	briefs := make([]dto.SiteBrief, 0, len(sites))
	for _, site := range sites {
		owner, _ := s.salesRepRepo.GetByID(ctx, site.OwnerRepID)
		ownerName := ""
		if owner != nil {
			ownerName = owner.DisplayName
		}
		var followUpStr *string
		if site.NextFollowUpDate != nil {
			s := site.NextFollowUpDate.Format("2006-01-02")
			followUpStr = &s
		}
		isMine := repID != nil && *repID == site.OwnerRepID

		briefs = append(briefs, dto.SiteBrief{
			SiteCode:         site.SiteCode,
			CustomerName:     site.CustomerName,
			Phone:            site.Phone,
			Status:           site.Status,
			Stage:            site.Stage,
			NextFollowUpDate: followUpStr,
			IsMine:           isMine,
			OwnerName:        ownerName,
			ReportCount:      site.ReportCount,
			ContractorName:   site.ContractorName,
			Tambon:           site.Tambon,
			Amphoe:           site.Amphoe,
			Lat:              site.Latitude,
			Lng:              site.Longitude,
			LastReportAt:     site.LastReportAt,
		})
	}

	return &dto.SiteListResponse{
		Sites: briefs,
		Total: total,
		Page:  repoFilter.Page,
		Limit: repoFilter.Limit,
	}, nil
}

func (s *siteServiceImpl) AddFollowUp(ctx context.Context, repID uuid.UUID, code string, req *dto.CreateFollowUpRequest) (*dto.CreateFollowUpResponse, error) {
	site, err := s.siteRepo.GetByCode(ctx, code)
	if err != nil {
		return nil, errors.New("site not found")
	}

	if site.OwnerRepID != repID {
		return nil, errors.New("not site owner")
	}

	// Validate conditional fields
	if req.Status == "lost" && req.LostReason == "" {
		return nil, errors.New("lost reason is required")
	}
	if req.Status == "following" && req.NextFollowUpDate == nil {
		return nil, errors.New("next follow-up date is required")
	}

	now := time.Now()
	reportID := uuid.New()

	var followUpDate *time.Time
	if req.NextFollowUpDate != nil {
		if t, err := time.Parse("2006-01-02", *req.NextFollowUpDate); err == nil {
			followUpDate = &t
		}
	}

	report := &models.SiteReport{
		BaseModel:        models.BaseModel{ID: reportID},
		SiteID:           site.ID,
		RepID:            repID,
		ReportType:       "follow_up",
		Note:             req.Note,
		Stage:            firstNonEmpty(req.Stage, site.Stage),
		Status:           req.Status,
		LostReason:       req.LostReason,
		Competitor:       req.Competitor,
		DecisionMaker:    firstNonEmpty(req.DecisionMaker, site.DecisionMaker),
		NextFollowUpDate: followUpDate,
		ReportDate:       now,
		Source:           "liff",
	}

	// Update site
	site.Status = req.Status
	if req.Stage != "" {
		site.Stage = req.Stage
	}
	if req.DecisionMaker != "" {
		site.DecisionMaker = req.DecisionMaker
	}
	site.LostReason = req.LostReason
	site.Competitor = req.Competitor
	site.NextFollowUpDate = followUpDate
	site.ReportCount++
	site.LastReportAt = &now

	err = s.txManager.WithTx(ctx, func(txCtx context.Context) error {
		if err := s.reportRepo.Create(txCtx, report); err != nil {
			return err
		}
		if err := s.siteRepo.Update(txCtx, site); err != nil {
			return err
		}
		if len(req.PhotoIDs) > 0 {
			photoUUIDs := make([]uuid.UUID, 0, len(req.PhotoIDs))
			for _, id := range req.PhotoIDs {
				if uid, err := uuid.Parse(id); err == nil {
					photoUUIDs = append(photoUUIDs, uid)
				}
			}
			if len(photoUUIDs) > 0 {
				return s.mediaRepo.UpdateReportID(txCtx, photoUUIDs, reportID)
			}
		}
		return nil
	})
	if err != nil {
		logger.ErrorContext(ctx, "Failed to create follow-up", "error", err, "site_code", code)
		return nil, errors.New("failed to create follow-up")
	}

	rep, _ := s.salesRepRepo.GetByID(ctx, repID)
	repName := ""
	if rep != nil {
		repName = rep.DisplayName
	}

	// Build messages (ข้อความ + รูป)
	photoURLs := s.getPhotoURLs(ctx, reportID)
	lineMessages := BuildFollowUpMessages(site, report, repName, photoURLs)

	// ส่งเข้ากลุ่ม LINE (ถ้ามี GroupID + lineMessenger)
	if site.GroupID != "" && s.lineMessenger != nil {
		msgInterfaces := make([]any, len(lineMessages))
		for i, m := range lineMessages {
			msgInterfaces[i] = m
		}
		if err := s.lineMessenger.PushMessage(ctx, site.GroupID, msgInterfaces...); err != nil {
			logger.WarnContext(ctx, "Failed to push follow-up to group", "group_id", site.GroupID, "error", err)
		}
	}

	var followUpStr *string
	if site.NextFollowUpDate != nil {
		s := site.NextFollowUpDate.Format("2006-01-02")
		followUpStr = &s
	}

	return &dto.CreateFollowUpResponse{
		Site: dto.SiteBrief{
			SiteCode:         site.SiteCode,
			CustomerName:     site.CustomerName,
			Phone:            site.Phone,
			Status:           site.Status,
			Stage:            site.Stage,
			NextFollowUpDate: followUpStr,
			ReportCount:      site.ReportCount,
			IsMine:           true,
			OwnerName:        repName,
		},
		Report: dto.ReportBrief{
			ID:         report.ID.String(),
			ReportType: report.ReportType,
			Note:       report.Note,
			Stage:      report.Stage,
			Status:     report.Status,
			RepName:    repName,
			ReportDate: report.ReportDate,
		},
		ChatMessages: lineMessages,
	}, nil
}

func (s *siteServiceImpl) Update(ctx context.Context, code string, req *dto.UpdateSiteRequest) error {
	site, err := s.siteRepo.GetByCode(ctx, code)
	if err != nil {
		return errors.New("site not found")
	}

	if req.CustomerName != nil {
		site.CustomerName = *req.CustomerName
	}
	if req.CustomerType != nil {
		site.CustomerType = *req.CustomerType
	}
	if req.ContractorName != nil {
		site.ContractorName = *req.ContractorName
	}
	if req.DecisionMaker != nil {
		site.DecisionMaker = *req.DecisionMaker
	}
	if req.Phone != nil {
		site.Phone = normalizePhone(*req.Phone)
	}
	if req.Address != nil {
		site.Address = *req.Address
	}
	if req.Amphoe != nil {
		site.Amphoe = *req.Amphoe
	}
	if req.Stage != nil {
		site.Stage = *req.Stage
	}
	if req.Status != nil {
		site.Status = *req.Status
	}
	if req.LostReason != nil {
		site.LostReason = *req.LostReason
	}
	if req.Competitor != nil {
		site.Competitor = *req.Competitor
	}

	return s.siteRepo.Update(ctx, site)
}

// getPhotoURLs ดึง public URLs ของรูปใน report
func (s *siteServiceImpl) getPhotoURLs(ctx context.Context, reportID uuid.UUID) []string {
	photos, err := s.mediaRepo.GetByReportID(ctx, reportID)
	if err != nil || len(photos) == 0 {
		return nil
	}
	urls := make([]string, 0, len(photos))
	for _, p := range photos {
		url := s.photoURL(p.StorageKey)
		if url != "" {
			urls = append(urls, url)
		}
	}
	return urls
}

// DuplicateError returned when duplicate found and forceNew is false
type DuplicateError struct {
	Matches []dto.DuplicateMatch
}

func (e *DuplicateError) Error() string {
	return "possible duplicate site found"
}

// Helpers

func normalizePhone(phone string) string {
	var digits []byte
	for _, c := range phone {
		if c >= '0' && c <= '9' {
			digits = append(digits, byte(c))
		}
	}
	return string(digits)
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}

func haversineDistance(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371000 // meters
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}
