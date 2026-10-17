package services

import "context"

type WebhookService interface {
	HandleEvent(ctx context.Context, body []byte, signature string) error
}
