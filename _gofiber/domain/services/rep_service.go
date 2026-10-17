package services

import (
	"context"

	"line-sales-api/domain/dto"

	"github.com/google/uuid"
)

type RepService interface {
	List(ctx context.Context) ([]dto.RepResponse, error)
	Update(ctx context.Context, id uuid.UUID, req *dto.UpdateRepRequest) error
}
