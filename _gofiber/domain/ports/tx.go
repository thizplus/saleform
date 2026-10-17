package ports

import "context"

// TxManager abstracts database transactions so service layer doesn't know about GORM
type TxManager interface {
	WithTx(ctx context.Context, fn func(ctx context.Context) error) error
}
