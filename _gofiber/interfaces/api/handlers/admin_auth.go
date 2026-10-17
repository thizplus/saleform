package handlers

import (
	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type AdminAuthHandler struct {
	authService services.AuthService
}

func NewAdminAuthHandler(as services.AuthService) *AdminAuthHandler {
	return &AdminAuthHandler{authService: as}
}

func (h *AdminAuthHandler) Login(c *fiber.Ctx) error {
	ctx := c.UserContext()

	var req dto.AdminLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}
	if err := utils.ValidateStruct(&req); err != nil {
		return utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
	}

	resp, err := h.authService.AdminLogin(ctx, &req)
	if err != nil {
		logger.WarnContext(ctx, "Admin login failed", "email", req.Email, "error", err)
		return utils.UnauthorizedResponse(c, "Invalid credentials")
	}

	return utils.SuccessResponse(c, resp)
}
