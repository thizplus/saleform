package main

import (
	"log/slog"

	"line-sales-api/infrastructure/postgres"
	"line-sales-api/pkg/config"
	"line-sales-api/pkg/logger"
)

func main() {
	cfg := config.Load()
	logger.Init(cfg.App.Env)

	slog.Info("Running database migration...")
	db := postgres.Connect(cfg.DB)
	postgres.AutoMigrate(db)
	slog.Info("Migration completed successfully")
}
