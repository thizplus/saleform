package services

import (
	"context"
	"mime/multipart"

	"line-sales-api/domain/dto"

	"github.com/google/uuid"
)

type UploadService interface {
	UploadPhotos(ctx context.Context, repID uuid.UUID, files []*multipart.FileHeader) (*dto.UploadResponse, error)
}
