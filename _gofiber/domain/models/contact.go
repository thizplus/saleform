package models

import "github.com/google/uuid"

// Contact stores contacts linked to sites (ผู้ติดต่อหลายคนต่อใบงาน)
type Contact struct {
	BaseModel
	SiteID      uuid.UUID `gorm:"type:uuid;index;not null"`
	Name        string    // ชื่อผู้ติดต่อ
	Phone       string    `gorm:"index"` // normalized: 0812345678
	ContactType string    // ผู้มุ่งหวังใหม่, ลูกค้าเก่า, ไม่พบผู้มีอำนาจตัดสินใจ
	Authority   string    // มีอำนาจตัดสินใจ, ไม่มีอำนาจ
	IsPrimary   bool      `gorm:"not null;default:false"`
}
