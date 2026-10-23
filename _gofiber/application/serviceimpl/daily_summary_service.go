package serviceimpl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"line-sales-api/domain/ports"
	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/logger"

	"gorm.io/gorm"
)

// DailySummaryConfig เก็บ config สำหรับ daily summary push
type DailySummaryConfig struct {
	Enabled bool   `json:"enabled"`
	Time    string `json:"time"`    // เวลาส่ง เช่น "18:00"
	GroupID string `json:"groupId"` // LINE group ID ที่จะส่ง
}

// DailySummaryData ข้อมูลสรุปรายวัน
type DailySummaryData struct {
	Date          time.Time
	NewJobs       int
	FollowUps     int
	TotalVisits   int
	CallCount     int
	BillCount     int
	ClosedOld     int   // จบงาน ลค.เก่า
	ClosedNew     int   // จบงาน ลค.ใหม่
	AmountOld     int64 // ยอด ลค.เก่า
	AmountNew     int64 // ยอด ลค.ใหม่
	AmountTotal   int64
	CloseRate     float64
}

type DailySummaryService struct {
	db            *gorm.DB
	configRepo    repositories.AppConfigRepository
	lineMessenger ports.LineMessenger
}

func NewDailySummaryService(db *gorm.DB, configRepo repositories.AppConfigRepository, lineMessenger ports.LineMessenger) *DailySummaryService {
	return &DailySummaryService{
		db:            db,
		configRepo:    configRepo,
		lineMessenger: lineMessenger,
	}
}

// GetDailySummary สรุปข้อมูลรวมทุก sale ของวันที่ระบุ
func (s *DailySummaryService) GetDailySummary(ctx context.Context, date time.Time) (*DailySummaryData, error) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc)
	dayEnd := dayStart.Add(24 * time.Hour)

	data := &DailySummaryData{Date: dayStart}

	// วิ่งงาน: นับ site_reports ประจำวัน
	var reportCounts []struct {
		ReportType string
		Count      int
	}
	s.db.WithContext(ctx).Raw(`
		SELECT report_type, COUNT(*) as count
		FROM site_reports
		WHERE report_date >= ? AND report_date < ?
		GROUP BY report_type
	`, dayStart, dayEnd).Scan(&reportCounts)

	for _, r := range reportCounts {
		switch r.ReportType {
		case "new":
			data.NewJobs = r.Count
		case "follow_up":
			data.FollowUps = r.Count
		}
	}
	data.TotalVisits = data.NewJobs + data.FollowUps

	// โทร + บิล: จาก daily_check_ins
	var checkInSums struct {
		CallCount int
		BillCount int
	}
	s.db.WithContext(ctx).Raw(`
		SELECT COALESCE(SUM(call_count), 0) as call_count,
		       COALESCE(SUM(bill_count), 0) as bill_count
		FROM daily_check_ins
		WHERE check_in_date = ?
	`, dayStart).Scan(&checkInSums)
	data.CallCount = checkInSums.CallCount
	data.BillCount = checkInSums.BillCount

	// จบงาน + ยอดเงิน: site_reports ที่ close_status = 'success' แยกตาม customer_type
	var closedRows []struct {
		CustomerType string
		Count        int
		TotalAmount  int64
	}
	s.db.WithContext(ctx).Raw(`
		SELECT s.customer_type, COUNT(*) as count, COALESCE(SUM(sr.close_amount), 0) as total_amount
		FROM site_reports sr
		JOIN sites s ON s.id = sr.site_id
		WHERE sr.report_date >= ? AND sr.report_date < ?
		  AND sr.close_status = 'success'
		GROUP BY s.customer_type
	`, dayStart, dayEnd).Scan(&closedRows)

	for _, r := range closedRows {
		if r.CustomerType == "เก่า" {
			data.ClosedOld = r.Count
			data.AmountOld = r.TotalAmount
		} else {
			data.ClosedNew += r.Count
			data.AmountNew += r.TotalAmount
		}
	}
	data.AmountTotal = data.AmountOld + data.AmountNew

	// Close rate
	totalClosed := data.ClosedOld + data.ClosedNew
	if data.TotalVisits > 0 {
		data.CloseRate = float64(totalClosed) / float64(data.TotalVisits) * 100
	}

	return data, nil
}

// GetMonthToDateSummary สรุปตั้งแต่วันที่ 1 ถึงวันที่ระบุ
func (s *DailySummaryService) GetMonthToDateSummary(ctx context.Context, date time.Time) (*DailySummaryData, error) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	monthStart := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, loc)
	dayEnd := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc).Add(24 * time.Hour)

	data := &DailySummaryData{Date: monthStart}

	// วิ่งงาน
	var reportCounts []struct {
		ReportType string
		Count      int
	}
	s.db.WithContext(ctx).Raw(`
		SELECT report_type, COUNT(*) as count
		FROM site_reports
		WHERE report_date >= ? AND report_date < ?
		GROUP BY report_type
	`, monthStart, dayEnd).Scan(&reportCounts)

	for _, r := range reportCounts {
		switch r.ReportType {
		case "new":
			data.NewJobs = r.Count
		case "follow_up":
			data.FollowUps = r.Count
		}
	}
	data.TotalVisits = data.NewJobs + data.FollowUps

	// โทร + บิล
	var checkInSums struct {
		CallCount int
		BillCount int
	}
	s.db.WithContext(ctx).Raw(`
		SELECT COALESCE(SUM(call_count), 0) as call_count,
		       COALESCE(SUM(bill_count), 0) as bill_count
		FROM daily_check_ins
		WHERE check_in_date >= ? AND check_in_date < ?
	`, monthStart, dayEnd).Scan(&checkInSums)
	data.CallCount = checkInSums.CallCount
	data.BillCount = checkInSums.BillCount

	// จบงาน + ยอด
	var closedRows []struct {
		CustomerType string
		Count        int
		TotalAmount  int64
	}
	s.db.WithContext(ctx).Raw(`
		SELECT s.customer_type, COUNT(*) as count, COALESCE(SUM(sr.close_amount), 0) as total_amount
		FROM site_reports sr
		JOIN sites s ON s.id = sr.site_id
		WHERE sr.report_date >= ? AND sr.report_date < ?
		  AND sr.close_status = 'success'
		GROUP BY s.customer_type
	`, monthStart, dayEnd).Scan(&closedRows)

	for _, r := range closedRows {
		if r.CustomerType == "เก่า" {
			data.ClosedOld = r.Count
			data.AmountOld = r.TotalAmount
		} else {
			data.ClosedNew += r.Count
			data.AmountNew += r.TotalAmount
		}
	}
	data.AmountTotal = data.AmountOld + data.AmountNew

	totalClosed := data.ClosedOld + data.ClosedNew
	if data.TotalVisits > 0 {
		data.CloseRate = float64(totalClosed) / float64(data.TotalVisits) * 100
	}

	return data, nil
}

// SendDailySummary รวมข้อมูลแล้วส่ง push message
func (s *DailySummaryService) SendDailySummary(ctx context.Context, groupID string) error {
	if s.lineMessenger == nil {
		return fmt.Errorf("LINE messenger not configured")
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")
	today := time.Now().In(loc)

	daily, err := s.GetDailySummary(ctx, today)
	if err != nil {
		return fmt.Errorf("get daily summary: %w", err)
	}

	monthly, err := s.GetMonthToDateSummary(ctx, today)
	if err != nil {
		return fmt.Errorf("get month summary: %w", err)
	}

	messages := BuildDailySummaryMessage(daily, monthly)
	if len(messages) == 0 {
		return nil
	}

	if err := s.lineMessenger.PushMessage(ctx, groupID, messages...); err != nil {
		logger.ErrorContext(ctx, "Failed to push daily summary", "error", err, "group_id", groupID)
		return fmt.Errorf("push message: %w", err)
	}

	logger.InfoContext(ctx, "Daily summary pushed", "group_id", groupID)
	return nil
}

// BuildDailySummaryMessage สร้างข้อความสรุปประจำวัน
func BuildDailySummaryMessage(daily, monthly *DailySummaryData) []any {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)
	buddhistYear := now.Year() + 543

	var lines []string
	lines = append(lines, fmt.Sprintf("📊 สรุปประจำวัน %02d/%02d/%d", now.Day(), now.Month(), buddhistYear))
	lines = append(lines, "")

	// วิ่งงาน
	lines = append(lines, fmt.Sprintf("📋 วิ่งงาน: %d (ใหม่ %d / ตาม %d)", daily.TotalVisits, daily.NewJobs, daily.FollowUps))

	// โทร
	lines = append(lines, fmt.Sprintf("📞 โทรลูกค้า: %d ราย", daily.CallCount))

	// จบงาน
	totalClosed := daily.ClosedOld + daily.ClosedNew
	lines = append(lines, fmt.Sprintf("✅ จบงาน: %d (เก่า %d / ใหม่ %d)", totalClosed, daily.ClosedOld, daily.ClosedNew))

	// ยอดเงิน
	if daily.AmountTotal > 0 {
		lines = append(lines, fmt.Sprintf("💰 ยอด: %s บาท", formatNumber(int(daily.AmountTotal))))
		if daily.AmountOld > 0 || daily.AmountNew > 0 {
			lines = append(lines, fmt.Sprintf("   เก่า %s / ใหม่ %s", formatNumber(int(daily.AmountOld)), formatNumber(int(daily.AmountNew))))
		}
	}

	// Close rate
	lines = append(lines, fmt.Sprintf("📊 Close rate: %.2f%%", daily.CloseRate))

	// บิล
	lines = append(lines, fmt.Sprintf("🧾 บิล: %d", daily.BillCount))

	// Monthly
	lines = append(lines, "")
	lines = append(lines, "─────────────")

	thaiMonths := []string{"", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."}
	monthName := thaiMonths[int(now.Month())]
	lines = append(lines, fmt.Sprintf("📈 เดือน %s (MTD)", monthName))

	mtdClosed := monthly.ClosedOld + monthly.ClosedNew
	lines = append(lines, fmt.Sprintf("วิ่ง %d | จบ %d | ยอด %s บาท", monthly.TotalVisits, mtdClosed, formatNumber(int(monthly.AmountTotal))))
	lines = append(lines, fmt.Sprintf("Close rate: %.2f%% | บิล %d", monthly.CloseRate, monthly.BillCount))

	return []any{
		map[string]any{
			"type": "text",
			"text": strings.Join(lines, "\n"),
		},
	}
}
