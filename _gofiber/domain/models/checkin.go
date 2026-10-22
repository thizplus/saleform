package models

import (
	"time"

	"github.com/google/uuid"
)

// DailyCheckIn เก็บข้อมูลเช็คอินก่อนเริ่มงานทุกเช้า
type DailyCheckIn struct {
	BaseModel
	RepID        uuid.UUID `gorm:"type:uuid;index;not null"`
	CheckInDate  time.Time `gorm:"type:date;index;not null"` // วันที่เช็คอิน (ไม่รวมเวลา)
	LicensePlate string    `gorm:"not null"`
	Mileage      int       `gorm:"not null"` // เลขไมล์
	SelfieURL    string    // URL รูปเซลฟี่
	SelfieKey    string    // storage key
	DailyKM      *int      // ระยะทางวันนี้ (คำนวณจากไมล์วันก่อน)

	// สรุปงานประจำวัน (เช็คอินเย็น)
	EveningMileage      *int       // เลขไมล์ตอนเย็น
	CallCount           *int       // โทรติดตามลูกค้ากี่ราย
	BillCount           *int       // เปิดบิลกี่บิล
	OldCustomerAmount   *int       // ยอดบิล ลค.เก่า (บาท)
	NewCustomerAmount   *int       // ยอดบิล ลค.ใหม่ (บาท)
	EveningSummaryAt    *time.Time // เวลาที่กดสรุปงาน
}
