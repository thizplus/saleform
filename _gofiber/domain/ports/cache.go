package ports

import (
	"context"
	"time"
)

// CachePort abstracts cache operations
type CachePort interface {
	Set(ctx context.Context, key string, value any, exp time.Duration) error
	Get(ctx context.Context, key string, dest any) error
	Delete(ctx context.Context, key string) error
}
