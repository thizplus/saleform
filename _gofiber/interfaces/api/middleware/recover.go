package middleware

import (
	"line-sales-api/pkg/logger"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func RecoverMiddleware() fiber.Handler {
	return recover.New(recover.Config{
		EnableStackTrace: true,
		StackTraceHandler: func(c *fiber.Ctx, e any) {
			ctx := c.UserContext()
			logger.ErrorContext(ctx, "Panic recovered", "error", e, "path", c.Path())
		},
	})
}
