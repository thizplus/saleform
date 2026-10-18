package repoimpl

import (
	"context"
	"time"

	"line-sales-api/domain/repositories"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type analyticsRepository struct {
	db *gorm.DB
}

func NewAnalyticsRepository(db *gorm.DB) repositories.AnalyticsRepository {
	return &analyticsRepository{db: db}
}

func (r *analyticsRepository) CountReports(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) (int, int, int, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("site_reports").
		Where("report_date >= ? AND report_date < ?", from, to)
	if repID != nil {
		db = db.Where("rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Joins("JOIN sites ON sites.id = site_reports.site_id").Where("sites.amphoe = ?", amphoe)
	}

	type row struct {
		ReportType string
		Count      int
	}
	var rows []row
	err := db.Select("report_type, count(*) as count").Group("report_type").Scan(&rows).Error
	if err != nil {
		return 0, 0, 0, err
	}
	var visits, newSites, followUps int
	for _, r := range rows {
		visits += r.Count
		if r.ReportType == "new" {
			newSites = r.Count
		} else {
			followUps += r.Count
		}
	}
	return visits, newSites, followUps, nil
}

func (r *analyticsRepository) CountSitesByStatus(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) (int, int, int, int, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("created_at >= ? AND created_at < ? AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Where("amphoe = ?", amphoe)
	}

	type row struct {
		Status string
		Count  int
	}
	var rows []row
	err := db.Select("status, count(*) as count").Group("status").Scan(&rows).Error
	if err != nil {
		return 0, 0, 0, 0, err
	}
	var won, lost, following, cancelled int
	for _, r := range rows {
		switch r.Status {
		case "won":
			won = r.Count
		case "lost":
			lost = r.Count
		case "following":
			following = r.Count
		case "cancelled":
			cancelled = r.Count
		}
	}
	return won, lost, following, cancelled, nil
}

func (r *analyticsRepository) CountOverdueAll(ctx context.Context) (int, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	var count int64
	err := postgres.GetDB(ctx, r.db).Table("sites").
		Where("status = 'following' AND next_follow_up_date < ? AND deleted_at IS NULL", today).
		Count(&count).Error
	return int(count), err
}

func (r *analyticsRepository) CountOverdueByRep(ctx context.Context, repID uuid.UUID) (int, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	var count int64
	err := postgres.GetDB(ctx, r.db).Table("sites").
		Where("owner_rep_id = ? AND status = 'following' AND next_follow_up_date < ? AND deleted_at IS NULL", repID, today).
		Count(&count).Error
	return int(count), err
}

func (r *analyticsRepository) ReportCountsByRep(ctx context.Context, from, to time.Time, amphoe string) ([]repositories.RepReportRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("site_reports").
		Where("report_date >= ? AND report_date < ?", from, to)
	if amphoe != "" {
		db = db.Joins("JOIN sites ON sites.id = site_reports.site_id").Where("sites.amphoe = ?", amphoe)
	}

	type raw struct {
		RepID      uuid.UUID
		ReportType string
		Count      int
	}
	var rows []raw
	err := db.Select("rep_id, report_type, count(*) as count").Group("rep_id, report_type").Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	repMap := make(map[uuid.UUID]*repositories.RepReportRow)
	for _, r := range rows {
		if _, ok := repMap[r.RepID]; !ok {
			repMap[r.RepID] = &repositories.RepReportRow{RepID: r.RepID}
		}
		rr := repMap[r.RepID]
		rr.Visits += r.Count
		if r.ReportType == "new" {
			rr.NewSites = r.Count
		} else {
			rr.FollowUps += r.Count
		}
	}

	result := make([]repositories.RepReportRow, 0, len(repMap))
	for _, v := range repMap {
		result = append(result, *v)
	}
	return result, nil
}

func (r *analyticsRepository) SiteCountsByRep(ctx context.Context, from, to time.Time, amphoe string) ([]repositories.RepSiteRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("created_at >= ? AND created_at < ? AND deleted_at IS NULL", from, to)
	if amphoe != "" {
		db = db.Where("amphoe = ?", amphoe)
	}

	type raw struct {
		OwnerRepID uuid.UUID `gorm:"column:owner_rep_id"`
		Status     string
		Count      int
	}
	var rows []raw
	err := db.Select("owner_rep_id, status, count(*) as count").Group("owner_rep_id, status").Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	repMap := make(map[uuid.UUID]*repositories.RepSiteRow)
	for _, r := range rows {
		if _, ok := repMap[r.OwnerRepID]; !ok {
			repMap[r.OwnerRepID] = &repositories.RepSiteRow{RepID: r.OwnerRepID}
		}
		rs := repMap[r.OwnerRepID]
		switch r.Status {
		case "won":
			rs.Won = r.Count
		case "lost":
			rs.Lost = r.Count
		case "following":
			rs.Following = r.Count
		}
	}

	result := make([]repositories.RepSiteRow, 0, len(repMap))
	for _, v := range repMap {
		result = append(result, *v)
	}
	return result, nil
}

func (r *analyticsRepository) ReportTrend(ctx context.Context, from, to time.Time, bucket string, repID *uuid.UUID) ([]repositories.TrendRow, error) {
	truncFn := dateTrunc(bucket)
	db := postgres.GetDB(ctx, r.db).
		Table("site_reports").
		Where("report_date >= ? AND report_date < ?", from, to)
	if repID != nil {
		db = db.Where("rep_id = ?", *repID)
	}

	var rows []repositories.TrendRow
	err := db.Select(truncFn+" as bucket, count(*) as value").
		Group("bucket").Order("bucket").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) WonTrend(ctx context.Context, from, to time.Time, bucket string, repID *uuid.UUID) ([]repositories.TrendRow, error) {
	truncFn := dateTrunc(bucket)
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("created_at >= ? AND created_at < ? AND status = 'won' AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}

	var rows []repositories.TrendRow
	err := db.Select(truncFn+" as bucket, count(*) as value").
		Group("bucket").Order("bucket").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) SiteCountsByArea(ctx context.Context, from, to time.Time, repID *uuid.UUID, level string) ([]repositories.AreaRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("created_at >= ? AND created_at < ? AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}

	groupCol := "amphoe"
	selectCols := "amphoe, '' as tambon"
	if level == "tambon" {
		groupCol = "amphoe, tambon"
		selectCols = "amphoe, tambon"
	}

	var rows []repositories.AreaRow
	err := db.Select(selectCols+`,
		count(*) as visits,
		count(*) filter (where status = 'won') as won,
		count(*) filter (where status = 'lost') as lost,
		count(*) filter (where status = 'following') as following`).
		Group(groupCol).Order("visits DESC").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) LostReasonCounts(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) ([]repositories.ReasonRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("status = 'lost' AND lost_reason != '' AND created_at >= ? AND created_at < ? AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Where("amphoe = ?", amphoe)
	}

	var rows []repositories.ReasonRow
	err := db.Select("lost_reason as name, count(*) as count").
		Group("lost_reason").Order("count DESC").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) CompetitorCounts(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) ([]repositories.ReasonRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("status = 'lost' AND competitor != '' AND created_at >= ? AND created_at < ? AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Where("amphoe = ?", amphoe)
	}

	var rows []repositories.ReasonRow
	err := db.Select("competitor as name, count(*) as count").
		Group("competitor").Order("count DESC").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) ActivityByDate(ctx context.Context, from, to time.Time, repID *uuid.UUID) ([]repositories.ActivityRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("site_reports").
		Where("report_date >= ? AND report_date < ?", from, to)
	if repID != nil {
		db = db.Where("rep_id = ?", *repID)
	}

	var rows []repositories.ActivityRow
	err := db.Select("to_char(report_date, 'YYYY-MM-DD') as date, count(*) as count").
		Group("date").Order("date").Scan(&rows).Error
	return rows, err
}

func dateTrunc(bucket string) string {
	switch bucket {
	case "month":
		return "to_char(report_date, 'YYYY-MM-01')"
	case "year":
		return "to_char(report_date, 'YYYY-01-01')"
	default: // day
		return "to_char(report_date, 'YYYY-MM-DD')"
	}
}
