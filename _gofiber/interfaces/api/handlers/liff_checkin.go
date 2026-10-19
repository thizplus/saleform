package handlers

import (
	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type LIFFCheckInHandler struct {
	checkInService services.CheckInService
}

func NewLIFFCheckInHandler(cs services.CheckInService) *LIFFCheckInHandler {
	return &LIFFCheckInHandler{checkInService: cs}
}

func (h *LIFFCheckInHandler) CheckIn(c *fiber.Ctx) error {
	ctx := c.UserContext()
	repID := getRepID(c)
	if repID == nil {
		return utils.UnauthorizedResponse(c, "Invalid user")
	}

	var req dto.CheckInRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}
	if err := utils.ValidateStruct(&req); err != nil {
		return utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
	}

	resp, err := h.checkInService.CheckIn(ctx, *repID, &req)
	if err != nil {
		logger.WarnContext(ctx, "Check-in failed", "error", err)
		return utils.BadRequestResponse(c, err.Error())
	}

	return utils.CreatedResponse(c, resp)
}

func (h *LIFFCheckInHandler) GetStatus(c *fiber.Ctx) error {
	ctx := c.UserContext()
	repID := getRepID(c)
	if repID == nil {
		return utils.UnauthorizedResponse(c, "Invalid user")
	}

	resp, err := h.checkInService.GetStatus(ctx, *repID)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to get check-in status")
	}

	return utils.SuccessResponse(c, resp)
}

// getRepID is defined in liff_site.go — reuse it
