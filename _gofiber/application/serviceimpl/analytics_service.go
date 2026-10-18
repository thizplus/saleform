package serviceimpl

import (
	"context"
	"math"
	"time"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/logger"

	"github.com/google/uuid"
)

type analyticsServiceImpl struct {
	analyticsRepo repositories.AnalyticsRepository
	salesRepRepo  repositories.SalesRepRepository
}

func NewAnalyticsService(
	analyticsRepo repositories.AnalyticsRepository,
	salesRepRepo repositories.SalesRepRepository,
) *analyticsServiceImpl {
	return &analyticsServiceImpl{
		analyticsRepo: analyticsRepo,
		salesRepRepo:  salesRepRepo,
	}
}

func (s *analyticsServiceImpl) Summary(ctx context.Context, filter *dto.AnalyticsFilter) (*dto.AnalyticsSummaryResponse, error) {
	from, to := parseRange(filter.From, filter.To)
	repID := parseUUID(filter.RepID)

	visits, newSites, followUps, err := s.analyticsRepo.CountReports(ctx, from, to, repID, filter.Amphoe)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to count reports", "error", err)
		return nil, err
	}

	won, lost, following, cancelled, err := s.analyticsRepo.CountSitesByStatus(ctx, from, to, repID, filter.Amphoe)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to count sites", "error", err)
		return nil, err
	}

	overdue, _ := s.analyticsRepo.CountOverdueAll(ctx)

	var winRate float64
	if won+lost > 0 {
		winRate = math.Round(float64(won) / float64(won+lost) * 100)
	}

	// Previous period (same duration, shifted back)
	duration := to.Sub(from)
	prevFrom := from.Add(-duration)
	prevTo := from

	pVisits, pNewSites, pFollowUps, _ := s.analyticsRepo.CountReports(ctx, prevFrom, prevTo, repID, filter.Amphoe)
	pWon, pLost, _, _, _ := s.analyticsRepo.CountSitesByStatus(ctx, prevFrom, prevTo, repID, filter.Amphoe)
	var pWinRate float64
	if pWon+pLost > 0 {
		pWinRate = math.Round(float64(pWon) / float64(pWon+pLost) * 100)
	}

	return &dto.AnalyticsSummaryResponse{
		Visits:    visits,
		NewSites:  newSites,
		FollowUps: followUps,
		Won:       won,
		Lost:      lost,
		Following: following,
		Cancelled: cancelled,
		WinRate:   winRate,
		Overdue:   overdue,
		Previous: &dto.AnalyticsSummaryPrevious{
			Visits:    pVisits,
			NewSites:  pNewSites,
			FollowUps: pFollowUps,
			Won:       pWon,
			Lost:      pLost,
			WinRate:   pWinRate,
		},
	}, nil
}

func (s *analyticsServiceImpl) ByRep(ctx context.Context, filter *dto.AnalyticsFilter) ([]dto.RepAnalytics, error) {
	from, to := parseRange(filter.From, filter.To)

	reportRows, err := s.analyticsRepo.ReportCountsByRep(ctx, from, to, filter.Amphoe)
	if err != nil {
		return nil, err
	}

	siteRows, err := s.analyticsRepo.SiteCountsByRep(ctx, from, to, filter.Amphoe)
	if err != nil {
		return nil, err
	}

	// รวม repIDs ทั้งหมด
	repIDs := make(map[uuid.UUID]bool)
	reportMap := make(map[uuid.UUID]repositories.RepReportRow)
	siteMap := make(map[uuid.UUID]repositories.RepSiteRow)

	for _, r := range reportRows {
		repIDs[r.RepID] = true
		reportMap[r.RepID] = r
	}
	for _, r := range siteRows {
		repIDs[r.RepID] = true
		siteMap[r.RepID] = r
	}

	var results []dto.RepAnalytics
	for id := range repIDs {
		rep, err := s.salesRepRepo.GetByID(ctx, id)
		if err != nil || rep == nil || rep.Status != "active" {
			continue
		}

		rr := reportMap[id]
		rs := siteMap[id]

		var winRate float64
		if rs.Won+rs.Lost > 0 {
			winRate = math.Round(float64(rs.Won) / float64(rs.Won+rs.Lost) * 100)
		}

		overdue, _ := s.analyticsRepo.CountOverdueByRep(ctx, id)

		results = append(results, dto.RepAnalytics{
			RepID:      id.String(),
			Nickname:   rep.Nickname,
			Area:       rep.Area,
			PictureURL: rep.PictureURL,
			Visits:     rr.Visits,
			NewSites:   rr.NewSites,
			FollowUps:  rr.FollowUps,
			Won:        rs.Won,
			Lost:       rs.Lost,
			Following:  rs.Following,
			WinRate:    winRate,
			Overdue:    overdue,
		})
	}

	return results, nil
}

func (s *analyticsServiceImpl) Trend(ctx context.Context, filter *dto.TrendFilter) ([]dto.TrendPoint, error) {
	from, to := parseRange(filter.From, filter.To)
	repID := parseUUID(filter.RepID)
	bucket := filter.Bucket
	if bucket == "" {
		bucket = "day"
	}

	var rows []repositories.TrendRow
	var err error

	switch filter.Metric {
	case "won":
		rows, err = s.analyticsRepo.WonTrend(ctx, from, to, bucket, repID)
	default: // visits
		rows, err = s.analyticsRepo.ReportTrend(ctx, from, to, bucket, repID)
	}
	if err != nil {
		return nil, err
	}

	// team avg (ถ้า filter เฉพาะ rep)
	var teamRows []repositories.TrendRow
	if repID != nil {
		switch filter.Metric {
		case "won":
			teamRows, _ = s.analyticsRepo.WonTrend(ctx, from, to, bucket, nil)
		default:
			teamRows, _ = s.analyticsRepo.ReportTrend(ctx, from, to, bucket, nil)
		}
	}
	teamMap := make(map[string]int)
	for _, r := range teamRows {
		teamMap[r.Bucket] = r.Value
	}

	// นับจำนวน active reps เพื่อหาค่าเฉลี่ย
	reps, _ := s.salesRepRepo.ListActive(ctx)
	repCount := len(reps)
	if repCount == 0 {
		repCount = 1
	}

	results := make([]dto.TrendPoint, len(rows))
	for i, r := range rows {
		results[i] = dto.TrendPoint{
			Bucket: r.Bucket,
			Value:  r.Value,
		}
		if repID != nil {
			avg := math.Round(float64(teamMap[r.Bucket])/float64(repCount)*10) / 10
			results[i].TeamAvg = &avg
		}
	}

	return results, nil
}

func (s *analyticsServiceImpl) ByArea(ctx context.Context, filter *dto.AnalyticsFilter, level string) ([]dto.AreaAnalytics, error) {
	from, to := parseRange(filter.From, filter.To)
	repID := parseUUID(filter.RepID)
	if level == "" {
		level = "amphoe"
	}

	rows, err := s.analyticsRepo.SiteCountsByArea(ctx, from, to, repID, level)
	if err != nil {
		return nil, err
	}

	results := make([]dto.AreaAnalytics, len(rows))
	for i, r := range rows {
		var winRate float64
		if r.Won+r.Lost > 0 {
			winRate = math.Round(float64(r.Won) / float64(r.Won+r.Lost) * 100)
		}
		results[i] = dto.AreaAnalytics{
			Amphoe:    r.Amphoe,
			Tambon:    r.Tambon,
			Visits:    r.Visits,
			Won:       r.Won,
			Lost:      r.Lost,
			Following: r.Following,
			WinRate:   winRate,
		}
	}

	return results, nil
}

func (s *analyticsServiceImpl) LostReasons(ctx context.Context, filter *dto.AnalyticsFilter) (*dto.LostReasonsResponse, error) {
	from, to := parseRange(filter.From, filter.To)
	repID := parseUUID(filter.RepID)

	reasons, err := s.analyticsRepo.LostReasonCounts(ctx, from, to, repID, filter.Amphoe)
	if err != nil {
		return nil, err
	}

	competitors, err := s.analyticsRepo.CompetitorCounts(ctx, from, to, repID, filter.Amphoe)
	if err != nil {
		return nil, err
	}

	resp := &dto.LostReasonsResponse{
		Reasons:     make([]dto.ReasonCount, len(reasons)),
		Competitors: make([]dto.CompetitorCount, len(competitors)),
	}
	for i, r := range reasons {
		resp.Reasons[i] = dto.ReasonCount{Reason: r.Name, Count: r.Count}
	}
	for i, c := range competitors {
		resp.Competitors[i] = dto.CompetitorCount{Name: c.Name, Count: c.Count}
	}

	return resp, nil
}

func (s *analyticsServiceImpl) Activity(ctx context.Context, filter *dto.AnalyticsFilter) ([]dto.ActivityPoint, error) {
	from, to := parseRange(filter.From, filter.To)
	repID := parseUUID(filter.RepID)

	rows, err := s.analyticsRepo.ActivityByDate(ctx, from, to, repID)
	if err != nil {
		return nil, err
	}

	results := make([]dto.ActivityPoint, len(rows))
	for i, r := range rows {
		results[i] = dto.ActivityPoint{Date: r.Date, Count: r.Count}
	}

	return results, nil
}

// Helpers

func parseRange(fromStr, toStr string) (time.Time, time.Time) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)

	from, err := time.ParseInLocation("2006-01-02", fromStr, loc)
	if err != nil {
		// default: ต้นเดือนนี้
		from = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	}

	to, err := time.ParseInLocation("2006-01-02", toStr, loc)
	if err != nil {
		// default: พรุ่งนี้ (inclusive today)
		to = time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, loc)
	} else {
		// to เป็น exclusive (ถึงสิ้นวัน)
		to = to.AddDate(0, 0, 1)
	}

	return from, to
}

func parseUUID(s string) *uuid.UUID {
	if s == "" {
		return nil
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return nil
	}
	return &id
}
