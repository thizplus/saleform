package serviceimpl

import (
	"context"
	"fmt"
	"mime/multipart"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/models"
	"line-sales-api/domain/ports"
	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/logger"

	"github.com/google/uuid"
)

type uploadServiceImpl struct {
	storage   ports.ObjectStorage
	mediaRepo repositories.MediaFileRepository
}

func NewUploadService(
	storage ports.ObjectStorage,
	mediaRepo repositories.MediaFileRepository,
) *uploadServiceImpl {
	return &uploadServiceImpl{
		storage:   storage,
		mediaRepo: mediaRepo,
	}
}

func (s *uploadServiceImpl) UploadPhotos(ctx context.Context, repID uuid.UUID, files []*multipart.FileHeader) (*dto.UploadResponse, error) {
	if len(files) > 6 {
		return nil, fmt.Errorf("maximum 6 photos allowed")
	}

	uploaded := make([]dto.UploadedFile, 0, len(files))

	for _, fh := range files {
		file, err := fh.Open()
		if err != nil {
			logger.ErrorContext(ctx, "Failed to open upload", "error", err)
			continue
		}

		fileID := uuid.New()
		ext := ".jpg"
		contentType := fh.Header.Get("Content-Type")
		if contentType == "image/png" {
			ext = ".png"
		} else if contentType == "image/webp" {
			ext = ".webp"
		}

		storageKey := fmt.Sprintf("photos/%s%s", fileID.String(), ext)
		thumbKey := storageKey // ใช้รูปเดียวกันเป็น thumb (ยังไม่ resize)

		// Upload to R2
		if err := s.storage.Upload(ctx, storageKey, file, contentType); err != nil {
			file.Close()
			logger.ErrorContext(ctx, "Failed to upload to R2", "error", err, "key", storageKey)
			continue
		}
		file.Close()

		// Save to DB
		media := &models.MediaFile{
			BaseModel:  models.BaseModel{ID: fileID},
			RepID:      &repID,
			StorageKey: storageKey,
			ThumbKey:   thumbKey,
			MimeType:   contentType,
			FileSize:   fh.Size,
			Source:     "liff",
		}
		if err := s.mediaRepo.Create(ctx, media); err != nil {
			logger.ErrorContext(ctx, "Failed to save media record", "error", err)
			continue
		}

		thumbURL := s.storage.PublicURL(thumbKey)
		uploaded = append(uploaded, dto.UploadedFile{
			ID:       fileID.String(),
			ThumbURL: thumbURL,
		})
	}

	return &dto.UploadResponse{Files: uploaded}, nil
}
