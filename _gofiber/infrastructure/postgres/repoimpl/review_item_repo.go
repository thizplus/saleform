package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type reviewItemRepository struct {
	db *gorm.DB
}

func NewReviewItemRepository(db *gorm.DB) *reviewItemRepository {
	return &reviewItemRepository{db: db}
}

func (r *reviewItemRepository) Create(ctx context.Context, item *models.ReviewItem) error {
	return postgres.GetDB(ctx, r.db).Create(item).Error
}

func (r *reviewItemRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ReviewItem, error) {
	var item models.ReviewItem
	err := postgres.GetDB(ctx, r.db).First(&item, id).Error
	return &item, err
}

func (r *reviewItemRepository) ListPending(ctx context.Context, page, limit int) ([]models.ReviewItem, int64, error) {
	db := postgres.GetDB(ctx, r.db).Model(&models.ReviewItem{}).Where("status = 'pending'")

	var total int64
	db.Count(&total)

	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}

	var items []models.ReviewItem
	err := db.Order("created_at DESC").Offset((page - 1) * limit).Limit(limit).Find(&items).Error
	return items, total, err
}

func (r *reviewItemRepository) Update(ctx context.Context, item *models.ReviewItem) error {
	return postgres.GetDB(ctx, r.db).Save(item).Error
}
