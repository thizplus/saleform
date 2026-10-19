package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type contactRepository struct {
	db *gorm.DB
}

func NewContactRepository(db *gorm.DB) *contactRepository {
	return &contactRepository{db: db}
}

func (r *contactRepository) Create(ctx context.Context, contact *models.Contact) error {
	return postgres.GetDB(ctx, r.db).Create(contact).Error
}

func (r *contactRepository) GetBySiteID(ctx context.Context, siteID uuid.UUID) ([]models.Contact, error) {
	var contacts []models.Contact
	err := postgres.GetDB(ctx, r.db).Where("site_id = ?", siteID).Find(&contacts).Error
	return contacts, err
}

func (r *contactRepository) GetByPhone(ctx context.Context, phone string) ([]models.Contact, error) {
	var contacts []models.Contact
	err := postgres.GetDB(ctx, r.db).Where("phone = ?", phone).Find(&contacts).Error
	return contacts, err
}

func (r *contactRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return postgres.GetDB(ctx, r.db).Delete(&models.Contact{}, id).Error
}

func (r *contactRepository) DeleteBySiteID(ctx context.Context, siteID uuid.UUID) error {
	return postgres.GetDB(ctx, r.db).Where("site_id = ?", siteID).Delete(&models.Contact{}).Error
}
