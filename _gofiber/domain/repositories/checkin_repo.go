package repositories

import (
	"context"
	"time"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type CheckInRepository interface {
	Create(ctx context.Context, checkIn *models.DailyCheckIn) error
	Update(ctx context.Context, checkIn *models.DailyCheckIn) error
	GetByRepAndDate(ctx context.Context, repID uuid.UUID, date time.Time) (*models.DailyCheckIn, error)
	GetLatestByRep(ctx context.Context, repID uuid.UUID) (*models.DailyCheckIn, error)
	ListByDate(ctx context.Context, date time.Time) ([]models.DailyCheckIn, error)
	ListByRep(ctx context.Context, repID uuid.UUID, from, to time.Time) ([]models.DailyCheckIn, error)
	SummaryByRep(ctx context.Context, repID uuid.UUID, from, to time.Time) (totalKM int, days int, err error)
	SummaryAllReps(ctx context.Context, from, to time.Time) ([]RepCheckInSummaryRow, error)
}

type RepCheckInSummaryRow struct {
	RepID   uuid.UUID
	TotalKM int
	Days    int
}
