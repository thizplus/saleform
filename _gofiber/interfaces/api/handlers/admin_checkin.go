package handlers

import (
	"time"

	"line-sales-api/domain/services"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AdminCheckInHandler struct {
	checkInService services.CheckInService
}

func NewAdminCheckInHandler(cs services.CheckInService) *AdminCheckInHandler {
	return &AdminCheckInHandler{checkInService: cs}
}

func (h *AdminCheckInHandler) ListByDate(c *fiber.Ctx) error {
	ctx := c.UserContext()
	date := parseDateParam(c, "date")

	rows, err := h.checkInService.ListByDate(ctx, date)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to list check-ins")
	}

	return utils.SuccessResponse(c, rows)
}

func (h *AdminCheckInHandler) TeamSummary(c *fiber.Ctx) error {
	ctx := c.UserContext()
	from, to := parsePeriodParams(c)

	resp, err := h.checkInService.TeamSummary(ctx, from, to)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to get summary")
	}

	return utils.SuccessResponse(c, resp)
}

func (h *AdminCheckInHandler) RepSummary(c *fiber.Ctx) error {
	ctx := c.UserContext()
	repIDStr := c.Params("repId")
	repID, err := uuid.Parse(repIDStr)
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid rep ID")
	}

	from, to := parsePeriodParams(c)

	resp, err := h.checkInService.RepSummary(ctx, repID, from, to)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to get rep summary")
	}

	return utils.SuccessResponse(c, resp)
}

// helpers

func parseDateParam(c *fiber.Ctx, param string) time.Time {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	dateStr := c.Query(param)
	if dateStr != "" {
		if parsed, err := time.ParseInLocation("2006-01-02", dateStr, loc); err == nil {
			return parsed
		}
	}
	now := time.Now().In(loc)
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
}

func parsePeriodParams(c *fiber.Ctx) (time.Time, time.Time) {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(loc)

	fromStr := c.Query("from")
	toStr := c.Query("to")
	period := c.Query("period", "month")

	if fromStr != "" && toStr != "" {
		from, _ := time.ParseInLocation("2006-01-02", fromStr, loc)
		to, _ := time.ParseInLocation("2006-01-02", toStr, loc)
		if !from.IsZero() && !to.IsZero() {
			return from, to
		}
	}

	switch period {
	case "week":
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		from := time.Date(now.Year(), now.Month(), now.Day()-(weekday-1), 0, 0, 0, 0, loc)
		to := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		return from, to
	case "year":
		from := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, loc)
		to := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		return from, to
	default: // month
		from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		to := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		return from, to
	}
}
