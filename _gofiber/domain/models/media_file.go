package models

import "github.com/google/uuid"

// MediaFile stores uploaded images (from LIFF or LINE message)
type MediaFile struct {
	BaseModel
	ReportID    *uuid.UUID `gorm:"type:uuid;index"`
	BundleID    *uuid.UUID `gorm:"type:uuid;index"`
	RepID       *uuid.UUID `gorm:"type:uuid"`
	// Storage
	StorageKey  string `gorm:"not null"` // R2 key: photos/691017-03/uuid.jpg
	ThumbKey    string // R2 key: thumbs/691017-03/uuid.jpg (public)
	OriginalURL string // original LINE content URL (temporary)
	// Metadata
	MimeType    string `gorm:"not null;default:'image/jpeg'"`
	FileSize    int64
	Width       int
	Height      int
	Source      string `gorm:"not null;default:'liff'"` // liff, webhook
}
