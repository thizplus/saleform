package repoimpl

import (
	"context"
	"time"

	"line-sales-api/domain/models"
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
