package models

import (
	"time"

	"github.com/google/uuid"
)

// SiteReport represents a single visit/follow-up report for a site
type SiteReport struct {
	BaseModel
	SiteID          uuid.UUID `gorm:"type:uuid;index;not null"`
	RepID           uuid.UUID `gorm:"type:uuid;index;not null"`
	ReportType      string    `gorm:"not null"` // new, follow_up
	Note            string    `gorm:"type:text"`
	Stage           string
	Status          string    // following, won, lost, cancelled
	LostReason      string
	Competitor      string
	DecisionMaker   string
	NextFollowUpDate *time.Time
	ReportDate      time.Time `gorm:"not null;index"`
	// Source
	Source          string    `gorm:"not null;default:'liff'"` // liff, webhook, import
	IdempotencyKey  *string   `gorm:"index"`
	BundleID        *uuid.UUID `gorm:"type:uuid"`
	// Relations
	Photos          []MediaFile `gorm:"foreignKey:ReportID"`
}
