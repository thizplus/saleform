package scheduler

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"line-sales-api/application/serviceimpl"
	"line-sales-api/domain/repositories"

	"github.com/robfig/cron/v3"
)

const configKey = "daily_summary_config"

// Scheduler จัดการ cron jobs สำหรับ daily summary
type Scheduler struct {
	cron           *cron.Cron
	configRepo     repositories.AppConfigRepository
	summaryService *serviceimpl.DailySummaryService
	mu             sync.Mutex
	entryID        cron.EntryID
}

func New(configRepo repositories.AppConfigRepository, summaryService *serviceimpl.DailySummaryService) *Scheduler {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	c := cron.New(cron.WithLocation(loc))

	return &Scheduler{
		cron:           c,
		configRepo:     configRepo,
		summaryService: summaryService,
	}
}

// Start อ่าน config จาก DB แล้ว schedule job
func (s *Scheduler) Start() {
	s.Reload()
	s.cron.Start()
	slog.Info("Scheduler started")
}

// Stop หยุด scheduler
func (s *Scheduler) Stop() {
	s.cron.Stop()
	slog.Info("Scheduler stopped")
}

// Reload อ่าน config ใหม่แล้ว reschedule
func (s *Scheduler) Reload() {
	s.mu.Lock()
	defer s.mu.Unlock()

	// ลบ job เดิม
	if s.entryID != 0 {
		s.cron.Remove(s.entryID)
		s.entryID = 0
	}

	cfg := s.loadConfig()
	if cfg == nil || !cfg.Enabled || cfg.Time == "" || cfg.GroupID == "" {
		slog.Info("Daily summary disabled or not configured")
		return
	}

	// Parse time "HH:MM" → cron expression "MM HH * * *"
	var hour, minute int
	if _, err := fmt.Sscanf(cfg.Time, "%d:%d", &hour, &minute); err != nil {
		slog.Error("Invalid daily summary time format", "time", cfg.Time, "error", err)
		return
	}

	cronExpr := fmt.Sprintf("%d %d * * *", minute, hour)
	groupID := cfg.GroupID

	id, err := s.cron.AddFunc(cronExpr, func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		slog.Info("Running daily summary push", "group_id", groupID)
		if err := s.summaryService.SendDailySummary(ctx, groupID); err != nil {
			slog.Error("Daily summary push failed", "error", err)
		}
	})
	if err != nil {
		slog.Error("Failed to schedule daily summary", "error", err, "cron", cronExpr)
		return
	}

	s.entryID = id
	slog.Info("Daily summary scheduled", "time", cfg.Time, "cron", cronExpr, "group_id", cfg.GroupID)
}

func (s *Scheduler) loadConfig() *serviceimpl.DailySummaryConfig {
	ctx := context.Background()
	cfg, err := s.configRepo.Get(ctx, configKey)
	if err != nil {
		return nil
	}
	var config serviceimpl.DailySummaryConfig
	if err := json.Unmarshal([]byte(cfg.Value), &config); err != nil {
		return nil
	}
	return &config
}
