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
	avgDays, _ := s.analyticsRepo.AvgDaysToWin(ctx, from, to, repID, filter.Amphoe)

	winRate := calcWinRate(won, lost)

	// Previous period
	duration := to.Sub(from)
	prevFrom := from.Add(-duration)
	prevTo := from

	pVisits, pNewSites, pFollowUps, _ := s.analyticsRepo.CountReports(ctx, prevFrom, prevTo, repID, filter.Amphoe)
	pWon, pLost, _, _, _ := s.analyticsRepo.CountSitesByStatus(ctx, prevFrom, prevTo, repID, filter.Amphoe)
	pWinRate := calcWinRate(pWon, pLost)

	return &dto.AnalyticsSummaryResponse{
		Visits:       visits,
		NewSites:     newSites,
		FollowUps:    followUps,
		Won:          won,
		Lost:         lost,
		Following:    following,
		Cancelled:    cancelled,
		WinRate:      winRate,
		Overdue:      overdue,
		AvgDaysToWin: avgDays,
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
		winRate := calcWinRate(rs.Won, rs.Lost)
		overdue, _ := s.analyticsRepo.CountOverdueByRep(ctx, id)
		avgDays, _ := s.analyticsRepo.AvgDaysToWin(ctx, from, to, &id, filter.Amphoe)

		results = append(results, dto.RepAnalytics{
			RepID:        id.String(),
			Nickname:     rep.Nickname,
			DisplayName:  rep.DisplayName,
			Area:         rep.Area,
			PictureURL:   rep.PictureURL,
			Visits:       rr.Visits,
			NewSites:     rr.NewSites,
			FollowUps:    rr.FollowUps,
			Won:          rs.Won,
			Lost:         rs.Lost,
			Following:    rs.Following,
			WinRate:      winRate,
			Overdue:      overdue,
			AvgDaysToWin: avgDays,
			SitesOwned:   rs.Won + rs.Lost + rs.Following,
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

	// reports (newSites + followUps)
	reportRows, err := s.analyticsRepo.ReportTrendDetailed(ctx, from, to, bucket, repID, filter.Amphoe)
	if err != nil {
		// fallback to simple trend
		simpleRows, err2 := s.analyticsRepo.ReportTrend(ctx, from, to, bucket, repID)
		if err2 != nil {
			return nil, err2
		}
		results := make([]dto.TrendPoint, len(simpleRows))
		for i, r := range simpleRows {
			results[i] = dto.TrendPoint{Bucket: r.Bucket, Value: r.Value}
		}
		return results, nil
	}

	// won/lost trend (by closed_at)
	wonRows, _ := s.analyticsRepo.WonTrend(ctx, from, to, bucket, repID)
	lostRows, _ := s.analyticsRepo.LostTrend(ctx, from, to, bucket, repID)

	wonMap := make(map[string]int)
	for _, r := range wonRows {
		wonMap[r.Bucket] = r.Value
	}
	lostMap := make(map[string]int)
	for _, r := range lostRows {
		lostMap[r.Bucket] = r.Value
	}

	// team avg
	reps, _ := s.salesRepRepo.ListActive(ctx)
	repCount := len(reps)
	if repCount == 0 {
		repCount = 1
	}
	var teamRows []repositories.DetailedTrendRow
	if repID != nil {
		teamRows, _ = s.analyticsRepo.ReportTrendDetailed(ctx, from, to, bucket, nil, filter.Amphoe)
	}
	teamMap := make(map[string]int)
	for _, r := range teamRows {
		teamMap[r.Bucket] = r.Visits
	}

	results := make([]dto.TrendPoint, len(reportRows))
	for i, r := range reportRows {
		results[i] = dto.TrendPoint{
			Bucket:    r.Bucket,
			Value:     r.Visits,
			NewSites:  r.NewSites,
			FollowUps: r.FollowUps,
			Won:       wonMap[r.Bucket],
			Lost:      lostMap[r.Bucket],
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

	// Amphoe level
	amphoeRows, err := s.analyticsRepo.SiteCountsByArea(ctx, from, to, repID, "amphoe")
	if err != nil {
		return nil, err
	}

	// Tambon level
	tambonRows, _ := s.analyticsRepo.SiteCountsByArea(ctx, from, to, repID, "tambon")

	// Group tambons by amphoe
	tambonMap := make(map[string][]dto.AreaAnalytics)
	for _, t := range tambonRows {
		if t.Tambon == "" {
			continue
		}
		tambonMap[t.Amphoe] = append(tambonMap[t.Amphoe], dto.AreaAnalytics{
			Amphoe:    t.Amphoe,
			Tambon:    t.Tambon,
			Visits:    t.Visits,
			Won:       t.Won,
			Lost:      t.Lost,
			Following: t.Following,
			WinRate:   calcWinRate(t.Won, t.Lost),
		})
	}

	results := make([]dto.AreaAnalytics, len(amphoeRows))
	for i, r := range amphoeRows {
		results[i] = dto.AreaAnalytics{
			Amphoe:    r.Amphoe,
			Visits:    r.Visits,
			Won:       r.Won,
			Lost:      r.Lost,
			Following: r.Following,
			WinRate:   calcWinRate(r.Won, r.Lost),
			Children:  tambonMap[r.Amphoe],
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

	byStage, _ := s.analyticsRepo.LostByStage(ctx, from, to, repID, filter.Amphoe)
	lostSites, _ := s.analyticsRepo.LostSites(ctx, from, to, repID, filter.Amphoe)

	resp := &dto.LostReasonsResponse{
		Reasons:     make([]dto.ReasonCount, len(reasons)),
		Competitors: make([]dto.CompetitorCount, len(competitors)),
		ByStage:     make([]dto.StageCount, len(byStage)),
		Sites:       make([]dto.LostSiteBrief, len(lostSites)),
	}

	total := 0
	for i, r := range reasons {
		resp.Reasons[i] = dto.ReasonCount{Reason: r.Name, Count: r.Count}
		total += r.Count
	}
	resp.Total = total

	for i, c := range competitors {
		resp.Competitors[i] = dto.CompetitorCount{Name: c.Name, Count: c.Count}
	}
	for i, s := range byStage {
		resp.ByStage[i] = dto.StageCount{Stage: s.Name, Count: s.Count}
	}
	for i, ls := range lostSites {
		resp.Sites[i] = dto.LostSiteBrief{
			SiteCode:     ls.SiteCode,
			CustomerName: ls.CustomerName,
			Amphoe:       ls.Amphoe,
			RepID:        ls.RepID,
			RepName:      ls.RepName,
			ClosedAt:     ls.ClosedAt,
			LostReason:   ls.LostReason,
			Competitor:   ls.Competitor,
			Stage:        ls.Stage,
		}
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

func (s *analyticsServiceImpl) RecentActivity(ctx context.Context, filter *dto.AnalyticsFilter, limit int) ([]dto.RecentActivityItem, error) {
	from, to := parseRange(filter.From, filter.To)
	repID := parseUUID(filter.RepID)
	if limit <= 0 {
		limit = 12
	}

	rows, err := s.analyticsRepo.RecentReports(ctx, from, to, repID, filter.Amphoe, limit)
	if err != nil {
		return nil, err
	}

	results := make([]dto.RecentActivityItem, len(rows))
	for i, r := range rows {
		results[i] = dto.RecentActivityItem{
			ID:         r.ID,
			SiteCode:   r.SiteCode,
			RepName:    r.RepName,
			ReportType: r.ReportType,
			Note:       r.Note,
			Status:     r.Status,
			ReportDate: r.ReportDate,
		}
	}

	return results, nil
}

// Helpers

func calcWinRate(won, lost int) float64 {
	if won+lost > 0 {
		return math.Round(float64(won) / float64(won+lost) * 100)
	}
	return 0
}

func parseRange(fromStr, toStr string) (time.Time, time.Time) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)

	from, err := time.ParseInLocation("2006-01-02", fromStr, loc)
	if err != nil {
		from = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	}

	to, err := time.ParseInLocation("2006-01-02", toStr, loc)
	if err != nil {
		to = time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, loc)
	} else {
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
