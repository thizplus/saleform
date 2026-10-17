package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/domain/repositories"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type siteReportRepository struct {
	db *gorm.DB
}

func NewSiteReportRepository(db *gorm.DB) *siteReportRepository {
	return &siteReportRepository{db: db}
}

func (r *siteReportRepository) Create(ctx context.Context, report *models.SiteReport) error {
	return postgres.GetDB(ctx, r.db).Create(report).Error
}

func (r *siteReportRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SiteReport, error) {
	var report models.SiteReport
	err := postgres.GetDB(ctx, r.db).Preload("Photos").First(&report, id).Error
	return &report, err
}

func (r *siteReportRepository) GetBySiteID(ctx context.Context, siteID uuid.UUID) ([]models.SiteReport, error) {
	var reports []models.SiteReport
	err := postgres.GetDB(ctx, r.db).
		Preload("Photos").
		Where("site_id = ?", siteID).
		Order("report_date DESC").
		Find(&reports).Error
	return reports, err
}

func (r *siteReportRepository) GetByIdempotencyKey(ctx context.Context, key string) (*models.SiteReport, error) {
	var report models.SiteReport
	err := postgres.GetDB(ctx, r.db).Where("idempotency_key = ?", key).First(&report).Error
	return &report, err
}

func (r *siteReportRepository) List(ctx context.Context, filter repositories.ReportFilter) ([]models.SiteReport, int64, error) {
	db := postgres.GetDB(ctx, r.db).Model(&models.SiteReport{})

	if filter.SiteID != nil {
		db = db.Where("site_id = ?", *filter.SiteID)
	}
	if filter.RepID != nil {
		db = db.Where("rep_id = ?", *filter.RepID)
	}
	if filter.ReportType != "" {
		db = db.Where("report_type = ?", filter.ReportType)
	}

	var total int64
	db.Count(&total)

	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}
	offset := (filter.Page - 1) * filter.Limit

	var reports []models.SiteReport
	err := db.Preload("Photos").Order("report_date DESC").Offset(offset).Limit(filter.Limit).Find(&reports).Error
	return reports, total, err
}
