package repositories

import (
	"context"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type SalesRepRepository interface {
	Create(ctx context.Context, rep *models.SalesRep) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SalesRep, error)
	GetByLineUserID(ctx context.Context, lineUserID string) (*models.SalesRep, error)
	Update(ctx context.Context, rep *models.SalesRep) error
	List(ctx context.Context) ([]models.SalesRep, error)
	ListActive(ctx context.Context) ([]models.SalesRep, error)
}
