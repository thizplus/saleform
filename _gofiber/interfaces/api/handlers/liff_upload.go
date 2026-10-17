package handlers

import (
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type LIFFUploadHandler struct {
	uploadService services.UploadService
}

func NewLIFFUploadHandler(us services.UploadService) *LIFFUploadHandler {
	return &LIFFUploadHandler{uploadService: us}
}

func (h *LIFFUploadHandler) Upload(c *fiber.Ctx) error {
	ctx := c.UserContext()

	userIDStr, _ := c.Locals("userID").(string)
	repID, err := uuid.Parse(userIDStr)
	if err != nil {
		return utils.UnauthorizedResponse(c, "Invalid user")
	}

	form, err := c.MultipartForm()
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid multipart form")
	}

	files := form.File["files"]
	if len(files) == 0 {
		return utils.BadRequestResponse(c, "No files provided")
	}

	resp, err := h.uploadService.UploadPhotos(ctx, repID, files)
	if err != nil {
		logger.ErrorContext(ctx, "Upload failed", "error", err)
		return utils.BadRequestResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, resp)
}
