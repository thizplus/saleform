package models

import "time"

type LineGroup struct {
	BaseModel
	GroupID      string `gorm:"uniqueIndex;not null"` // LINE group ID (C...)
	GroupName    string
	IsSalesGroup bool      `gorm:"not null;default:false"`
	BotJoinedAt  *time.Time
	MemberCount  int       `gorm:"default:0"`
}
