package di

import (
	"context"

	"line-sales-api/application/serviceimpl"
	"line-sales-api/domain/models"
	"line-sales-api/domain/ports"
	"line-sales-api/domain/repositories"
	"line-sales-api/domain/services"
	"line-sales-api/infrastructure/postgres"
	infraredis "line-sales-api/infrastructure/redis"
	"line-sales-api/infrastructure/line"
	"line-sales-api/infrastructure/storage"
	"line-sales-api/interfaces/api/handlers"
	"line-sales-api/pkg/config"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Container struct {
	Config  *config.Config
	DB      *gorm.DB
	Redis   *infraredis.RedisClient
	Storage ports.ObjectStorage

	// Services
	WebhookService services.WebhookService
	AuthService    services.AuthService
	SiteService    services.SiteService
	UploadService  services.UploadService

	// LIFF Handlers
	HealthHandler      *handlers.HealthHandler
	WebhookHandler     *handlers.WebhookHandler
	LIFFAuthHandler    *handlers.LIFFAuthHandler
	LIFFSiteHandler    *handlers.LIFFSiteHandler
	LIFFUploadHandler  *handlers.LIFFUploadHandler
	LIFFOptionsHandler *handlers.LIFFOptionsHandler

	// Admin Handlers
	AdminAuthHandler    *handlers.AdminAuthHandler
	AdminSiteHandler    *handlers.AdminSiteHandler
	AdminRepHandler     *handlers.AdminRepHandler
	AdminOptionsHandler *handlers.AdminOptionsHandler
}

func NewContainer(cfg *config.Config) *Container {
	c := &Container{Config: cfg}

	// Infrastructure
	c.DB = postgres.Connect(cfg.DB)
	postgres.AutoMigrate(c.DB)
	c.Redis = infraredis.Connect(cfg.Redis)

	if cfg.R2.AccessKeyID != "" {
		c.Storage = storage.NewR2Storage(cfg.R2)
	}

	txManager := postgres.NewTxManager(c.DB)
	repos := newRepositories(c.DB)

	// LINE Messenger (ถ้ามี access token)
	var lineMessenger ports.LineMessenger
	if cfg.LINE.ChannelAccessToken != "" {
		lineMessenger = line.NewMessenger(cfg.LINE.ChannelAccessToken)
	}

	// Services
	c.WebhookService = serviceimpl.NewWebhookService(cfg.LINE, repos.lineEvent, repos.lineGroup, repos.salesRep)
	c.AuthService = serviceimpl.NewAuthService(cfg.JWT, cfg.LINE, repos.salesRep, repos.adminUser, repos.site)
	c.SiteService = serviceimpl.NewSiteService(repos.site, repos.siteReport, repos.contact, repos.mediaFile, repos.siteCodeCounter, repos.salesRep, txManager, cfg.R2.PublicURL, lineMessenger)

	if c.Storage != nil {
		c.UploadService = serviceimpl.NewUploadService(c.Storage, repos.mediaFile)
	}

	repService := serviceimpl.NewRepService(repos.salesRep)
	groupService := serviceimpl.NewGroupService(repos.lineGroup)
	optionsService := serviceimpl.NewOptionsService(repos.appConfig)

	// LIFF Handlers
	c.HealthHandler = handlers.NewHealthHandler()
	c.WebhookHandler = handlers.NewWebhookHandler(c.WebhookService)
	c.LIFFAuthHandler = handlers.NewLIFFAuthHandler(c.AuthService)
	c.LIFFSiteHandler = handlers.NewLIFFSiteHandler(c.SiteService)
	c.LIFFOptionsHandler = handlers.NewLIFFOptionsHandler(optionsService)
	if c.UploadService != nil {
		c.LIFFUploadHandler = handlers.NewLIFFUploadHandler(c.UploadService)
	}

	// Admin Handlers
	c.AdminAuthHandler = handlers.NewAdminAuthHandler(c.AuthService)
	c.AdminSiteHandler = handlers.NewAdminSiteHandler(c.SiteService)
	c.AdminRepHandler = handlers.NewAdminRepHandler(repService, groupService)
	c.AdminOptionsHandler = handlers.NewAdminOptionsHandler(optionsService)

	// Seed default admin (dev only)
	if cfg.App.Env == "development" {
		seedAdmin(repos.adminUser)
	}

	return c
}

func seedAdmin(repo repositories.AdminUserRepository) {
	ctx := context.Background()
	if _, err := repo.GetByEmail(ctx, "admin@puekk.com"); err == nil {
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin1234"), bcrypt.DefaultCost)
	admin := &models.AdminUser{
		BaseModel:    models.BaseModel{ID: uuid.New()},
		Email:        "admin@puekk.com",
		PasswordHash: string(hash),
		DisplayName:  "Admin",
		Role:         "admin",
		IsActive:     true,
	}
	_ = repo.Create(ctx, admin)
}
