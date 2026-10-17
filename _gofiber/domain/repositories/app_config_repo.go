package repositories

import (
	"context"

	"line-sales-api/domain/models"
)

type AppConfigRepository interface {
	Get(ctx context.Context, key string) (*models.AppConfig, error)
	Set(ctx context.Context, key string, value string) error
}
