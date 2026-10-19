package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type mediaFileRepository struct {
	db *gorm.DB
}

func NewMediaFileRepository(db *gorm.DB) *mediaFileRepository {
	return &mediaFileRepository{db: db}
}

func (r *mediaFileRepository) Create(ctx context.Context, file *models.MediaFile) error {
	return postgres.GetDB(ctx, r.db).Create(file).Error
}

func (r *mediaFileRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.MediaFile, error) {
	var file models.MediaFile
	err := postgres.GetDB(ctx, r.db).First(&file, id).Error
	return &file, err
}

func (r *mediaFileRepository) GetByReportID(ctx context.Context, reportID uuid.UUID) ([]models.MediaFile, error) {
	var files []models.MediaFile
	err := postgres.GetDB(ctx, r.db).Where("report_id = ?", reportID).Find(&files).Error
	return files, err
}

func (r *mediaFileRepository) UpdateReportID(ctx context.Context, ids []uuid.UUID, reportID uuid.UUID) error {
	return postgres.GetDB(ctx, r.db).
		Model(&models.MediaFile{}).
		Where("id IN ?", ids).
		Update("report_id", reportID).Error
}

func (r *mediaFileRepository) UpdateReportIDByOwner(ctx context.Context, ids []uuid.UUID, reportID uuid.UUID, ownerRepID uuid.UUID) error {
	return postgres.GetDB(ctx, r.db).
		Model(&models.MediaFile{}).
		Where("id IN ? AND rep_id = ?", ids, ownerRepID).
		Update("report_id", reportID).Error
}
