package ports

import "context"

// LineAuthVerifier verifies LIFF ID tokens
type LineAuthVerifier interface {
	VerifyIDToken(ctx context.Context, idToken string, channelID string) (*LineIDTokenClaims, error)
}

type LineIDTokenClaims struct {
	Sub     string // LINE user ID
	Name    string
	Picture string
}

// LineMessenger sends messages via LINE Messaging API
type LineMessenger interface {
	ReplyMessage(ctx context.Context, replyToken string, messages ...any) error
	PushMessage(ctx context.Context, to string, messages ...any) error
	GetGroupMemberProfile(ctx context.Context, groupID string, userID string) (*LineProfile, error)
}

type LineProfile struct {
	UserID      string
	DisplayName string
	PictureURL  string
}

// LineContentFetcher downloads media from LINE
type LineContentFetcher interface {
	GetMessageContent(ctx context.Context, messageID string) ([]byte, string, error) // data, contentType, error
}
