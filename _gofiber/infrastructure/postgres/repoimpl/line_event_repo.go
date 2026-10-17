package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type lineEventRepository struct {
	db *gorm.DB
}

func NewLineEventRepository(db *gorm.DB) *lineEventRepository {
	return &lineEventRepository{db: db}
}

func (r *lineEventRepository) Create(ctx context.Context, event *models.LineEvent) error {
	return postgres.GetDB(ctx, r.db).Create(event).Error
}

func (r *lineEventRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.LineEvent, error) {
	var event models.LineEvent
	err := postgres.GetDB(ctx, r.db).First(&event, id).Error
	return &event, err
}

func (r *lineEventRepository) GetByMessageID(ctx context.Context, messageID string) (*models.LineEvent, error) {
	var event models.LineEvent
	err := postgres.GetDB(ctx, r.db).Where("message_id = ?", messageID).First(&event).Error
	return &event, err
}

func (r *lineEventRepository) GetUnprocessed(ctx context.Context, limit int) ([]models.LineEvent, error) {
	var events []models.LineEvent
	err := postgres.GetDB(ctx, r.db).
		Where("processed = ?", false).
		Order("timestamp ASC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

func (r *lineEventRepository) MarkProcessed(ctx context.Context, id uuid.UUID, bundleID *uuid.UUID) error {
	return postgres.GetDB(ctx, r.db).
		Model(&models.LineEvent{}).
		Where("id = ?", id).
		Updates(map[string]any{"processed": true, "bundle_id": bundleID}).Error
}
