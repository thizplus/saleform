package models

import (
	"time"

	"github.com/google/uuid"
)

// LineEvent stores raw LINE webhook events for replay/audit
type LineEvent struct {
	BaseModel
	EventType   string    `gorm:"not null;index"` // message, follow, join, memberJoined, unsend, etc.
	MessageType string    // text, image, location, sticker, etc.
	MessageID   string    `gorm:"index"`
	UserID      string    `gorm:"index"` // LINE user ID
	GroupID     string    `gorm:"index"` // LINE group ID
	ReplyToken  string
	Timestamp   time.Time `gorm:"not null"`
	RawJSON     string    `gorm:"type:jsonb;not null"` // full event JSON for replay
	// Parsed text fields
	TextContent      string
	QuotedMessageID  string
	// Location fields
	LocationLat      *float64
	LocationLng      *float64
	LocationAddress  string
	// Processing state
	Processed        bool      `gorm:"not null;default:false;index"`
	BundleID         *uuid.UUID `gorm:"type:uuid;index"`
}
