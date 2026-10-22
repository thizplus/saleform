package services

import (
	"context"
	"time"

	"line-sales-api/domain/dto"

	"github.com/google/uuid"
)

type CheckInService interface {
	CheckIn(ctx context.Context, repID uuid.UUID, req *dto.CheckInRequest) (*dto.CheckInResponse, error)
	GetStatus(ctx context.Context, repID uuid.UUID) (*dto.CheckInStatusResponse, error)
	EveningSummary(ctx context.Context, repID uuid.UUID, req *dto.EveningSummaryRequest) (*dto.EveningSummaryResponse, error)
	ListByDate(ctx context.Context, date time.Time) ([]dto.AdminCheckInRow, error)
	RepSummary(ctx context.Context, repID uuid.UUID, from, to time.Time) (*dto.CheckInSummaryResponse, error)
	TeamSummary(ctx context.Context, from, to time.Time) (*dto.TeamCheckInSummary, error)
}
