package serviceimpl

import (
	"context"
	"errors"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/repositories"

	"github.com/google/uuid"
)

type groupServiceImpl struct {
	groupRepo repositories.LineGroupRepository
}

func NewGroupService(groupRepo repositories.LineGroupRepository) *groupServiceImpl {
	return &groupServiceImpl{groupRepo: groupRepo}
}

func (s *groupServiceImpl) List(ctx context.Context) ([]dto.GroupResponse, error) {
	groups, err := s.groupRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]dto.GroupResponse, 0, len(groups))
	for _, g := range groups {
		result = append(result, dto.GroupResponse{
			ID:           g.ID.String(),
			GroupID:      g.GroupID,
			GroupName:    g.GroupName,
			IsSalesGroup: g.IsSalesGroup,
			MemberCount:  g.MemberCount,
		})
	}
	return result, nil
}

func (s *groupServiceImpl) Update(ctx context.Context, id uuid.UUID, req *dto.UpdateGroupRequest) error {
	group, err := s.groupRepo.GetByID(ctx, id)
	if err != nil {
		return errors.New("group not found")
	}

	if req.IsSalesGroup != nil {
		group.IsSalesGroup = *req.IsSalesGroup
	}

	return s.groupRepo.Update(ctx, group)
}
