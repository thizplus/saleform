package middleware

import (
	"strings"

	"line-sales-api/pkg/config"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"` // sales, admin, viewer
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT and sets claims in context
func AuthMiddleware(cfg config.JWTConfig, requiredRole string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return utils.UnauthorizedResponse(c, "Missing authorization header")
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenStr == authHeader {
			return utils.UnauthorizedResponse(c, "Invalid authorization format")
		}

		token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (any, error) {
			return []byte(cfg.Secret), nil
		})
		if err != nil || !token.Valid {
			return utils.UnauthorizedResponse(c, "Invalid or expired token")
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok {
			return utils.UnauthorizedResponse(c, "Invalid token claims")
		}

		// Check role strictly
		if requiredRole != "" {
			allowed := false
			switch requiredRole {
			case "sales":
				allowed = claims.Role == "sales"
			case "admin":
				allowed = claims.Role == "admin" || (claims.Role == "viewer" && c.Method() == "GET")
			}
			if !allowed {
				return utils.ForbiddenResponse(c, "Insufficient permissions")
			}
		}

		c.Locals("userID", claims.UserID)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}
