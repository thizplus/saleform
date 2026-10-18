package main

import (
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"line-sales-api/interfaces/api/routes"
	"line-sales-api/pkg/config"
	"line-sales-api/pkg/di"
	"line-sales-api/pkg/logger"

	"github.com/gofiber/fiber/v2"
)

func main() {
	// Load config
	cfg := config.Load()

	// Init logger
	logger.Init(cfg.App.Env)
	slog.Info("Starting line-sales-api", "env", cfg.App.Env, "port", cfg.App.Port)

	// Build DI container
	container := di.NewContainer(cfg)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		BodyLimit:    10 * 1024 * 1024, // 10MB for photo uploads
		ErrorHandler: defaultErrorHandler,
	})

	// Setup routes
	routes.Setup(app, cfg, routes.Handlers{
		Health:       container.HealthHandler,
		Webhook:      container.WebhookHandler,
		LIFFAuth:     container.LIFFAuthHandler,
		LIFFSite:     container.LIFFSiteHandler,
		LIFFUpload:   container.LIFFUploadHandler,
		LIFFOptions:  container.LIFFOptionsHandler,
		AdminAuth:    container.AdminAuthHandler,
		AdminSite:    container.AdminSiteHandler,
		AdminRep:     container.AdminRepHandler,
		AdminOptions:   container.AdminOptionsHandler,
		AdminAnalytics: container.AdminAnalyticsHandler,
	})

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + cfg.App.Port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	slog.Info("Server started", "port", cfg.App.Port)

	<-quit
	slog.Info("Shutting down server...")
	if err := app.Shutdown(); err != nil {
		slog.Error("Server shutdown error", "error", err)
	}
	slog.Info("Server stopped")
}

func defaultErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"error": fiber.Map{
			"code":    "INTERNAL_ERROR",
			"message": err.Error(),
		},
	})
}
