package models

// SiteCodeCounter tracks the daily sequence number for site codes
// e.g. date=691017 seq=3 → next code = 691017-04
type SiteCodeCounter struct {
	Date string `gorm:"primaryKey"` // YYMMDD in Buddhist year
	Seq  int    `gorm:"not null;default:0"`
}

func (SiteCodeCounter) TableName() string {
	return "site_code_counters"
}
