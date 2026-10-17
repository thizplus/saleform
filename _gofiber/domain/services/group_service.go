package services

import (
	"context"

	"line-sales-api/domain/dto"

	"github.com/google/uuid"
)

type GroupService interface {
	List(ctx context.Context) ([]dto.GroupResponse, error)
	Update(ctx context.Context, id uuid.UUID, req *dto.UpdateGroupRequest) error
}
