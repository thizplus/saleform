package handlers

import (
	"time"

	"line-sales-api/domain/services"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type AdminCheckInHandler struct {
	checkInService services.CheckInService
}

func NewAdminCheckInHandler(cs services.CheckInService) *AdminCheckInHandler {
	return &AdminCheckInHandler{checkInService: cs}
}

func (h *AdminCheckInHandler) ListByDate(c *fiber.Ctx) error {
	ctx := c.UserContext()

	dateStr := c.Query("date")
	loc, _ := time.LoadLocation("Asia/Bangkok")
	var date time.Time
	if dateStr != "" {
		parsed, err := time.ParseInLocation("2006-01-02", dateStr, loc)
		if err != nil {
			return utils.BadRequestResponse(c, "Invalid date format (YYYY-MM-DD)")
		}
		date = parsed
	} else {
		now := time.Now().In(loc)
		date = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	}

	rows, err := h.checkInService.ListByDate(ctx, date)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to list check-ins")
	}

	return utils.SuccessResponse(c, rows)
}
