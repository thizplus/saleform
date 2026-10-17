package models

type SalesRep struct {
	BaseModel
	LineUserID  string `gorm:"uniqueIndex;not null"` // LINE user ID (U...)
	DisplayName string `gorm:"not null"`
	PictureURL  string
	Nickname    string // ชื่อเล่นที่ admin ตั้ง
	Area        string // พื้นที่รับผิดชอบ
	Status      string `gorm:"not null;default:'active'"` // active, inactive, pending
}
