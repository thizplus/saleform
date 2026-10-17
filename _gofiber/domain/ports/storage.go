package ports

import (
	"context"
	"io"
	"time"
)

// ObjectStorage abstracts file storage (R2, S3, local)
type ObjectStorage interface {
	Upload(ctx context.Context, key string, reader io.Reader, contentType string) error
	GetPresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error)
	PublicURL(key string) string
	Delete(ctx context.Context, key string) error
}
