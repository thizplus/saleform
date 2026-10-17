package repositories

import (
	"context"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type ContactRepository interface {
	Create(ctx context.Context, contact *models.Contact) error
	GetBySiteID(ctx context.Context, siteID uuid.UUID) ([]models.Contact, error)
	GetByPhone(ctx context.Context, phone string) ([]models.Contact, error)
}
