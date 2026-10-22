package repoimpl

import (
	"context"
	"time"

	"line-sales-api/domain/models"
	"line-sales-api/domain/repositories"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type checkInRepository struct {
	db *gorm.DB
}

func NewCheckInRepository(db *gorm.DB) *checkInRepository {
	return &checkInRepository{db: db}
}

func (r *checkInRepository) Create(ctx context.Context, checkIn *models.DailyCheckIn) error {
	return postgres.GetDB(ctx, r.db).Create(checkIn).Error
}

func (r *checkInRepository) Update(ctx context.Context, checkIn *models.DailyCheckIn) error {
	return postgres.GetDB(ctx, r.db).Save(checkIn).Error
}

func (r *checkInRepository) GetByRepAndDate(ctx context.Context, repID uuid.UUID, date time.Time) (*models.DailyCheckIn, error) {
	var checkIn models.DailyCheckIn
	err := postgres.GetDB(ctx, r.db).
		Where("rep_id = ? AND check_in_date = ?", repID, date).
		First(&checkIn).Error
	if err != nil {
		return nil, err
	}
	return &checkIn, nil
}

func (r *checkInRepository) GetLatestByRep(ctx context.Context, repID uuid.UUID) (*models.DailyCheckIn, error) {
	var checkIn models.DailyCheckIn
	err := postgres.GetDB(ctx, r.db).
		Where("rep_id = ?", repID).
		Order("check_in_date DESC").
		First(&checkIn).Error
	if err != nil {
		return nil, err
	}
	return &checkIn, nil
}

func (r *checkInRepository) ListByDate(ctx context.Context, date time.Time) ([]models.DailyCheckIn, error) {
	var checkIns []models.DailyCheckIn
	err := postgres.GetDB(ctx, r.db).
		Where("check_in_date = ?", date).
		Order("created_at ASC").
		Find(&checkIns).Error
	return checkIns, err
}

func (r *checkInRepository) ListByRep(ctx context.Context, repID uuid.UUID, from, to time.Time) ([]models.DailyCheckIn, error) {
	var checkIns []models.DailyCheckIn
	err := postgres.GetDB(ctx, r.db).
		Where("rep_id = ? AND check_in_date >= ? AND check_in_date <= ?", repID, from, to).
		Order("check_in_date DESC").
		Find(&checkIns).Error
	return checkIns, err
}

func (r *checkInRepository) SummaryByRep(ctx context.Context, repID uuid.UUID, from, to time.Time) (int, int, error) {
	type result struct {
		TotalKM int
		Days    int
	}
	var res result
	err := postgres.GetDB(ctx, r.db).
		Table("daily_check_ins").
		Select("COALESCE(SUM(daily_km), 0) as total_km, COUNT(*) as days").
		Where("rep_id = ? AND check_in_date >= ? AND check_in_date <= ? AND deleted_at IS NULL", repID, from, to).
		Scan(&res).Error
	return res.TotalKM, res.Days, err
}

func (r *checkInRepository) SummaryAllReps(ctx context.Context, from, to time.Time) ([]repositories.RepCheckInSummaryRow, error) {
	var rows []repositories.RepCheckInSummaryRow
	err := postgres.GetDB(ctx, r.db).
		Table("daily_check_ins").
		Select("rep_id, COALESCE(SUM(daily_km), 0) as total_km, COUNT(*) as days").
		Where("check_in_date >= ? AND check_in_date <= ? AND deleted_at IS NULL", from, to).
		Group("rep_id").
		Scan(&rows).Error
	return rows, err
}
