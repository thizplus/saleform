package repositories

import (
	"context"
	"time"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type SiteReportRepository interface {
	Create(ctx context.Context, report *models.SiteReport) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SiteReport, error)
	GetBySiteID(ctx context.Context, siteID uuid.UUID) ([]models.SiteReport, error)
	GetByIdempotencyKey(ctx context.Context, key string) (*models.SiteReport, error)
	List(ctx context.Context, filter ReportFilter) ([]models.SiteReport, int64, error)
	CountByRepAndType(ctx context.Context, repID uuid.UUID, since time.Time) (total int, newCount int, err error)
	CountByType(ctx context.Context, since time.Time) (total int, newCount int, repCount int, err error)
}

type ReportFilter struct {
	SiteID     *uuid.UUID
	RepID      *uuid.UUID
	ReportType string
	Page       int
	Limit      int
}
