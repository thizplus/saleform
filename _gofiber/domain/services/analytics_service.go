package services

import (
	"context"
	"line-sales-api/domain/dto"
)

type AnalyticsService interface {
	Summary(ctx context.Context, filter *dto.AnalyticsFilter) (*dto.AnalyticsSummaryResponse, error)
	ByRep(ctx context.Context, filter *dto.AnalyticsFilter) ([]dto.RepAnalytics, error)
	Trend(ctx context.Context, filter *dto.TrendFilter) ([]dto.TrendPoint, error)
	ByArea(ctx context.Context, filter *dto.AnalyticsFilter, level string) ([]dto.AreaAnalytics, error)
	LostReasons(ctx context.Context, filter *dto.AnalyticsFilter) (*dto.LostReasonsResponse, error)
	Activity(ctx context.Context, filter *dto.AnalyticsFilter) ([]dto.ActivityPoint, error)
	RecentActivity(ctx context.Context, filter *dto.AnalyticsFilter, limit int) ([]dto.RecentActivityItem, error)
}
