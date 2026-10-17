package repositories

import (
	"context"

	"line-sales-api/domain/models"

	"github.com/google/uuid"
)

type LineEventRepository interface {
	Create(ctx context.Context, event *models.LineEvent) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.LineEvent, error)
	GetByMessageID(ctx context.Context, messageID string) (*models.LineEvent, error)
	GetUnprocessed(ctx context.Context, limit int) ([]models.LineEvent, error)
	MarkProcessed(ctx context.Context, id uuid.UUID, bundleID *uuid.UUID) error
}
