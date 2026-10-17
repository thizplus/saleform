package webhook

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"time"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

// VerifySignature validates LINE webhook signature
func VerifySignature(channelSecret string, body []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(channelSecret))
	mac.Write(body)
	expected := base64.StdEncoding.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

// WebhookBody represents the top-level webhook payload
type WebhookBody struct {
	Destination string       `json:"destination"`
	Events      []RawEvent   `json:"events"`
}

type RawEvent struct {
	Type       string          `json:"type"`
	Timestamp  int64           `json:"timestamp"`
	ReplyToken string          `json:"replyToken"`
	Source     EventSource     `json:"source"`
	Message    json.RawMessage `json:"message"`
	Unsend     *UnsendContent  `json:"unsend"`
}

type EventSource struct {
	Type    string `json:"type"` // user, group, room
	UserID  string `json:"userId"`
	GroupID string `json:"groupId"`
}

type MessageContent struct {
	ID              string          `json:"id"`
	Type            string          `json:"type"` // text, image, location, sticker, etc.
	Text            string          `json:"text"`
	QuotedMessageID string          `json:"quotedMessageId"`
	// Location
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address"`
	// ImageSet
	ImageSet  *ImageSetInfo `json:"imageSet"`
}

type ImageSetInfo struct {
	ID    string `json:"id"`
	Index int    `json:"index"`
	Total int    `json:"total"`
}

type UnsendContent struct {
	MessageID string `json:"messageId"`
}

// ParseEvents converts raw webhook body into LineEvent models
func ParseEvents(body []byte) ([]models.LineEvent, error) {
	var wb WebhookBody
	if err := json.Unmarshal(body, &wb); err != nil {
		return nil, errors.New("invalid webhook body")
	}

	events := make([]models.LineEvent, 0, len(wb.Events))
	for _, raw := range wb.Events {
		event := models.LineEvent{
			BaseModel:   models.BaseModel{ID: uuid.New()},
			EventType:   raw.Type,
			UserID:      raw.Source.UserID,
			GroupID:     raw.Source.GroupID,
			ReplyToken:  raw.ReplyToken,
			Timestamp:   time.UnixMilli(raw.Timestamp),
			RawJSON:     string(body),
		}

		// Parse message content
		if raw.Message != nil {
			var msg MessageContent
			if err := json.Unmarshal(raw.Message, &msg); err == nil {
				event.MessageType = msg.Type
				event.MessageID = msg.ID
				event.TextContent = msg.Text
				event.QuotedMessageID = msg.QuotedMessageID
				if msg.Type == "location" {
					event.LocationLat = &msg.Latitude
					event.LocationLng = &msg.Longitude
					event.LocationAddress = msg.Address
				}
			}
		}

		// Handle unsend
		if raw.Unsend != nil {
			event.MessageID = raw.Unsend.MessageID
		}

		events = append(events, event)
	}

	return events, nil
}
