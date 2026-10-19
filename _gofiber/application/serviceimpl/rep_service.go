package serviceimpl

import (
	"context"
	"errors"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/repositories"

	"github.com/google/uuid"
)

type repServiceImpl struct {
	repRepo repositories.SalesRepRepository
}

func NewRepService(repRepo repositories.SalesRepRepository) *repServiceImpl {
	return &repServiceImpl{repRepo: repRepo}
}

func (s *repServiceImpl) List(ctx context.Context) ([]dto.RepResponse, error) {
	reps, err := s.repRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]dto.RepResponse, 0, len(reps))
	for _, r := range reps {
		result = append(result, dto.RepResponse{
			ID:          r.ID.String(),
			LineUserID:  r.LineUserID,
			DisplayName: r.DisplayName,
			PictureURL:  r.PictureURL,
			Nickname:    r.Nickname,
			Area:        r.Area,
			Status:      r.Status,
			CreatedAt:   r.CreatedAt,
		})
	}
	return result, nil
}

func (s *repServiceImpl) Update(ctx context.Context, id uuid.UUID, req *dto.UpdateRepRequest) error {
	rep, err := s.repRepo.GetByID(ctx, id)
	if err != nil {
		return errors.New("rep not found")
	}

	if req.Nickname != nil {
		rep.Nickname = *req.Nickname
	}
	if req.Area != nil {
		rep.Area = *req.Area
	}
	if req.Status != nil {
		rep.Status = *req.Status
	}

	return s.repRepo.Update(ctx, rep)
}
