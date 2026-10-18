package dto

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
	RepID      string  `json:"repId"`
	Nickname   string  `json:"nickname"`
	Area       string  `json:"area"`
	PictureURL string  `json:"pictureUrl"`
	Visits     int     `json:"visits"`
	NewSites   int     `json:"newSites"`
	FollowUps  int     `json:"followUps"`
	Won        int     `json:"won"`
	Lost       int     `json:"lost"`
	Following  int     `json:"following"`
	WinRate    float64 `json:"winRate"`
	Overdue    int     `json:"overdue"`
}

// GET /admin/analytics/trend
type TrendPoint struct {
	Bucket  string   `json:"bucket"`
	Value   int      `json:"value"`
	TeamAvg *float64 `json:"teamAvg"`
}

// GET /admin/analytics/by-area
type AreaAnalytics struct {
	Amphoe    string  `json:"amphoe"`
	Tambon    string  `json:"tambon,omitempty"`
	Visits    int     `json:"visits"`
	Won       int     `json:"won"`
	Lost      int     `json:"lost"`
	Following int     `json:"following"`
	WinRate   float64 `json:"winRate"`
}

// GET /admin/analytics/lost-reasons
type LostReasonsResponse struct {
	Reasons     []ReasonCount     `json:"reasons"`
	Competitors []CompetitorCount `json:"competitors"`
}

type ReasonCount struct {
	Reason string `json:"reason"`
	Count  int    `json:"count"`
}

type CompetitorCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// GET /admin/analytics/activity (heatmap)
type ActivityPoint struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
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
	Bucket string `query:"bucket"` // day, month, year
	Metric string `query:"metric"` // visits, won, winRate
	RepID  string `query:"repId"`
}
