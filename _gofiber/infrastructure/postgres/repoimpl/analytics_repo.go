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
	// จบได้/จบที่อื่น/ยกเลิก: นับตาม closed_at (วันปิดงาน)
	closedDB := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("closed_at >= ? AND closed_at < ? AND deleted_at IS NULL", from, to)
	if repID != nil {
		closedDB = closedDB.Where("owner_rep_id = ?", *repID)
	}
	if amphoe != "" {
		closedDB = closedDB.Where("amphoe = ?", amphoe)
	}

	type row struct {
		Status string
		Count  int
	}
	var closedRows []row
	err := closedDB.Select("status, count(*) as count").Group("status").Scan(&closedRows).Error
	if err != nil {
		return 0, 0, 0, 0, err
	}
	var won, lost, cancelled int
	for _, r := range closedRows {
		switch r.Status {
		case "won":
			won = r.Count
		case "lost":
			lost = r.Count
		case "cancelled":
			cancelled = r.Count
		}
	}

	// ตามต่อ: นับจากสถานะปัจจุบัน (ไม่ขึ้นกับช่วงเวลา)
	followDB := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("status = 'following' AND deleted_at IS NULL")
	if repID != nil {
		followDB = followDB.Where("owner_rep_id = ?", *repID)
	}
	if amphoe != "" {
		followDB = followDB.Where("amphoe = ?", amphoe)
	}
	var following int64
	followDB.Count(&following)

	return won, lost, int(following), cancelled, nil
}

func (r *analyticsRepository) CountOverdueAll(ctx context.Context, repID *uuid.UUID) (int, error) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	db := postgres.GetDB(ctx, r.db).Table("sites").
		Where("status = 'following' AND next_follow_up_date < ? AND deleted_at IS NULL", today)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}
	var count int64
	err := db.Count(&count).Error
	return int(count), err
}

func (r *analyticsRepository) CountOverdueByRep(ctx context.Context, repID uuid.UUID) (int, error) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
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
	// จบได้/จบที่อื่น: ใช้ closed_at
	closedDB := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("closed_at >= ? AND closed_at < ? AND deleted_at IS NULL", from, to)
	if amphoe != "" {
		closedDB = closedDB.Where("amphoe = ?", amphoe)
	}

	type raw struct {
		OwnerRepID uuid.UUID `gorm:"column:owner_rep_id"`
		Status     string
		Count      int
	}
	var closedRows []raw
	err := closedDB.Select("owner_rep_id, status, count(*) as count").Group("owner_rep_id, status").Scan(&closedRows).Error
	if err != nil {
		return nil, err
	}

	repMap := make(map[uuid.UUID]*repositories.RepSiteRow)
	for _, r := range closedRows {
		if _, ok := repMap[r.OwnerRepID]; !ok {
			repMap[r.OwnerRepID] = &repositories.RepSiteRow{RepID: r.OwnerRepID}
		}
		rs := repMap[r.OwnerRepID]
		switch r.Status {
		case "won":
			rs.Won = r.Count
		case "lost":
			rs.Lost = r.Count
		}
	}

	// ตามต่อ: สถานะปัจจุบัน
	followDB := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("status = 'following' AND deleted_at IS NULL")
	if amphoe != "" {
		followDB = followDB.Where("amphoe = ?", amphoe)
	}
	var followRows []raw
	followDB.Select("owner_rep_id, 'following' as status, count(*) as count").Group("owner_rep_id").Scan(&followRows)
	for _, r := range followRows {
		if _, ok := repMap[r.OwnerRepID]; !ok {
			repMap[r.OwnerRepID] = &repositories.RepSiteRow{RepID: r.OwnerRepID}
		}
		repMap[r.OwnerRepID].Following = r.Count
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
	truncFn := dateTruncField(bucket, "closed_at")
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("closed_at >= ? AND closed_at < ? AND status = 'won' AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}

	var rows []repositories.TrendRow
	err := db.Select(truncFn+" as bucket, count(*) as value").
		Group("bucket").Order("bucket").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) SiteCountsByArea(ctx context.Context, from, to time.Time, repID *uuid.UUID, level string) ([]repositories.AreaRow, error) {
	// visits = จำนวน reports ในช่วง (LEFT JOIN), won/lost ตาม closed_at, following = สถานะปัจจุบัน
	db := postgres.GetDB(ctx, r.db).
		Table("sites s").
		Joins("LEFT JOIN site_reports sr ON sr.site_id = s.id AND sr.report_date >= ? AND sr.report_date < ?", from, to).
		Where("s.deleted_at IS NULL AND s.amphoe != ''")
	if repID != nil {
		db = db.Where("s.owner_rep_id = ?", *repID)
	}

	groupCol := "s.amphoe"
	selectCols := "s.amphoe, '' as tambon"
	if level == "tambon" {
		groupCol = "s.amphoe, s.tambon"
		selectCols = "s.amphoe, s.tambon"
	}

	var rows []repositories.AreaRow
	err := db.Select(selectCols+`,
		count(DISTINCT sr.id) as visits,
		count(DISTINCT s.id) filter (where s.status = 'won' AND s.closed_at >= ? AND s.closed_at < ?) as won,
		count(DISTINCT s.id) filter (where s.status = 'lost' AND s.closed_at >= ? AND s.closed_at < ?) as lost,
		count(DISTINCT s.id) filter (where s.status = 'following') as following`, from, to, from, to).
		Group(groupCol).Order("visits DESC").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) LostReasonCounts(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) ([]repositories.ReasonRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("status = 'lost' AND lost_reason != '' AND closed_at >= ? AND closed_at < ? AND deleted_at IS NULL", from, to)
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
		Where("status = 'lost' AND competitor != '' AND closed_at >= ? AND closed_at < ? AND deleted_at IS NULL", from, to)
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
	err := db.Select("to_char(report_date AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') as date, count(*) as count").
		Group("date").Order("date").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) ReportTrendDetailed(ctx context.Context, from, to time.Time, bucket string, repID *uuid.UUID, amphoe string) ([]repositories.DetailedTrendRow, error) {
	truncFn := dateTrunc(bucket)
	db := postgres.GetDB(ctx, r.db).
		Table("site_reports").
		Where("report_date >= ? AND report_date < ?", from, to)
	if repID != nil {
		db = db.Where("rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Joins("JOIN sites ON sites.id = site_reports.site_id").Where("sites.amphoe = ?", amphoe)
	}

	var rows []repositories.DetailedTrendRow
	err := db.Select(truncFn+` as bucket,
		count(*) as visits,
		count(*) filter (where report_type = 'new') as new_sites,
		count(*) filter (where report_type = 'follow_up') as follow_ups`).
		Group("bucket").Order("bucket").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) LostTrend(ctx context.Context, from, to time.Time, bucket string, repID *uuid.UUID) ([]repositories.TrendRow, error) {
	truncFn := dateTruncField(bucket, "closed_at")
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("closed_at >= ? AND closed_at < ? AND status = 'lost' AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}

	var rows []repositories.TrendRow
	err := db.Select(truncFn+" as bucket, count(*) as value").
		Group("bucket").Order("bucket").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) AvgDaysToWin(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) (*float64, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("status = 'won' AND closed_at >= ? AND closed_at < ? AND closed_at IS NOT NULL AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Where("amphoe = ?", amphoe)
	}

	var result *float64
	err := db.Select("round(avg(extract(epoch from (closed_at - created_at)) / 86400)::numeric, 1)").Scan(&result).Error
	if err != nil || result == nil {
		return nil, err
	}
	return result, nil
}

func (r *analyticsRepository) RecentReports(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string, limit int) ([]repositories.RecentReportRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("site_reports sr").
		Joins("JOIN sites s ON s.id = sr.site_id").
		Joins("JOIN sales_reps rp ON rp.id = sr.rep_id").
		Where("sr.report_date >= ? AND sr.report_date < ?", from, to)
	if repID != nil {
		db = db.Where("sr.rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Where("s.amphoe = ?", amphoe)
	}

	var rows []repositories.RecentReportRow
	err := db.Select("sr.id, s.site_code, rp.nickname as rep_name, sr.report_type, sr.note, sr.status, sr.report_date").
		Order("sr.report_date DESC").Limit(limit).Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) LostSites(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) ([]repositories.LostSiteRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites s").
		Joins("JOIN sales_reps rp ON rp.id = s.owner_rep_id").
		Where("s.status = 'lost' AND s.closed_at >= ? AND s.closed_at < ? AND s.deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("s.owner_rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Where("s.amphoe = ?", amphoe)
	}

	var rows []repositories.LostSiteRow
	err := db.Select("s.site_code, s.customer_name, s.amphoe, s.owner_rep_id as rep_id, rp.nickname as rep_name, s.closed_at, s.lost_reason, s.competitor, s.stage").
		Order("s.closed_at DESC").Scan(&rows).Error
	return rows, err
}

func (r *analyticsRepository) LostByStage(ctx context.Context, from, to time.Time, repID *uuid.UUID, amphoe string) ([]repositories.ReasonRow, error) {
	db := postgres.GetDB(ctx, r.db).
		Table("sites").
		Where("status = 'lost' AND closed_at >= ? AND closed_at < ? AND deleted_at IS NULL", from, to)
	if repID != nil {
		db = db.Where("owner_rep_id = ?", *repID)
	}
	if amphoe != "" {
		db = db.Where("amphoe = ?", amphoe)
	}

	var rows []repositories.ReasonRow
	err := db.Select("stage as name, count(*) as count").
		Group("stage").Order("count DESC").Scan(&rows).Error
	return rows, err
}

func dateTrunc(bucket string) string {
	return dateTruncField(bucket, "report_date")
}

func dateTruncField(bucket, field string) string {
	// ใช้ AT TIME ZONE 'Asia/Bangkok' เพื่อจัดกลุ่มตามเวลาไทย
	tzField := field + " AT TIME ZONE 'Asia/Bangkok'"
	switch bucket {
	case "week":
		return "to_char(date_trunc('week', " + tzField + "), 'YYYY-MM-DD')"
	case "month":
		return "to_char(" + tzField + ", 'YYYY-MM-01')"
	case "year":
		return "to_char(" + tzField + ", 'YYYY-01-01')"
	default: // day
		return "to_char(" + tzField + ", 'YYYY-MM-DD')"
	}
}
