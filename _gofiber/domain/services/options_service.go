package services

import (
	"context"

	"line-sales-api/domain/dto"
)

type OptionsService interface {
	GetOptions(ctx context.Context) (*dto.OptionsResponse, error)
	UpdateOptions(ctx context.Context, opts *dto.OptionsResponse) error
}
