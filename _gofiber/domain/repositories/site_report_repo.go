package repositories

import (
	"context"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type SiteReportRepository interface {
	Create(ctx context.Context, report *models.SiteReport) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SiteReport, error)
	GetBySiteID(ctx context.Context, siteID uuid.UUID) ([]models.SiteReport, error)
	GetByIdempotencyKey(ctx context.Context, key string) (*models.SiteReport, error)
	List(ctx context.Context, filter ReportFilter) ([]models.SiteReport, int64, error)
}

type ReportFilter struct {
	SiteID     *uuid.UUID
	RepID      *uuid.UUID
	ReportType string
	Page       int
	Limit      int
}
