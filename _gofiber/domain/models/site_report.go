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
	ReportType         string    `gorm:"not null"` // new, follow_up
	Note               string    `gorm:"type:text"` // สินค้าที่สนใจ (เดิมคือหมายเหตุ)
	Stage              string
	Status             string    // following, won, lost, cancelled
	LostReason         string
	Competitor         string
	DecisionMaker      string
	JobType            string    // ตัวเลือกงาน (จาก admin options)
	JobTypeOther       string    // ข้อความเพิ่มเมื่อเลือก "อื่นๆ"
	JobDetail          string    `gorm:"type:text"` // รายละเอียดหน้างาน
	CloseStatus        string    // "", "success", "failed"
	CloseAmount        int64     // ยอดเปิดบิล (บาท) เมื่อ success
	CloseReason        string    // เหตุผลไม่สำเร็จ เมื่อ failed
	CloseReasonOther   string    // free text เมื่อเลือก "อื่นๆ"
	NextFollowUpDate *time.Time
	ReportDate      time.Time `gorm:"not null;index"`
	// Source
	Source          string    `gorm:"not null;default:'liff'"` // liff, webhook, import
	IdempotencyKey  *string   `gorm:"index"`
	BundleID        *uuid.UUID `gorm:"type:uuid"`
	// Relations
	Photos          []MediaFile `gorm:"foreignKey:ReportID"`
}
