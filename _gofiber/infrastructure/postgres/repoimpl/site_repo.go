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

type siteRepository struct {
	db *gorm.DB
}

func NewSiteRepository(db *gorm.DB) *siteRepository {
	return &siteRepository{db: db}
}

func (r *siteRepository) Create(ctx context.Context, site *models.Site) error {
	return postgres.GetDB(ctx, r.db).Create(site).Error
}

func (r *siteRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Site, error) {
	var site models.Site
	err := postgres.GetDB(ctx, r.db).First(&site, id).Error
	return &site, err
}

func (r *siteRepository) GetByCode(ctx context.Context, code string) (*models.Site, error) {
	var site models.Site
	err := postgres.GetDB(ctx, r.db).Where("site_code = ?", code).First(&site).Error
	return &site, err
}

func (r *siteRepository) GetByPhone(ctx context.Context, phone string) ([]models.Site, error) {
	var sites []models.Site
	err := postgres.GetDB(ctx, r.db).
		Joins("JOIN contacts ON contacts.site_id = sites.id").
		Where("contacts.phone = ?", phone).
		Find(&sites).Error
	return sites, err
}

func (r *siteRepository) Update(ctx context.Context, site *models.Site) error {
	return postgres.GetDB(ctx, r.db).Save(site).Error
}

func (r *siteRepository) List(ctx context.Context, filter repositories.SiteFilter) ([]models.Site, int64, error) {
	db := postgres.GetDB(ctx, r.db).Model(&models.Site{})
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	// Tab filters
	switch filter.Tab {
	case "due_today":
		db = db.Where("next_follow_up_date >= ? AND next_follow_up_date < ? AND status = 'following'", today, today.Add(24*time.Hour))
	case "overdue":
		db = db.Where("next_follow_up_date < ? AND status = 'following'", today)
	case "following":
		db = db.Where("status = 'following'")
	}

	if filter.Status != "" {
		db = db.Where("status = ?", filter.Status)
	}
	if filter.RepID != nil {
		db = db.Where("owner_rep_id = ?", *filter.RepID)
	}
	if filter.Amphoe != "" {
		db = db.Where("amphoe = ?", filter.Amphoe)
	}
	if filter.Search != "" {
		search := "%" + filter.Search + "%"
		db = db.Where("customer_name ILIKE ? OR phone ILIKE ? OR site_code ILIKE ?", search, search, search)
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

	var sites []models.Site
	err := db.Order("created_at DESC").Offset(offset).Limit(filter.Limit).Find(&sites).Error
	return sites, total, err
}

func (r *siteRepository) CountByRepAndStatus(ctx context.Context, repID uuid.UUID, since time.Time) (map[string]int, error) {
	result := make(map[string]int)

	// won/lost/cancelled: นับตาม closed_at (ตรงกับ admin analytics)
	type row struct {
		Status string
		Count  int
	}
	var closedRows []row
	err := postgres.GetDB(ctx, r.db).
		Model(&models.Site{}).
		Select("status, count(*) as count").
		Where("owner_rep_id = ? AND closed_at >= ? AND status IN ('won','lost','cancelled')", repID, since).
		Group("status").
		Scan(&closedRows).Error
	if err != nil {
		return nil, err
	}
	for _, r := range closedRows {
		result[r.Status] = r.Count
	}

	// following: นับจากสถานะปัจจุบัน (ไม่ขึ้นกับช่วงเวลา)
	var followCount int64
	postgres.GetDB(ctx, r.db).
		Model(&models.Site{}).
		Where("owner_rep_id = ? AND status = 'following'", repID).
		Count(&followCount)
	result["following"] = int(followCount)

	return result, nil
}

func (r *siteRepository) CountByStatus(ctx context.Context, since time.Time) (map[string]int, error) {
	result := make(map[string]int)

	// won/lost/cancelled: นับตาม closed_at
	type row struct {
		Status string
		Count  int
	}
	var closedRows []row
	err := postgres.GetDB(ctx, r.db).
		Model(&models.Site{}).
		Select("status, count(*) as count").
		Where("closed_at >= ? AND status IN ('won','lost','cancelled')", since).
		Group("status").
		Scan(&closedRows).Error
	if err != nil {
		return nil, err
	}
	for _, r := range closedRows {
		result[r.Status] = r.Count
	}

	// following: นับจากสถานะปัจจุบัน
	var followCount int64
	postgres.GetDB(ctx, r.db).
		Model(&models.Site{}).
		Where("status = 'following'").
		Count(&followCount)
	result["following"] = int(followCount)

	return result, nil
}

func (r *siteRepository) CountOverdue(ctx context.Context, repID uuid.UUID) (int, error) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	var count int64
	err := postgres.GetDB(ctx, r.db).
		Model(&models.Site{}).
		Where("owner_rep_id = ? AND status = 'following' AND next_follow_up_date < ?", repID, today).
		Count(&count).Error
	return int(count), err
}

func (r *siteRepository) FindNearby(ctx context.Context, lat, lng float64, radiusMeters float64) ([]models.Site, error) {
	var sites []models.Site
	// Simple distance calculation using Haversine approximation
	// For production, consider PostGIS
	err := postgres.GetDB(ctx, r.db).
		Where("latitude IS NOT NULL AND longitude IS NOT NULL").
		Where(`(6371000 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) <= ?`,
			lat, lng, lat, radiusMeters).
		Where("status = 'following'").
		Find(&sites).Error
	return sites, err
}

func (r *siteRepository) FindByNameSimilar(ctx context.Context, name string, threshold float64) ([]models.Site, error) {
	var sites []models.Site
	// pg_trgm similarity — strip "คุณ" prefix for better matching
	err := postgres.GetDB(ctx, r.db).
		Where("status = 'following'").
		Where("similarity(regexp_replace(customer_name, '^คุณ\\s*', '', 'g'), regexp_replace(?, '^คุณ\\s*', '', 'g')) > ?", name, threshold).
		Find(&sites).Error
	return sites, err
}
