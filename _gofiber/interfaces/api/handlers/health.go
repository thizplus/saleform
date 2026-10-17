package handlers

import (
	"github.com/gofiber/fiber/v2"
	"line-sales-api/pkg/utils"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Check(c *fiber.Ctx) error {
	return utils.SuccessResponse(c, fiber.Map{
		"status":  "ok",
		"service": "line-sales-api",
	})
}
