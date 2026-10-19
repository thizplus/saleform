package repositories

import (
	"context"
	"time"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type SiteRepository interface {
	Create(ctx context.Context, site *models.Site) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Site, error)
	GetByCode(ctx context.Context, code string) (*models.Site, error)
	GetByPhone(ctx context.Context, phone string) ([]models.Site, error)
	Update(ctx context.Context, site *models.Site) error
	List(ctx context.Context, filter SiteFilter) ([]models.Site, int64, error)
	FindNearby(ctx context.Context, lat, lng float64, radiusMeters float64) ([]models.Site, error)
	FindByNameSimilar(ctx context.Context, name string, threshold float64) ([]models.Site, error)
	CountByRepAndStatus(ctx context.Context, repID uuid.UUID, since time.Time) (map[string]int, error)
	CountByStatus(ctx context.Context, since time.Time) (map[string]int, error)
	CountOverdue(ctx context.Context, repID uuid.UUID) (int, error)
}

type SiteFilter struct {
	Status    string
	RepID     *uuid.UUID
	Amphoe    string
	Search    string // search by name, phone, code
	Tab       string // due_today, overdue, following, all
	Page      int
	Limit     int
}
