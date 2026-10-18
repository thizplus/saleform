package repositories

import (
	"context"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type AdminUserRepository interface {
	Create(ctx context.Context, user *models.AdminUser) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.AdminUser, error)
	GetByEmail(ctx context.Context, email string) (*models.AdminUser, error)
	List(ctx context.Context) ([]models.AdminUser, error)
	Update(ctx context.Context, user *models.AdminUser) error
}
