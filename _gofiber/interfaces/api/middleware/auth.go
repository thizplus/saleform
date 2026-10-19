package middleware

import (
	"strings"

	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/config"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTClaims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"` // sales, admin, viewer
	jwt.RegisteredClaims
}

// StatusChecker ตรวจสอบว่า user ยัง active อยู่หรือไม่
type StatusChecker struct {
	SalesRepRepo repositories.SalesRepRepository
	AdminRepo    repositories.AdminUserRepository
}

// AuthMiddleware validates JWT and sets claims in context
func AuthMiddleware(cfg config.JWTConfig, requiredRole string, checker ...*StatusChecker) fiber.Handler {
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

		// DB status check — ตรวจว่า user ยัง active อยู่
		if len(checker) > 0 && checker[0] != nil {
			sc := checker[0]
			uid, parseErr := uuid.Parse(claims.UserID)
			if parseErr != nil {
				return utils.UnauthorizedResponse(c, "Invalid user ID")
			}

			switch claims.Role {
			case "sales":
				if sc.SalesRepRepo != nil {
					rep, err := sc.SalesRepRepo.GetByID(c.UserContext(), uid)
					if err != nil || rep == nil || rep.Status != "active" {
						return utils.UnauthorizedResponse(c, "บัญชีถูกปิดใช้งาน")
					}
				}
			case "admin", "viewer":
				if sc.AdminRepo != nil {
					user, err := sc.AdminRepo.GetByID(c.UserContext(), uid)
					if err != nil || user == nil || !user.IsActive {
						return utils.UnauthorizedResponse(c, "บัญชีถูกปิดใช้งาน")
					}
				}
			}
		}

		c.Locals("userID", claims.UserID)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}
