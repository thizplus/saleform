package services

import (
	"context"

	"line-sales-api/domain/dto"
)

type AuthService interface {
	LIFFAuth(ctx context.Context, req *dto.LIFFAuthRequest) (*dto.LIFFAuthResponse, error)
	RegisterRep(ctx context.Context, repID string, req *dto.RegisterRepRequest) error
	AdminLogin(ctx context.Context, req *dto.AdminLoginRequest) (*dto.AdminLoginResponse, error)
}
