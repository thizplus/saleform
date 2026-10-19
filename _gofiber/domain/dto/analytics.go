package dto

import "time"

// GET /admin/analytics/summary
type AnalyticsSummaryResponse struct {
	Visits       int      `json:"visits"`
	NewSites     int      `json:"newSites"`
	FollowUps    int      `json:"followUps"`
	Won          int      `json:"won"`
	Lost         int      `json:"lost"`
	Following    int      `json:"following"`
	Cancelled    int      `json:"cancelled"`
	WinRate      float64  `json:"winRate"`
	Overdue      int      `json:"overdue"`
	AvgDaysToWin *float64 `json:"avgDaysToWin"`
	Previous     *AnalyticsSummaryPrevious `json:"previous"`
}

type AnalyticsSummaryPrevious struct {
	Visits    int     `json:"visits"`
	NewSites  int     `json:"newSites"`
	FollowUps int     `json:"followUps"`
	Won       int     `json:"won"`
	Lost      int     `json:"lost"`
	WinRate   float64 `json:"winRate"`
}

// GET /admin/analytics/by-rep
type RepAnalytics struct {
	RepID        string   `json:"repId"`
	Nickname     string   `json:"nickname"`
	DisplayName  string   `json:"displayName"`
	Area         string   `json:"area"`
	PictureURL   string   `json:"pictureUrl"`
	Visits       int      `json:"visits"`
	NewSites     int      `json:"newSites"`
	FollowUps    int      `json:"followUps"`
	Won          int      `json:"won"`
	Lost         int      `json:"lost"`
	Cancelled    int      `json:"cancelled"`
	Following    int      `json:"following"`
	WinRate      float64  `json:"winRate"`
	Overdue      int      `json:"overdue"`
	AvgDaysToWin *float64 `json:"avgDaysToWin"`
	SitesOwned   int      `json:"sitesOwned"`
}

// GET /admin/analytics/trend — enhanced: แยก newSites, followUps, won, lost
type TrendPoint struct {
	Bucket    string   `json:"bucket"`
	Value     int      `json:"value"`
	NewSites  int      `json:"newSites"`
	FollowUps int      `json:"followUps"`
	Won       int      `json:"won"`
	Lost      int      `json:"lost"`
	TeamAvg   *float64 `json:"teamAvg"`
}

// GET /admin/analytics/by-area — enhanced: children + more fields
type AreaAnalytics struct {
	Amphoe       string          `json:"amphoe"`
	Tambon       string          `json:"tambon,omitempty"`
	Visits       int             `json:"visits"`
	NewSites     int             `json:"newSites"`
	FollowUps    int             `json:"followUps"`
	Won          int             `json:"won"`
	Lost         int             `json:"lost"`
	Cancelled    int             `json:"cancelled"`
	Following    int             `json:"following"`
	WinRate      float64         `json:"winRate"`
	Overdue      int             `json:"overdue"`
	AvgDaysToWin *float64        `json:"avgDaysToWin"`
	Children     []AreaAnalytics `json:"children,omitempty"`
}

// GET /admin/analytics/lost-reasons — enhanced: byStage + sites list
type LostReasonsResponse struct {
	Total       int              `json:"total"`
	Reasons     []ReasonCount    `json:"reasons"`
	Competitors []CompetitorCount `json:"competitors"`
	ByStage     []StageCount     `json:"byStage"`
	Sites       []LostSiteBrief  `json:"sites"`
}

type ReasonCount struct {
	Reason string `json:"reason"`
	Count  int    `json:"count"`
}

type CompetitorCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type StageCount struct {
	Stage string `json:"stage"`
	Count int    `json:"count"`
}

type LostSiteBrief struct {
	SiteCode     string    `json:"siteCode"`
	CustomerName string    `json:"customerName"`
	Amphoe       string    `json:"amphoe"`
	RepID        string    `json:"repId"`
	RepName      string    `json:"repName"`
	ClosedAt     time.Time `json:"closedAt"`
	LostReason   string    `json:"lostReason"`
	Competitor   string    `json:"competitor"`
	Stage        string    `json:"stage"`
}

// GET /admin/analytics/activity (heatmap)
type ActivityPoint struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// GET /admin/analytics/recent-activity
type RecentActivityItem struct {
	ID         string    `json:"id"`
	SiteCode   string    `json:"siteCode"`
	RepName    string    `json:"repName"`
	ReportType string    `json:"reportType"`
	Note       string    `json:"note"`
	Status     string    `json:"status"`
	ReportDate time.Time `json:"reportDate"`
}

// Shared query params
type AnalyticsFilter struct {
	From   string `query:"from"`
	To     string `query:"to"`
	RepID  string `query:"repId"`
	Amphoe string `query:"amphoe"`
}

type TrendFilter struct {
	From   string `query:"from"`
	To     string `query:"to"`
	Bucket string `query:"bucket"` // day, week
	RepID  string `query:"repId"`
	Amphoe string `query:"amphoe"`
}
