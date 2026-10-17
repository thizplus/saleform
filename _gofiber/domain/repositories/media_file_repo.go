package repositories

import (
	"context"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type MediaFileRepository interface {
	Create(ctx context.Context, file *models.MediaFile) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.MediaFile, error)
	GetByReportID(ctx context.Context, reportID uuid.UUID) ([]models.MediaFile, error)
	UpdateReportID(ctx context.Context, ids []uuid.UUID, reportID uuid.UUID) error
}
