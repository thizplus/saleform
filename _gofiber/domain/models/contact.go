package models

import "github.com/google/uuid"

// Contact stores unique phone numbers linked to sites
type Contact struct {
	BaseModel
	Phone    string    `gorm:"index;not null"` // normalized: 0812345678
	SiteID   uuid.UUID `gorm:"type:uuid;index;not null"`
	IsPrimary bool     `gorm:"not null;default:true"`
}
