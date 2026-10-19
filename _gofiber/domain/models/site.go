package models

import (
	"time"

	"github.com/google/uuid"
)

// Site represents a unique construction project/customer location
type Site struct {
	BaseModel
	SiteCode        string    `gorm:"uniqueIndex;not null"` // e.g. 691017-03 (Buddhist year)
	CustomerName    string    `gorm:"not null"`
	CustomerType    string    // ใหม่, เก่า
	ContractorName  string
	DecisionMaker   string
	Phone           string    `gorm:"index"`
	Latitude        *float64
	Longitude       *float64
	Address         string
	Amphoe          string    `gorm:"index"` // อำเภอ
	Tambon          string    // ตำบล
	Province        string
	Stage           string    `gorm:"not null;default:'new'"` // new, quoting, negotiating, won, lost, cancelled
	Status          string    `gorm:"not null;default:'following';index"` // following, won, lost, cancelled
	LostReason      string
	Competitor      string
	ExpectedOrderDate *time.Time
	NextFollowUpDate  *time.Time `gorm:"index"`
	ClosedAt        *time.Time `gorm:"index"` // วันปิดงาน (won/lost/cancelled)
	// Owner
	OwnerRepID      uuid.UUID `gorm:"type:uuid;index;not null"`
	GroupID         string    `gorm:"index"` // LINE group where site was created
	// Aggregates
	ReportCount     int       `gorm:"not null;default:0"`
	LastReportAt    *time.Time
	// Relations (not stored, loaded via GORM)
	Reports         []SiteReport `gorm:"foreignKey:SiteID"`
	Contacts        []Contact    `gorm:"foreignKey:SiteID"`
	Owner           *SalesRep    `gorm:"foreignKey:OwnerRepID"`
}
