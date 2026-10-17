package repoimpl

import (
	"context"

	"line-sales-api/domain/models"
	"line-sales-api/infrastructure/postgres"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type salesRepRepository struct {
	db *gorm.DB
}

func NewSalesRepRepository(db *gorm.DB) *salesRepRepository {
	return &salesRepRepository{db: db}
}

func (r *salesRepRepository) Create(ctx context.Context, rep *models.SalesRep) error {
	return postgres.GetDB(ctx, r.db).Create(rep).Error
}

func (r *salesRepRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SalesRep, error) {
	var rep models.SalesRep
	err := postgres.GetDB(ctx, r.db).First(&rep, id).Error
	return &rep, err
}

func (r *salesRepRepository) GetByLineUserID(ctx context.Context, lineUserID string) (*models.SalesRep, error) {
	var rep models.SalesRep
	err := postgres.GetDB(ctx, r.db).Where("line_user_id = ?", lineUserID).First(&rep).Error
	return &rep, err
}

func (r *salesRepRepository) Update(ctx context.Context, rep *models.SalesRep) error {
	return postgres.GetDB(ctx, r.db).Save(rep).Error
}

func (r *salesRepRepository) List(ctx context.Context) ([]models.SalesRep, error) {
	var reps []models.SalesRep
	err := postgres.GetDB(ctx, r.db).Order("display_name ASC").Find(&reps).Error
	return reps, err
}
