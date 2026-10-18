package handlers

import (
	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type AdminAnalyticsHandler struct {
	analyticsService services.AnalyticsService
}

func NewAdminAnalyticsHandler(s services.AnalyticsService) *AdminAnalyticsHandler {
	return &AdminAnalyticsHandler{analyticsService: s}
}

func (h *AdminAnalyticsHandler) Summary(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var filter dto.AnalyticsFilter
	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequestResponse(c, "Invalid query params")
	}

	data, err := h.analyticsService.Summary(ctx, &filter)
	if err != nil {
		logger.ErrorContext(ctx, "Analytics summary failed", "error", err)
		return utils.InternalErrorResponse(c, "Failed to get summary")
	}
	return utils.SuccessResponse(c, data)
}

func (h *AdminAnalyticsHandler) ByRep(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var filter dto.AnalyticsFilter
	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequestResponse(c, "Invalid query params")
	}

	data, err := h.analyticsService.ByRep(ctx, &filter)
	if err != nil {
		logger.ErrorContext(ctx, "Analytics by-rep failed", "error", err)
		return utils.InternalErrorResponse(c, "Failed to get by-rep")
	}
	return utils.SuccessResponse(c, data)
}

func (h *AdminAnalyticsHandler) Trend(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var filter dto.TrendFilter
	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequestResponse(c, "Invalid query params")
	}

	data, err := h.analyticsService.Trend(ctx, &filter)
	if err != nil {
		logger.ErrorContext(ctx, "Analytics trend failed", "error", err)
		return utils.InternalErrorResponse(c, "Failed to get trend")
	}
	return utils.SuccessResponse(c, data)
}

func (h *AdminAnalyticsHandler) ByArea(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var filter dto.AnalyticsFilter
	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequestResponse(c, "Invalid query params")
	}
	level := c.Query("level", "amphoe")

	data, err := h.analyticsService.ByArea(ctx, &filter, level)
	if err != nil {
		logger.ErrorContext(ctx, "Analytics by-area failed", "error", err)
		return utils.InternalErrorResponse(c, "Failed to get by-area")
	}
	return utils.SuccessResponse(c, data)
}

func (h *AdminAnalyticsHandler) LostReasons(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var filter dto.AnalyticsFilter
	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequestResponse(c, "Invalid query params")
	}

	data, err := h.analyticsService.LostReasons(ctx, &filter)
	if err != nil {
		logger.ErrorContext(ctx, "Analytics lost-reasons failed", "error", err)
		return utils.InternalErrorResponse(c, "Failed to get lost reasons")
	}
	return utils.SuccessResponse(c, data)
}

func (h *AdminAnalyticsHandler) Activity(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var filter dto.AnalyticsFilter
	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequestResponse(c, "Invalid query params")
	}

	data, err := h.analyticsService.Activity(ctx, &filter)
	if err != nil {
		logger.ErrorContext(ctx, "Analytics activity failed", "error", err)
		return utils.InternalErrorResponse(c, "Failed to get activity")
	}
	return utils.SuccessResponse(c, data)
}
