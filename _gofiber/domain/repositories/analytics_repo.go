package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// AnalyticsRepository รวม query สำหรับ analytics ทั้งหมด
// แยกจาก SiteRepository เพื่อไม่ให้บวม
type AnalyticsRepository interface {
	// Summary counts
	CountReports(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) (visits int, newSites int, followUps int, err error)
	CountSitesByStatus(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) (won int, lost int, following int, cancelled int, err error)
	CountOverdueAll(ctx context.Context) (int, error)
	CountOverdueByRep(ctx context.Context, repID uuid.UUID) (int, error)

	// By-rep breakdown
	ReportCountsByRep(ctx context.Context, from, to time.Time, amphoe string) ([]RepReportRow, error)
	SiteCountsByRep(ctx context.Context, from, to time.Time, amphoe string) ([]RepSiteRow, error)

	// Trend (time-series)
	ReportTrend(ctx context.Context, from, to time.Time, bucket string, repID *uuid.UUID) ([]TrendRow, error)
	WonTrend(ctx context.Context, from, to time.Time, bucket string, repID *uuid.UUID) ([]TrendRow, error)

	// By-area
	SiteCountsByArea(ctx context.Context, from, to time.Time, repID *uuid.UUID, level string) ([]AreaRow, error)

	// Lost reasons
	LostReasonCounts(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) ([]ReasonRow, error)
	CompetitorCounts(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) ([]ReasonRow, error)

	// Activity heatmap
	ActivityByDate(ctx context.Context, from, to time.Time, repID *uuid.UUID) ([]ActivityRow, error)
}

// Row types สำหรับ SQL results
type RepReportRow struct {
	RepID     uuid.UUID
	Visits    int
	NewSites  int
	FollowUps int
}

type RepSiteRow struct {
	RepID     uuid.UUID
	Won       int
	Lost      int
	Following int
}

type TrendRow struct {
	Bucket string
	Value  int
}

type AreaRow struct {
	Amphoe    string
	Tambon    string
	Visits    int
	Won       int
	Lost      int
	Following int
}

type ReasonRow struct {
	Name  string
	Count int
}

type ActivityRow struct {
	Date  string
	Count int
}
