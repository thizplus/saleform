package line

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"line-sales-api/domain/ports"
	"line-sales-api/pkg/logger"
)

const apiBase = "https://api.line.me/v2/bot"

// Messenger implements ports.LineMessenger using LINE Messaging API
type Messenger struct {
	accessToken string
	client      *http.Client
}

func NewMessenger(accessToken string) *Messenger {
	return &Messenger{
		accessToken: accessToken,
		client:      &http.Client{},
	}
}

func (m *Messenger) PushMessage(ctx context.Context, to string, messages ...any) error {
	body := map[string]any{
		"to":       to,
		"messages": messages,
	}
	return m.sendRequest(ctx, "/message/push", body)
}

func (m *Messenger) ReplyMessage(ctx context.Context, replyToken string, messages ...any) error {
	body := map[string]any{
		"replyToken": replyToken,
		"messages":   messages,
	}
	return m.sendRequest(ctx, "/message/reply", body)
}

func (m *Messenger) GetGroupMemberProfile(ctx context.Context, groupID string, userID string) (*ports.LineProfile, error) {
	url := fmt.Sprintf("%s/group/%s/member/%s", apiBase, groupID, userID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+m.accessToken)

	resp, err := m.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		data, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("LINE API error %d: %s", resp.StatusCode, string(data))
	}

	var profile ports.LineProfile
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return nil, err
	}
	return &profile, nil
}

func (m *Messenger) sendRequest(ctx context.Context, path string, body any) error {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal body: %w", err)
	}

	url := apiBase + path
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+m.accessToken)

	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("LINE API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		data, _ := io.ReadAll(resp.Body)
		logger.ErrorContext(ctx, "LINE API error", "status", resp.StatusCode, "body", string(data))
		return fmt.Errorf("LINE API error %d: %s", resp.StatusCode, string(data))
	}

	return nil
}
