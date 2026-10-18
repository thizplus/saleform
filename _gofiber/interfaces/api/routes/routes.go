package routes

import (
	"line-sales-api/interfaces/api/handlers"
	"line-sales-api/interfaces/api/middleware"
	"line-sales-api/pkg/config"

	"github.com/gofiber/fiber/v2"
)

type Handlers struct {
	Health      *handlers.HealthHandler
	Webhook     *handlers.WebhookHandler
	LIFFAuth    *handlers.LIFFAuthHandler
	LIFFSite    *handlers.LIFFSiteHandler
	LIFFUpload  *handlers.LIFFUploadHandler
	LIFFOptions *handlers.LIFFOptionsHandler
	// Admin
	AdminAuth      *handlers.AdminAuthHandler
	AdminSite      *handlers.AdminSiteHandler
	AdminRep       *handlers.AdminRepHandler
	AdminOptions   *handlers.AdminOptionsHandler
	AdminAnalytics *handlers.AdminAnalyticsHandler
}

func Setup(app *fiber.App, cfg *config.Config, h Handlers) {
	app.Use(middleware.RecoverMiddleware())
	app.Use(middleware.RequestIDMiddleware())
	app.Use(middleware.LoggerMiddleware())
	app.Use(middleware.CORSMiddleware(cfg.CORS.Origins))

	app.Get("/health", h.Health.Check)
	app.Post("/webhook/line", h.Webhook.HandleLineWebhook)

	v1 := app.Group("/api/v1")

	// LIFF auth
	v1.Post("/liff/auth", h.LIFFAuth.Auth)

	// LIFF routes
	liff := v1.Group("/liff", middleware.AuthMiddleware(cfg.JWT, "sales"))
	liff.Get("/options", h.LIFFOptions.GetOptions)
	liff.Get("/me/stats", h.LIFFSite.GetMyStats)
	liff.Get("/sites", h.LIFFSite.ListSites)
	liff.Get("/sites/check-duplicate", h.LIFFSite.CheckDuplicate)
	liff.Get("/sites/:code", h.LIFFSite.GetSite)
	liff.Post("/sites", h.LIFFSite.CreateSite)
	liff.Post("/sites/:code/follow-ups", h.LIFFSite.CreateFollowUp)
	if h.LIFFUpload != nil {
		liff.Post("/uploads", h.LIFFUpload.Upload)
	}

	// Admin auth
	v1.Post("/admin/auth", h.AdminAuth.Login)

	// Admin routes
	admin := v1.Group("/admin", middleware.AuthMiddleware(cfg.JWT, "admin"))
	admin.Get("/sites", h.AdminSite.ListSites)
	admin.Get("/sites/:code", h.AdminSite.GetSite)
	admin.Patch("/sites/:code", h.AdminSite.UpdateSite)
	admin.Get("/reps", h.AdminRep.ListReps)
	admin.Patch("/reps/:id", h.AdminRep.UpdateRep)
	admin.Get("/groups", h.AdminRep.ListGroups)
	admin.Patch("/groups/:id", h.AdminRep.UpdateGroup)
	admin.Get("/options", h.AdminOptions.GetOptions)
	admin.Put("/options", h.AdminOptions.UpdateOptions)

	// Analytics
	analytics := admin.Group("/analytics")
	analytics.Get("/summary", h.AdminAnalytics.Summary)
	analytics.Get("/by-rep", h.AdminAnalytics.ByRep)
	analytics.Get("/trend", h.AdminAnalytics.Trend)
	analytics.Get("/by-area", h.AdminAnalytics.ByArea)
	analytics.Get("/lost-reasons", h.AdminAnalytics.LostReasons)
	analytics.Get("/activity", h.AdminAnalytics.Activity)
}
