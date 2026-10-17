package models

import "github.com/google/uuid"

// ReviewItem stores messages that couldn't be matched to a site
type ReviewItem struct {
	BaseModel
	EventID     uuid.UUID `gorm:"type:uuid;not null"`
	BundleID    *uuid.UUID `gorm:"type:uuid"`
	RepID       *uuid.UUID `gorm:"type:uuid"`
	Reason      string    `gorm:"not null"` // no_match, ambiguous, parse_error
	Suggestion  string    // suggested site code if any
	Status      string    `gorm:"not null;default:'pending';index"` // pending, resolved, skipped
	ResolvedBy  *uuid.UUID `gorm:"type:uuid"` // admin who resolved
	ResolvedAs  string    // linked, new_site, skipped
	LinkedSiteID *uuid.UUID `gorm:"type:uuid"`
}
