package postgres

import (
	"log/slog"

	"line-sales-api/domain/models"
	"line-sales-api/pkg/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func Connect(cfg config.DBConfig) *gorm.DB {
	logLevel := gormlogger.Info
	if cfg.Host == "production" {
		logLevel = gormlogger.Warn
	}

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: gormlogger.Default.LogMode(logLevel),
	})
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		panic("failed to connect database")
	}

	slog.Info("Database connected", "host", cfg.Host, "db", cfg.Name)
	return db
}

func AutoMigrate(db *gorm.DB) {
	// Enable pg_trgm for fuzzy name matching in duplicate check
	db.Exec("CREATE EXTENSION IF NOT EXISTS pg_trgm")

	// ลำดับสำคัญ: table ที่ถูกอ้าง FK ต้องสร้างก่อน
	err := db.AutoMigrate(
		&models.AdminUser{},
		&models.LineGroup{},
		&models.SalesRep{},
		&models.LineEvent{},
		&models.Site{},
		&models.Contact{},
		&models.SiteReport{},
		&models.MediaFile{},
		&models.SiteCodeCounter{},
		&models.ReviewItem{},
		&models.AppConfig{},
	)
	if err != nil {
		slog.Error("Failed to auto migrate", "error", err)
		panic("failed to auto migrate")
	}
	slog.Info("Database migration completed")
}
