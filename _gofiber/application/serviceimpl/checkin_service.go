package serviceimpl

import (
	"context"
	"errors"
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

	return &dto.CheckInResponse{
		ID:           checkIn.ID.String(),
		CheckInDate:  todayDate.Format("2006-01-02"),
		LicensePlate: checkIn.LicensePlate,
		Mileage:      checkIn.Mileage,
		SelfieURL:    checkIn.SelfieURL,
		DailyKM:      checkIn.DailyKM,
		CreatedAt:    checkIn.CreatedAt,
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
