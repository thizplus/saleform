package serviceimpl

import (
	"context"
	"errors"
	"math"
	"time"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/models"
	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/logger"

	"github.com/google/uuid"
)

type checkInServiceImpl struct {
	checkInRepo repositories.CheckInRepository
	repRepo     repositories.SalesRepRepository
	r2PublicURL string
}

func NewCheckInService(
	checkInRepo repositories.CheckInRepository,
	repRepo repositories.SalesRepRepository,
	r2PublicURL string,
) *checkInServiceImpl {
	return &checkInServiceImpl{
		checkInRepo: checkInRepo,
		repRepo:     repRepo,
		r2PublicURL: r2PublicURL,
	}
}

func (s *checkInServiceImpl) CheckIn(ctx context.Context, repID uuid.UUID, req *dto.CheckInRequest) (*dto.CheckInResponse, error) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	today := time.Now().In(loc)
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, loc)

	// เช็คว่าวันนี้เช็คอินแล้วหรือยัง
	existing, _ := s.checkInRepo.GetByRepAndDate(ctx, repID, todayDate)
	if existing != nil {
		return nil, errors.New("วันนี้เช็คอินแล้ว")
	}

	// คำนวณระยะทาง (ไมล์วันนี้ - ไมล์ครั้งก่อน)
	var dailyKM *int
	prev, err := s.checkInRepo.GetLatestByRep(ctx, repID)
	if err == nil && prev != nil && req.Mileage > prev.Mileage {
		km := req.Mileage - prev.Mileage
		dailyKM = &km
	}

	// สร้าง selfie URL
	selfieURL := ""
	if req.SelfieKey != "" && s.r2PublicURL != "" {
		selfieURL = s.r2PublicURL + "/" + req.SelfieKey
	}

	checkIn := &models.DailyCheckIn{
		BaseModel:    models.BaseModel{ID: uuid.New()},
		RepID:        repID,
		CheckInDate:  todayDate,
		LicensePlate: req.LicensePlate,
		Mileage:      req.Mileage,
		SelfieURL:    selfieURL,
		SelfieKey:    req.SelfieKey,
		DailyKM:      dailyKM,
	}

	if err := s.checkInRepo.Create(ctx, checkIn); err != nil {
		logger.ErrorContext(ctx, "Failed to create check-in", "error", err)
		return nil, errors.New("ไม่สามารถเช็คอินได้")
	}

	logger.InfoContext(ctx, "Daily check-in created", "rep_id", repID, "mileage", req.Mileage)

	// สร้าง chat messages สำหรับส่งเข้ากลุ่ม LINE
	rep, _ := s.repRepo.GetByID(ctx, repID)
	repName := ""
	if rep != nil {
		repName = rep.DisplayName
		if rep.Nickname != "" {
			repName = rep.Nickname
		}
	}
	chatMessages := BuildCheckInMessages(repName, checkIn.LicensePlate, checkIn.Mileage, checkIn.DailyKM, checkIn.SelfieURL)

	return &dto.CheckInResponse{
		ID:           checkIn.ID.String(),
		CheckInDate:  todayDate.Format("2006-01-02"),
		LicensePlate: checkIn.LicensePlate,
		Mileage:      checkIn.Mileage,
		SelfieURL:    checkIn.SelfieURL,
		DailyKM:      checkIn.DailyKM,
		CreatedAt:    checkIn.CreatedAt,
		ChatMessages: chatMessages,
	}, nil
}

func (s *checkInServiceImpl) GetStatus(ctx context.Context, repID uuid.UUID) (*dto.CheckInStatusResponse, error) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	today := time.Now().In(loc)
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, loc)

	resp := &dto.CheckInStatusResponse{}

	// เช็ควันนี้
	todayCheckIn, _ := s.checkInRepo.GetByRepAndDate(ctx, repID, todayDate)
	if todayCheckIn != nil {
		resp.CheckedIn = true
		resp.Today = &dto.CheckInResponse{
			ID:           todayCheckIn.ID.String(),
			CheckInDate:  todayDate.Format("2006-01-02"),
			LicensePlate: todayCheckIn.LicensePlate,
			Mileage:      todayCheckIn.Mileage,
			SelfieURL:    todayCheckIn.SelfieURL,
			DailyKM:      todayCheckIn.DailyKM,
			CreatedAt:    todayCheckIn.CreatedAt,
		}
	}

	// ข้อมูลล่าสุด (pre-fill)
	latest, _ := s.checkInRepo.GetLatestByRep(ctx, repID)
	if latest != nil {
		resp.LastPlate = latest.LicensePlate
		resp.LastMileage = latest.Mileage
	}

	return resp, nil
}

func (s *checkInServiceImpl) ListByDate(ctx context.Context, date time.Time) ([]dto.AdminCheckInRow, error) {
	checkIns, err := s.checkInRepo.ListByDate(ctx, date)
	if err != nil {
		return nil, err
	}

	rows := make([]dto.AdminCheckInRow, 0, len(checkIns))
	for _, ci := range checkIns {
		rep, _ := s.repRepo.GetByID(ctx, ci.RepID)
		repName := ""
		pictureURL := ""
		if rep != nil {
			repName = rep.DisplayName
			if rep.Nickname != "" {
				repName = rep.Nickname
			}
			pictureURL = rep.PictureURL
		}
		rows = append(rows, dto.AdminCheckInRow{
			ID:           ci.ID.String(),
			RepID:        ci.RepID.String(),
			RepName:      repName,
			PictureURL:   pictureURL,
			CheckInDate:  ci.CheckInDate.Format("2006-01-02"),
			LicensePlate: ci.LicensePlate,
			Mileage:      ci.Mileage,
			SelfieURL:    ci.SelfieURL,
			DailyKM:      ci.DailyKM,
			CreatedAt:    ci.CreatedAt,
		})
	}

	return rows, nil
}

func (s *checkInServiceImpl) RepSummary(ctx context.Context, repID uuid.UUID, from, to time.Time) (*dto.CheckInSummaryResponse, error) {
	totalKM, days, err := s.checkInRepo.SummaryByRep(ctx, repID, from, to)
	if err != nil {
		return nil, err
	}

	rep, _ := s.repRepo.GetByID(ctx, repID)
	repName, pictureURL := "", ""
	if rep != nil {
		repName = rep.DisplayName
		if rep.Nickname != "" {
			repName = rep.Nickname
		}
		pictureURL = rep.PictureURL
	}

	var avgKM float64
	if days > 0 {
		avgKM = float64(totalKM) / float64(days)
		avgKM = math.Round(avgKM*10) / 10
	}

	entries, _ := s.checkInRepo.ListByRep(ctx, repID, from, to)
	entryBriefs := make([]dto.CheckInEntryBrief, 0, len(entries))
	for _, e := range entries {
		entryBriefs = append(entryBriefs, dto.CheckInEntryBrief{
			Date:         e.CheckInDate.Format("2006-01-02"),
			Mileage:      e.Mileage,
			DailyKM:      e.DailyKM,
			LicensePlate: e.LicensePlate,
		})
	}

	return &dto.CheckInSummaryResponse{
		RepID:       repID.String(),
		RepName:     repName,
		PictureURL:  pictureURL,
		Period:      from.Format("2006-01-02") + "~" + to.Format("2006-01-02"),
		TotalKM:     totalKM,
		Days:        days,
		AvgKMPerDay: avgKM,
		Entries:     entryBriefs,
	}, nil
}

func (s *checkInServiceImpl) TeamSummary(ctx context.Context, from, to time.Time) (*dto.TeamCheckInSummary, error) {
	rows, err := s.checkInRepo.SummaryAllReps(ctx, from, to)
	if err != nil {
		return nil, err
	}

	reps := make([]dto.CheckInSummaryResponse, 0, len(rows))
	for _, r := range rows {
		rep, _ := s.repRepo.GetByID(ctx, r.RepID)
		repName, pictureURL := "", ""
		if rep != nil {
			repName = rep.DisplayName
			if rep.Nickname != "" {
				repName = rep.Nickname
			}
			pictureURL = rep.PictureURL
		}
		var avgKM float64
		if r.Days > 0 {
			avgKM = math.Round(float64(r.TotalKM)/float64(r.Days)*10) / 10
		}
		reps = append(reps, dto.CheckInSummaryResponse{
			RepID:       r.RepID.String(),
			RepName:     repName,
			PictureURL:  pictureURL,
			TotalKM:     r.TotalKM,
			Days:        r.Days,
			AvgKMPerDay: avgKM,
		})
	}

	return &dto.TeamCheckInSummary{
		Period: from.Format("2006-01-02") + "~" + to.Format("2006-01-02"),
		Reps:   reps,
	}, nil
}
