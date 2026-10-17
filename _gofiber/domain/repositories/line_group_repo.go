package repositories

import (
	"context"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type LineGroupRepository interface {
	Create(ctx context.Context, group *models.LineGroup) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.LineGroup, error)
	GetByGroupID(ctx context.Context, groupID string) (*models.LineGroup, error)
	Update(ctx context.Context, group *models.LineGroup) error
	List(ctx context.Context) ([]models.LineGroup, error)
}
