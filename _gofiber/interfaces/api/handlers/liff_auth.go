package handlers

import (
	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type LIFFAuthHandler struct {
	authService services.AuthService
}

func NewLIFFAuthHandler(as services.AuthService) *LIFFAuthHandler {
	return &LIFFAuthHandler{authService: as}
}

func (h *LIFFAuthHandler) Auth(c *fiber.Ctx) error {
	ctx := c.UserContext()

	var req dto.LIFFAuthRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}
	if err := utils.ValidateStruct(&req); err != nil {
		return utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
	}

	resp, err := h.authService.LIFFAuth(ctx, &req)
	if err != nil {
		logger.WarnContext(ctx, "LIFF auth failed", "error", err)
		return utils.UnauthorizedResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, resp)
}

func (h *LIFFAuthHandler) Register(c *fiber.Ctx) error {
	ctx := c.UserContext()

	var req dto.RegisterRepRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}
	if err := utils.ValidateStruct(&req); err != nil {
		return utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
	}

	repID, _ := c.Locals("userID").(string)
	if err := h.authService.RegisterRep(ctx, repID, &req); err != nil {
		logger.WarnContext(ctx, "Registration failed", "error", err)
		return utils.BadRequestResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{"registered": true})
}
