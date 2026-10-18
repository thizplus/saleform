package repoimpl

import (
	"context"
	"time"

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

// CountByRepAndType นับ reports ของ rep คนนี้ แยก total กับ new
func (r *siteReportRepository) CountByRepAndType(ctx context.Context, repID uuid.UUID, since time.Time) (int, int, error) {
	type row struct {
		ReportType string
		Count      int
	}
	var rows []row
	err := postgres.GetDB(ctx, r.db).
		Model(&models.SiteReport{}).
		Select("report_type, count(*) as count").
		Where("rep_id = ? AND report_date >= ?", repID, since).
		Group("report_type").
		Scan(&rows).Error
	if err != nil {
		return 0, 0, err
	}
	var total, newCount int
	for _, r := range rows {
		total += r.Count
		if r.ReportType == "new" {
			newCount = r.Count
		}
	}
	return total, newCount, nil
}

// CountByType นับ reports ทั้งทีม + จำนวน rep ที่มี report
func (r *siteReportRepository) CountByType(ctx context.Context, since time.Time) (int, int, int, error) {
	type row struct {
		ReportType string
		Count      int
	}
	var rows []row
	err := postgres.GetDB(ctx, r.db).
		Model(&models.SiteReport{}).
		Select("report_type, count(*) as count").
		Where("report_date >= ?", since).
		Group("report_type").
		Scan(&rows).Error
	if err != nil {
		return 0, 0, 0, err
	}
	var total, newCount int
	for _, r := range rows {
		total += r.Count
		if r.ReportType == "new" {
			newCount = r.Count
		}
	}

	// นับจำนวน rep ที่มี report (สำหรับหาค่าเฉลี่ย)
	var repCount int64
	postgres.GetDB(ctx, r.db).
		Model(&models.SiteReport{}).
		Where("report_date >= ?", since).
		Distinct("rep_id").
		Count(&repCount)

	return total, newCount, int(repCount), nil
}
