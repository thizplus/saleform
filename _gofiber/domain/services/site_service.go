package services

import (
	"context"

	"line-sales-api/domain/dto"

	"github.com/google/uuid"
)

type SiteService interface {
	Create(ctx context.Context, repID uuid.UUID, req *dto.CreateSiteRequest) (*dto.CreateSiteResponse, error)
	GetByCode(ctx context.Context, code string, viewerRepID *uuid.UUID) (*dto.SiteDetailResponse, error)
	List(ctx context.Context, repID *uuid.UUID, filter *dto.SiteListFilter) (*dto.SiteListResponse, error)
	CheckDuplicate(ctx context.Context, phone string, lat, lng *float64) (*dto.DuplicateCheckResponse, error)
	AddFollowUp(ctx context.Context, repID uuid.UUID, code string, req *dto.CreateFollowUpRequest) (*dto.CreateFollowUpResponse, error)
	// Admin
	Update(ctx context.Context, code string, req *dto.UpdateSiteRequest) error
}
