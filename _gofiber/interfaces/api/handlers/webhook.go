package handlers

import (
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type WebhookHandler struct {
	webhookService services.WebhookService
}

func NewWebhookHandler(ws services.WebhookService) *WebhookHandler {
	return &WebhookHandler{webhookService: ws}
}

func (h *WebhookHandler) HandleLineWebhook(c *fiber.Ctx) error {
	ctx := c.UserContext()
	signature := c.Get("X-Line-Signature")

	if signature == "" {
		logger.WarnContext(ctx, "Missing LINE signature")
		return utils.BadRequestResponse(c, "Missing X-Line-Signature")
	}

	body := c.Body()
	if err := h.webhookService.HandleEvent(ctx, body, signature); err != nil {
		logger.ErrorContext(ctx, "Webhook processing failed", "error", err)
		return utils.InternalErrorResponse(c, "Failed to process webhook")
	}

	// LINE expects 200 OK quickly
	return c.SendStatus(fiber.StatusOK)
}
