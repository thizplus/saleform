package handlers

import (
	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type AdminOptionsHandler struct {
	optionsService services.OptionsService
}

func NewAdminOptionsHandler(os services.OptionsService) *AdminOptionsHandler {
	return &AdminOptionsHandler{optionsService: os}
}

func (h *AdminOptionsHandler) GetOptions(c *fiber.Ctx) error {
	ctx := c.UserContext()
	resp, err := h.optionsService.GetOptions(ctx)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to get options", "error", err)
		return utils.InternalErrorResponse(c, "Failed to get options")
	}
	return utils.SuccessResponse(c, resp)
}

func (h *AdminOptionsHandler) UpdateOptions(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var body dto.OptionsResponse
	if err := c.BodyParser(&body); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	if err := h.optionsService.UpdateOptions(ctx, &body); err != nil {
		logger.ErrorContext(ctx, "Failed to save options", "error", err)
		return utils.InternalErrorResponse(c, "Failed to save options")
	}

	return utils.SuccessResponse(c, fiber.Map{"updated": true})
}
