package repositories

import (
	"context"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type ReviewItemRepository interface {
	Create(ctx context.Context, item *models.ReviewItem) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.ReviewItem, error)
	ListPending(ctx context.Context, page, limit int) ([]models.ReviewItem, int64, error)
	Update(ctx context.Context, item *models.ReviewItem) error
}
