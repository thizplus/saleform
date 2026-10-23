package handlers

import (
	"context"
	"encoding/json"

	"line-sales-api/application/serviceimpl"
	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/logger"

	"github.com/gofiber/fiber/v2"
)

const dailySummaryConfigKey = "daily_summary_config"

type AdminDailySummaryHandler struct {
	configRepo     repositories.AppConfigRepository
	summaryService *serviceimpl.DailySummaryService
	onConfigChange func() // callback เพื่อ reload scheduler
}

func NewAdminDailySummaryHandler(
	configRepo repositories.AppConfigRepository,
	summaryService *serviceimpl.DailySummaryService,
	onConfigChange func(),
) *AdminDailySummaryHandler {
	return &AdminDailySummaryHandler{
		configRepo:     configRepo,
		summaryService: summaryService,
		onConfigChange: onConfigChange,
	}
}

// GetConfig GET /admin/daily-summary
func (h *AdminDailySummaryHandler) GetConfig(c *fiber.Ctx) error {
	ctx := c.UserContext()

	cfg, err := h.configRepo.Get(ctx, dailySummaryConfigKey)
	if err != nil {
		// ยังไม่มี config → ส่ง default
		return c.JSON(fiber.Map{
			"success": true,
			"data": serviceimpl.DailySummaryConfig{
				Enabled: false,
				Time:    "18:00",
				GroupID: "",
			},
		})
	}

	var config serviceimpl.DailySummaryConfig
	if err := json.Unmarshal([]byte(cfg.Value), &config); err != nil {
		return c.JSON(fiber.Map{
			"success": true,
			"data": serviceimpl.DailySummaryConfig{
				Enabled: false,
				Time:    "18:00",
				GroupID: "",
			},
		})
	}

	return c.JSON(fiber.Map{"success": true, "data": config})
}

// UpdateConfig PUT /admin/daily-summary
func (h *AdminDailySummaryHandler) UpdateConfig(c *fiber.Ctx) error {
	ctx := c.UserContext()

	var req serviceimpl.DailySummaryConfig
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"message": "Invalid request"}})
	}

	data, err := json.Marshal(req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"message": "Failed to serialize config"}})
	}

	if err := h.configRepo.Set(ctx, dailySummaryConfigKey, string(data)); err != nil {
		logger.ErrorContext(ctx, "Failed to save daily summary config", "error", err)
		return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"message": "Failed to save config"}})
	}

	// Reload scheduler
	if h.onConfigChange != nil {
		h.onConfigChange()
	}

	logger.InfoContext(ctx, "Daily summary config updated", "enabled", req.Enabled, "time", req.Time)
	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"updated": true}})
}

// TestSend POST /admin/daily-summary/test — ส่งทดสอบทันที
func (h *AdminDailySummaryHandler) TestSend(c *fiber.Ctx) error {
	ctx := c.UserContext()

	cfg, err := h.configRepo.Get(ctx, dailySummaryConfigKey)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"message": "ยังไม่ได้ตั้งค่า"}})
	}

	var config serviceimpl.DailySummaryConfig
	if err := json.Unmarshal([]byte(cfg.Value), &config); err != nil || config.GroupID == "" {
		return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"message": "ยังไม่ได้ตั้งค่า group ID"}})
	}

	if err := h.summaryService.SendDailySummary(context.Background(), config.GroupID); err != nil {
		logger.ErrorContext(ctx, "Test send failed", "error", err)
		return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"message": err.Error()}})
	}

	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"sent": true}})
}
