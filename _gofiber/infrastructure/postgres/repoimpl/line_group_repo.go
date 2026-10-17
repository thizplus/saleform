package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type lineGroupRepository struct {
	db *gorm.DB
}

func NewLineGroupRepository(db *gorm.DB) *lineGroupRepository {
	return &lineGroupRepository{db: db}
}

func (r *lineGroupRepository) Create(ctx context.Context, group *models.LineGroup) error {
	return postgres.GetDB(ctx, r.db).Create(group).Error
}

func (r *lineGroupRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.LineGroup, error) {
	var group models.LineGroup
	err := postgres.GetDB(ctx, r.db).First(&group, id).Error
	return &group, err
}

func (r *lineGroupRepository) GetByGroupID(ctx context.Context, groupID string) (*models.LineGroup, error) {
	var group models.LineGroup
	err := postgres.GetDB(ctx, r.db).Where("group_id = ?", groupID).First(&group).Error
	return &group, err
}

func (r *lineGroupRepository) Update(ctx context.Context, group *models.LineGroup) error {
	return postgres.GetDB(ctx, r.db).Save(group).Error
}

func (r *lineGroupRepository) List(ctx context.Context) ([]models.LineGroup, error) {
	var groups []models.LineGroup
	err := postgres.GetDB(ctx, r.db).Order("created_at DESC").Find(&groups).Error
	return groups, err
}
