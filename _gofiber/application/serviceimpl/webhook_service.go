package serviceimpl

import (
	"context"
	"errors"

	"line-sales-api/domain/models"
	"line-sales-api/domain/repositories"
	"line-sales-api/domain/webhook"
	"line-sales-api/pkg/config"
	"line-sales-api/pkg/logger"
)

type webhookServiceImpl struct {
	cfg           config.LINEConfig
	lineEventRepo repositories.LineEventRepository
	lineGroupRepo repositories.LineGroupRepository
	salesRepRepo  repositories.SalesRepRepository
}

func NewWebhookService(
	cfg config.LINEConfig,
	lineEventRepo repositories.LineEventRepository,
	lineGroupRepo repositories.LineGroupRepository,
	salesRepRepo repositories.SalesRepRepository,
) *webhookServiceImpl {
	return &webhookServiceImpl{
		cfg:           cfg,
		lineEventRepo: lineEventRepo,
		lineGroupRepo: lineGroupRepo,
		salesRepRepo:  salesRepRepo,
	}
}

func (s *webhookServiceImpl) HandleEvent(ctx context.Context, body []byte, signature string) error {
	// 1. Verify signature
	if !webhook.VerifySignature(s.cfg.ChannelSecret, body, signature) {
		logger.WarnContext(ctx, "Invalid LINE webhook signature")
		return errors.New("invalid signature")
	}

	// 2. Parse events
	events, err := webhook.ParseEvents(body)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to parse webhook events", "error", err)
		return err
	}

	// 3. Store each event
	for i := range events {
		event := &events[i]
		logger.InfoContext(ctx, "Received LINE event",
			"event_type", event.EventType,
			"message_type", event.MessageType,
			"user_id", event.UserID,
			"group_id", event.GroupID,
			"message_id", event.MessageID,
		)

		if err := s.lineEventRepo.Create(ctx, event); err != nil {
			logger.ErrorContext(ctx, "Failed to store LINE event", "error", err)
			// Continue processing other events
			continue
		}

		// เก็บ group ทุกครั้งที่ได้ event จากกลุ่ม (ไม่ใช่แค่ join)
		if event.GroupID != "" {
			s.ensureGroupExists(ctx, event.GroupID)
		}
	}

	return nil
}

func (s *webhookServiceImpl) ensureGroupExists(ctx context.Context, groupID string) {
	existing, _ := s.lineGroupRepo.GetByGroupID(ctx, groupID)
	if existing != nil {
		return
	}

	// TODO: ดึง group name จาก LINE API
	group := &models.LineGroup{
		GroupID:      groupID,
		IsSalesGroup: false,
	}
	if err := s.lineGroupRepo.Create(ctx, group); err != nil {
		logger.ErrorContext(ctx, "Failed to create line group", "error", err, "group_id", groupID)
	}
}
