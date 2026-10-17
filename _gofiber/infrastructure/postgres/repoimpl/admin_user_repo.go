package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type adminUserRepository struct {
	db *gorm.DB
}

func NewAdminUserRepository(db *gorm.DB) *adminUserRepository {
	return &adminUserRepository{db: db}
}

func (r *adminUserRepository) Create(ctx context.Context, user *models.AdminUser) error {
	return postgres.GetDB(ctx, r.db).Create(user).Error
}

func (r *adminUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AdminUser, error) {
	var user models.AdminUser
	err := postgres.GetDB(ctx, r.db).First(&user, id).Error
	return &user, err
}

func (r *adminUserRepository) GetByEmail(ctx context.Context, email string) (*models.AdminUser, error) {
	var user models.AdminUser
	err := postgres.GetDB(ctx, r.db).Where("email = ?", email).First(&user).Error
	return &user, err
}
