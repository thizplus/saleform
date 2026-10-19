package repositories

import (
	"context"
	"time"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type CheckInRepository interface {
	Create(ctx context.Context, checkIn *models.DailyCheckIn) error
	GetByRepAndDate(ctx context.Context, repID uuid.UUID, date time.Time) (*models.DailyCheckIn, error)
	GetLatestByRep(ctx context.Context, repID uuid.UUID) (*models.DailyCheckIn, error)
	ListByDate(ctx context.Context, date time.Time) ([]models.DailyCheckIn, error)
	ListByRep(ctx context.Context, repID uuid.UUID, from, to time.Time) ([]models.DailyCheckIn, error)
}
