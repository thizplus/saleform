package serviceimpl

import (
	"context"
	"errors"
	"fmt"
	"math"
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
	lineEventRepo   repositories.LineEventRepository
	txManager       ports.TxManager
	lineMessenger   ports.LineMessenger
	r2PublicURL     string
	liffID          string
}

func NewSiteService(
	siteRepo repositories.SiteRepository,
	reportRepo repositories.SiteReportRepository,
	contactRepo repositories.ContactRepository,
	mediaRepo repositories.MediaFileRepository,
	siteCodeRepo repositories.SiteCodeCounterRepository,
	salesRepRepo repositories.SalesRepRepository,
	lineEventRepo repositories.LineEventRepository,
	txManager ports.TxManager,
	r2PublicURL string,
	liffID string,
	lineMessenger ports.LineMessenger,
) *siteServiceImpl {
	return &siteServiceImpl{
		siteRepo:      siteRepo,
		reportRepo:    reportRepo,
		contactRepo:   contactRepo,
		mediaRepo:     mediaRepo,
		siteCodeRepo:  siteCodeRepo,
		salesRepRepo:  salesRepRepo,
		lineEventRepo: lineEventRepo,
		txManager:     txManager,
		r2PublicURL:   r2PublicURL,
		liffID:        liffID,
		lineMessenger: lineMessenger,
	}
}

// pushMessagesGrouped แยก push เป็น 2 รอบ: ข้อความ+ตำแหน่ง แล้ว รูปล้วน
// LINE จะ group รูปเมื่อทุก message ใน push เป็น image ล้วน
func (s *siteServiceImpl) pushMessagesGrouped(ctx context.Context, groupID string, messages []map[string]any) bool {
	var textMsgs, imageMsgs []any
	for _, m := range messages {
		if m["type"] == "image" {
			imageMsgs = append(imageMsgs, m)
		} else {
			textMsgs = append(textMsgs, m)
		}
	}

	success := false

	// Push 1: ข้อความ + ตำแหน่ง
	if len(textMsgs) > 0 {
		if err := s.lineMessenger.PushMessage(ctx, groupID, textMsgs...); err != nil {
			logger.WarnContext(ctx, "Failed to push text to group", "group_id", groupID, "error", err)
		} else {
			success = true
		}
	}

	// Push 2: รูปล้วน (LINE จะ group อัตโนมัติ) — แบ่ง batch ละ 5
	for i := 0; i < len(imageMsgs); i += 5 {
		end := i + 5
		if end > len(imageMsgs) {
			end = len(imageMsgs)
		}
		batch := imageMsgs[i:end]
		if err := s.lineMessenger.PushMessage(ctx, groupID, batch...); err != nil {
			logger.WarnContext(ctx, "Failed to push images to group", "group_id", groupID, "error", err)
		} else {
			success = true
		}
	}

	return success
}

// resolveGroupID แปลง LIFF UUID → Messaging API Group ID (C...)
func (s *siteServiceImpl) resolveGroupID(ctx context.Context, liffGroupID string, repID uuid.UUID) string {
	// ถ้าเป็น Messaging API group ID อยู่แล้ว ใช้ได้เลย
	if liffGroupID != "" && (liffGroupID[0] == 'C' || liffGroupID[0] == 'R') {
		return liffGroupID
	}
	// lookup จาก webhook events โดยใช้ rep's LINE user ID
	rep, err := s.salesRepRepo.GetByID(ctx, repID)
	if err != nil || rep == nil || rep.LineUserID == "" {
		return ""
	}
	groupID, err := s.lineEventRepo.FindGroupIDByUser(ctx, rep.LineUserID)
	if err != nil || groupID == "" {
		return ""
	}
	logger.InfoContext(ctx, "Resolved group ID from webhook", "liff_id", liffGroupID, "resolved", groupID)
	return groupID
}

func (s *siteServiceImpl) photoURL(key string) string {
	if key == "" || s.r2PublicURL == "" {
		return ""
	}
	return s.r2PublicURL + "/" + key
}

func (s *siteServiceImpl) Create(ctx context.Context, repID uuid.UUID, req *dto.CreateSiteRequest) (*dto.CreateSiteResponse, error) {
	// Idempotency check — ป้องกันกดส่งซ้ำ
	if req.IdempotencyKey != "" {
		existing, err := s.reportRepo.GetByIdempotencyKey(ctx, req.IdempotencyKey)
		if err == nil && existing != nil {
			logger.InfoContext(ctx, "Duplicate request (idempotency)", "key", req.IdempotencyKey)
			return nil, errors.New("รายงานนี้ถูกส่งไปแล้ว")
		}
	}

	// Duplicate check (unless forceNew)
	if !req.ForceNew {
		dupResp, err := s.CheckDuplicate(ctx, req.Phone, req.Latitude, req.Longitude, req.CustomerName, &repID)
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
	var expectedOrderText string
	if req.ExpectedOrderDate != nil {
		if t, err := time.Parse("2006-01-02", *req.ExpectedOrderDate); err == nil {
			expectedDate = &t
		} else {
			// ข้อความเช่น "ภายในเดือน", "ภายใน 2 สัปดาห์" — เก็บเป็น text
			expectedOrderText = *req.ExpectedOrderDate
		}
	}
	var followUpDate *time.Time
	if req.NextFollowUpDate != nil {
		if t, err := time.Parse("2006-01-02", *req.NextFollowUpDate); err == nil {
			followUpDate = &t
		}
	}

	resolvedGroupID := s.resolveGroupID(ctx, req.GroupID, repID)

	// ถ้าไม่มีชื่อ ใช้ชื่อช่างแทน หรือ "ไม่ระบุชื่อ"
	customerName := req.CustomerName
	if customerName == "" {
		if req.ContractorName != "" {
			customerName = "ช่าง" + req.ContractorName
		} else {
			customerName = "ไม่ระบุชื่อ"
		}
	}

	site := &models.Site{
		BaseModel:         models.BaseModel{ID: siteID},
		SiteCode:          siteCode,
		CustomerName:      customerName,
		CustomerType:      req.CustomerType,
		ContractorName:    req.ContractorName,
		Phone:             normalizePhone(req.Phone),
		Latitude:          req.Latitude,
		Longitude:         req.Longitude,
		Tambon:            req.Tambon,
		Amphoe:            req.Amphoe,
		Province:          req.Province,
		Postcode:          req.Postcode,
		Stage:             firstNonEmpty(req.Stage, "new"),
		Status:            "following",
		ExpectedOrderDate:  expectedDate,
		ExpectedOrderText:  expectedOrderText,
		NextFollowUpDate:   followUpDate,
		OwnerRepID:        repID,
		GroupID:           resolvedGroupID,
		ReportCount:       1,
		LastReportAt:      &now,
	}

	var idempotencyKeyPtr *string
	if req.IdempotencyKey != "" {
		idempotencyKeyPtr = &req.IdempotencyKey
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
		IdempotencyKey:   idempotencyKeyPtr,
	}

	err = s.txManager.WithTx(ctx, func(txCtx context.Context) error {
		if err := s.siteRepo.Create(txCtx, site); err != nil {
			return fmt.Errorf("create site: %w", err)
		}

		if err := s.reportRepo.Create(txCtx, report); err != nil {
			return fmt.Errorf("create report: %w", err)
		}

		// Create contacts (multi-contact support)
		if len(req.Contacts) > 0 {
			for i, c := range req.Contacts {
				contact := &models.Contact{
					BaseModel:   models.BaseModel{ID: uuid.New()},
					SiteID:      siteID,
					Name:        c.Name,
					Phone:       normalizePhone(c.Phone),
					ContactType: c.ContactType,
					Authority:   c.Authority,
					IsPrimary:   i == 0,
				}
				if err := s.contactRepo.Create(txCtx, contact); err != nil {
					return fmt.Errorf("create contact: %w", err)
				}
			}
		} else if req.Phone != "" {
			// Backward compatible: รับ phone เดี่ยวแบบเดิม
			contact := &models.Contact{
				BaseModel: models.BaseModel{ID: uuid.New()},
				SiteID:    siteID,
				Phone:     normalizePhone(req.Phone),
				IsPrimary: true,
			}
			if err := s.contactRepo.Create(txCtx, contact); err != nil {
				return fmt.Errorf("create contact: %w", err)
			}
		}

		// Link photos to report (เช็ค ownership)
		if len(req.PhotoIDs) > 0 {
			photoUUIDs := make([]uuid.UUID, 0, len(req.PhotoIDs))
			for _, id := range req.PhotoIDs {
				if uid, err := uuid.Parse(id); err == nil {
					photoUUIDs = append(photoUUIDs, uid)
				}
			}
			if len(photoUUIDs) > 0 {
				if err := s.mediaRepo.UpdateReportIDByOwner(txCtx, photoUUIDs, reportID, repID); err != nil {
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
	lineMessages := BuildNewSiteMessages(site, report, repName, photoURLs, s.liffID)

	// ส่งผ่าน liff.sendMessages() (ฟรี) — return chatMessages ให้ frontend ส่งเอง
	// ไม่ใช้ Push API เพื่อประหยัดโควต้า

	return &dto.CreateSiteResponse{
		Site: dto.SiteBrief{
			SiteCode:       site.SiteCode,
			CustomerName:   site.CustomerName,
			CustomerType:   site.CustomerType,
			ContractorName: site.ContractorName,

			Phone:          site.Phone,
			Status:         site.Status,
			Stage:          site.Stage,
			Amphoe:         site.Amphoe,
			Tambon:         site.Tambon,
			Province:       site.Province,
			Postcode:       site.Postcode,
			ReportCount:    site.ReportCount,
			LastReportAt:   site.LastReportAt,
			IsMine:         true,
			OwnerName:      repName,
			CreatedAt:      site.CreatedAt,
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
		MessageSent:  false,
		ChatMessages: lineMessages,
	}, nil
}

func (s *siteServiceImpl) CheckDuplicate(ctx context.Context, phone string, lat, lng *float64, customerName string, callerRepID *uuid.UUID) (*dto.DuplicateCheckResponse, error) {
	resp := &dto.DuplicateCheckResponse{}
	matched := make(map[string]bool) // track siteCode เพื่อไม่ให้ซ้ำ

	// helper สร้าง match + set isMine
	addMatch := func(site models.Site, reason string, distM *int) {
		owner, _ := s.salesRepRepo.GetByID(ctx, site.OwnerRepID)
		ownerName := ""
		if owner != nil {
			ownerName = owner.DisplayName
		}
		isMine := callerRepID != nil && site.OwnerRepID == *callerRepID
		resp.Matches = append(resp.Matches, dto.DuplicateMatch{
			SiteCode:     site.SiteCode,
			CustomerName: site.CustomerName,
			Phone:        site.Phone,
			Reason:       reason,
			DistanceM:    distM,
			OwnerName:    ownerName,
			Status:       site.Status,
			IsMine:       isMine,
		})
		matched[site.SiteCode] = true
	}

	// Check by phone
	if phone != "" {
		sites, err := s.siteRepo.GetByPhone(ctx, normalizePhone(phone))
		if err == nil {
			for _, site := range sites {
				if site.Status == "following" {
					addMatch(site, "phone", nil)
				}
			}
		}
	}

	// Check by location (300m radius)
	if lat != nil && lng != nil {
		nearbySites, err := s.siteRepo.FindNearby(ctx, *lat, *lng, 300)
		if err == nil {
			for _, site := range nearbySites {
				if matched[site.SiteCode] {
					continue
				}
				dist := haversineDistance(*lat, *lng, *site.Latitude, *site.Longitude)
				distInt := int(math.Round(dist))
				addMatch(site, "nearby", &distInt)
			}
		}
	}

	// Check by customer name (fuzzy match, threshold 0.3)
	if customerName != "" {
		nameSites, err := s.siteRepo.FindByNameSimilar(ctx, customerName, 0.3)
		if err == nil {
			for _, site := range nameSites {
				if matched[site.SiteCode] {
					continue
				}
				addMatch(site, "name", nil)
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

	// รวมรูปทั้งหมดจากทุก report
	var allPhotos []dto.PhotoBrief
	for _, rb := range reportBriefs {
		allPhotos = append(allPhotos, rb.Photos...)
	}

	// Contacts
	contacts, _ := s.contactRepo.GetBySiteID(ctx, site.ID)
	contactBriefs := make([]dto.ContactBrief, 0, len(contacts))
	for _, c := range contacts {
		contactBriefs = append(contactBriefs, dto.ContactBrief{
			ID:          c.ID.String(),
			Name:        c.Name,
			Phone:       c.Phone,
			ContactType: c.ContactType,
			Authority:   c.Authority,
			Role:        c.Role,
			IsPrimary:   c.IsPrimary,
		})
	}

	return &dto.SiteDetailResponse{
		SiteCode:          site.SiteCode,
		CustomerName:      site.CustomerName,
		CustomerType:      site.CustomerType,
		ContractorName:    site.ContractorName,

		Phone:             site.Phone,
		Latitude:          site.Latitude,
		Longitude:         site.Longitude,
		Tambon:            site.Tambon,
		Amphoe:            site.Amphoe,
		Province:          site.Province,
		Postcode:          site.Postcode,
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
		ClosedAt:          site.ClosedAt,
		Reports:           reportBriefs,
		Photos:            allPhotos,
		Contacts:          contactBriefs,
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
			CustomerType:     site.CustomerType,
			ContractorName:   site.ContractorName,
			Phone:            site.Phone,
			Status:           site.Status,
			Stage:            site.Stage,
			Amphoe:           site.Amphoe,
			Tambon:           site.Tambon,
			Province:         site.Province,
			Postcode:         site.Postcode,
			NextFollowUpDate: followUpStr,
			LastReportAt:     site.LastReportAt,
			IsMine:           isMine,
			OwnerName:        ownerName,
			ReportCount:      site.ReportCount,
			CreatedAt:        site.CreatedAt,
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

		NextFollowUpDate: followUpDate,
		ReportDate:       now,
		Source:           "liff",
	}

	// Update site
	site.Status = req.Status
	if req.Status == "won" || req.Status == "lost" || req.Status == "cancelled" {
		site.ClosedAt = &now
	}
	if req.Stage != "" {
		site.Stage = req.Stage
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
				if err := s.mediaRepo.UpdateReportIDByOwner(txCtx, photoUUIDs, reportID, repID); err != nil {
					return err
				}
			}
		}
		// Replace contacts ถ้าส่ง contacts array มา
		if req.Contacts != nil {
			_ = s.contactRepo.DeleteBySiteID(txCtx, site.ID)
			for i, c := range req.Contacts {
				contact := &models.Contact{
					BaseModel:   models.BaseModel{ID: uuid.New()},
					SiteID:      site.ID,
					Name:        c.Name,
					Phone:       normalizePhone(c.Phone),
					ContactType: c.ContactType,
					Authority:   c.Authority,
					IsPrimary:   i == 0,
				}
				_ = s.contactRepo.Create(txCtx, contact)
			}
		} else if req.NewPhone != "" {
			// Backward compat: เพิ่ม contact เดี่ยว
			newPhone := normalizePhone(req.NewPhone)
			if newPhone != "" && newPhone != site.Phone {
				contact := &models.Contact{
					BaseModel: models.BaseModel{ID: uuid.New()},
					Phone:     newPhone,
					SiteID:    site.ID,
					IsPrimary: false,
				}
				_ = s.contactRepo.Create(txCtx, contact)
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
	lineMessages := BuildFollowUpMessages(site, report, repName, photoURLs, s.liffID)

	// ส่งผ่าน liff.sendMessages() (ฟรี) — return chatMessages ให้ frontend ส่งเอง

	var followUpStr *string
	if site.NextFollowUpDate != nil {
		s := site.NextFollowUpDate.Format("2006-01-02")
		followUpStr = &s
	}

	return &dto.CreateFollowUpResponse{
		Site: dto.SiteBrief{
			SiteCode:         site.SiteCode,
			CustomerName:     site.CustomerName,
			CustomerType:     site.CustomerType,
			ContractorName:   site.ContractorName,
			Phone:            site.Phone,
			Status:           site.Status,
			Stage:            site.Stage,
			Amphoe:           site.Amphoe,
			Tambon:           site.Tambon,
			Province:         site.Province,
			Postcode:         site.Postcode,
			NextFollowUpDate: followUpStr,
			LastReportAt:     site.LastReportAt,
			ReportCount:      site.ReportCount,
			IsMine:           true,
			OwnerName:        repName,
			CreatedAt:        site.CreatedAt,
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
		MessageSent:  false,
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
	if req.Phone != nil {
		site.Phone = normalizePhone(*req.Phone)
	}
	if req.Amphoe != nil {
		site.Amphoe = *req.Amphoe
	}
	if req.Stage != nil {
		site.Stage = *req.Stage
	}
	if req.Status != nil {
		site.Status = *req.Status
		// Set closed_at เมื่อเปลี่ยนเป็น won/lost/cancelled
		if *req.Status == "won" || *req.Status == "lost" || *req.Status == "cancelled" {
			if site.ClosedAt == nil {
				now := time.Now()
				site.ClosedAt = &now
			}
		} else if *req.Status == "following" {
			// เปิดงานกลับมาตามต่อ — ลบ closed_at
			site.ClosedAt = nil
		}
	}
	if req.LostReason != nil {
		site.LostReason = *req.LostReason
	}
	if req.Competitor != nil {
		site.Competitor = *req.Competitor
	}

	if err := s.siteRepo.Update(ctx, site); err != nil {
		return err
	}

	// Replace contacts ถ้าส่งมา
	if req.Contacts != nil {
		_ = s.contactRepo.DeleteBySiteID(ctx, site.ID)
		for i, c := range req.Contacts {
			contact := &models.Contact{
				BaseModel:   models.BaseModel{ID: uuid.New()},
				SiteID:      site.ID,
				Name:        c.Name,
				Phone:       normalizePhone(c.Phone),
				ContactType: c.ContactType,
				Authority:   c.Authority,
				Role:        c.Role,
				IsPrimary:   i == 0,
			}
			_ = s.contactRepo.Create(ctx, contact)
		}
	}

	return nil
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

func (s *siteServiceImpl) GetMyStats(ctx context.Context, repID uuid.UUID, period string) (*dto.MyStatsResponse, error) {
	since := periodToSince(period)

	// 1. นับ reports ของ rep (วิ่งงาน / งานใหม่)
	running, newJobs, err := s.reportRepo.CountByRepAndType(ctx, repID, since)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to count rep reports", "error", err)
		return nil, err
	}

	// 2. นับ sites ของ rep แยกตาม status (outcomes)
	siteCounts, err := s.siteRepo.CountByRepAndStatus(ctx, repID, since)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to count rep sites", "error", err)
		return nil, err
	}

	won := siteCounts["won"]
	following := siteCounts["following"]
	lost := siteCounts["lost"]
	completed := won + lost // งานที่จบทั้งหมด

	// 3. Close rate = won / (won + lost) * 100
	var closeRate float64
	if won+lost > 0 {
		closeRate = math.Round(float64(won) / float64(won+lost) * 100)
	}

	// 4. Team stats
	var teamCloseRate, teamAvgRunning, teamAvgNewJobs *float64

	teamSiteCounts, err := s.siteRepo.CountByStatus(ctx, since)
	if err == nil {
		teamWon := teamSiteCounts["won"]
		teamLost := teamSiteCounts["lost"]
		if teamWon+teamLost > 0 {
			rate := math.Round(float64(teamWon) / float64(teamWon+teamLost) * 100)
			teamCloseRate = &rate
		}
	}

	teamTotal, teamNew, repCount, err := s.reportRepo.CountByType(ctx, since)
	if err == nil && repCount > 0 {
		avgRun := math.Round(float64(teamTotal) / float64(repCount))
		avgNew := math.Round(float64(teamNew) / float64(repCount))
		teamAvgRunning = &avgRun
		teamAvgNewJobs = &avgNew
	}

	// 5. Overdue
	overdue, _ := s.siteRepo.CountOverdue(ctx, repID)

	return &dto.MyStatsResponse{
		Running:        running,
		NewJobs:        newJobs,
		Completed:      completed,
		CloseRate:      closeRate,
		TeamCloseRate:  teamCloseRate,
		TeamAvgRunning: teamAvgRunning,
		TeamAvgNewJobs: teamAvgNewJobs,
		Outcomes: dto.StatsOutcomes{
			Won:       won,
			Following: following,
			Lost:      lost,
		},
		OnTimeRate: nil, // TODO: ต้องเพิ่ม due_date_before ใน DB ก่อน
		Overdue:    overdue,
	}, nil
}

func periodToSince(period string) time.Time {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)
	switch period {
	case "week":
		// จันทร์ของสัปดาห์นี้
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		return time.Date(now.Year(), now.Month(), now.Day()-(weekday-1), 0, 0, 0, 0, loc)
	case "year":
		return time.Date(now.Year(), 1, 1, 0, 0, 0, 0, loc)
	default: // month
		return time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	}
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
