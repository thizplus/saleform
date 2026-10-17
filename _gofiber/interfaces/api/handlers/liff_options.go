package handlers

import (
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type LIFFOptionsHandler struct {
	optionsService services.OptionsService
}

func NewLIFFOptionsHandler(os services.OptionsService) *LIFFOptionsHandler {
	return &LIFFOptionsHandler{optionsService: os}
}

func (h *LIFFOptionsHandler) GetOptions(c *fiber.Ctx) error {
	ctx := c.UserContext()
	resp, err := h.optionsService.GetOptions(ctx)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to get options", "error", err)
		return utils.InternalErrorResponse(c, "Failed to get options")
	}
	return utils.SuccessResponse(c, resp)
}
