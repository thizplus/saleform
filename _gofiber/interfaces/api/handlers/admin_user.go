package handlers

import (
	"line-sales-api/domain/dto"
	"line-sales-api/domain/models"
	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminUserHandler struct {
	userRepo repositories.AdminUserRepository
}

func NewAdminUserHandler(repo repositories.AdminUserRepository) *AdminUserHandler {
	return &AdminUserHandler{userRepo: repo}
}

func (h *AdminUserHandler) ListUsers(c *fiber.Ctx) error {
	ctx := c.UserContext()
	users, err := h.userRepo.List(ctx)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to list users", "error", err)
		return utils.InternalErrorResponse(c, "Failed to list users")
	}

	resp := make([]dto.AdminUserResponse, len(users))
	for i, u := range users {
		resp[i] = dto.AdminUserResponse{
			ID:          u.ID.String(),
			Email:       u.Email,
			DisplayName: u.DisplayName,
			Role:        u.Role,
			IsActive:    u.IsActive,
			CreatedAt:   u.CreatedAt,
		}
	}
	return utils.SuccessResponse(c, resp)
}

func (h *AdminUserHandler) CreateUser(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var req dto.CreateAdminUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Check duplicate email
	if existing, _ := h.userRepo.GetByEmail(ctx, req.Email); existing != nil {
		return utils.BadRequestResponse(c, "อีเมลนี้ถูกใช้แล้ว")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to hash password")
	}

	user := &models.AdminUser{
		BaseModel:    models.BaseModel{ID: uuid.New()},
		Email:        req.Email,
		PasswordHash: string(hash),
		DisplayName:  req.DisplayName,
		Role:         req.Role,
		IsActive:     true,
	}

	if err := h.userRepo.Create(ctx, user); err != nil {
		logger.ErrorContext(ctx, "Failed to create user", "error", err)
		return utils.InternalErrorResponse(c, "Failed to create user")
	}

	logger.InfoContext(ctx, "Admin user created", "email", req.Email)
	return utils.CreatedResponse(c, dto.AdminUserResponse{
		ID:          user.ID.String(),
		Email:       user.Email,
		DisplayName: user.DisplayName,
		Role:        user.Role,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt,
	})
}

func (h *AdminUserHandler) UpdateUser(c *fiber.Ctx) error {
	ctx := c.UserContext()
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}

	user, err := h.userRepo.GetByID(ctx, id)
	if err != nil {
		return utils.NotFoundResponse(c, "User not found")
	}

	var req dto.UpdateAdminUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	if req.DisplayName != nil {
		user.DisplayName = *req.DisplayName
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.Password != nil && *req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return utils.InternalErrorResponse(c, "Failed to hash password")
		}
		user.PasswordHash = string(hash)
	}

	if err := h.userRepo.Update(ctx, user); err != nil {
		logger.ErrorContext(ctx, "Failed to update user", "error", err)
		return utils.InternalErrorResponse(c, "Failed to update user")
	}

	return utils.SuccessResponse(c, fiber.Map{"updated": true})
}
