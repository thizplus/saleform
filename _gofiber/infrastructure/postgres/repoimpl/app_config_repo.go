package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/infrastructure/postgres"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type appConfigRepository struct {
	db *gorm.DB
}

func NewAppConfigRepository(db *gorm.DB) *appConfigRepository {
	return &appConfigRepository{db: db}
}

func (r *appConfigRepository) Get(ctx context.Context, key string) (*models.AppConfig, error) {
	var cfg models.AppConfig
	err := postgres.GetDB(ctx, r.db).Where("key = ?", key).First(&cfg).Error
	return &cfg, err
}

func (r *appConfigRepository) Set(ctx context.Context, key string, value string) error {
	cfg := models.AppConfig{Key: key, Value: value}
	return postgres.GetDB(ctx, r.db).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value"}),
	}).Create(&cfg).Error
}
