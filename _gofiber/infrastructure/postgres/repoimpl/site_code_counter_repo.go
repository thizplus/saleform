package repoimpl

import (
	"context"
	"fmt"

	"line-sales-api/infrastructure/postgres"

	"gorm.io/gorm"
)

type siteCodeCounterRepository struct {
	db *gorm.DB
}

func NewSiteCodeCounterRepository(db *gorm.DB) *siteCodeCounterRepository {
	return &siteCodeCounterRepository{db: db}
}

func (r *siteCodeCounterRepository) NextCode(ctx context.Context, datePrefix string) (string, error) {
	db := postgres.GetDB(ctx, r.db)

	// Atomic upsert + return in single query to prevent race condition
	var seq int
	err := db.Raw(`
		INSERT INTO site_code_counters (date, seq) VALUES (?, 1)
		ON CONFLICT (date) DO UPDATE SET seq = site_code_counters.seq + 1
		RETURNING seq
	`, datePrefix).Scan(&seq).Error
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s-%02d", datePrefix, seq), nil
}
