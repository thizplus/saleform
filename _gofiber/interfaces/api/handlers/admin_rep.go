package handlers

import (
	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AdminRepHandler struct {
	repService   services.RepService
	groupService services.GroupService
}

func NewAdminRepHandler(rs services.RepService, gs services.GroupService) *AdminRepHandler {
	return &AdminRepHandler{repService: rs, groupService: gs}
}

func (h *AdminRepHandler) ListReps(c *fiber.Ctx) error {
	ctx := c.UserContext()
	reps, err := h.repService.List(ctx)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to list reps", "error", err)
		return utils.InternalErrorResponse(c, "Failed to list reps")
	}
	return utils.SuccessResponse(c, reps)
}

func (h *AdminRepHandler) UpdateRep(c *fiber.Ctx) error {
	ctx := c.UserContext()
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}

	var req dto.UpdateRepRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	if err := h.repService.Update(ctx, id, &req); err != nil {
		logger.ErrorContext(ctx, "Failed to update rep", "error", err)
		return utils.BadRequestResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{"updated": true})
}

func (h *AdminRepHandler) ListGroups(c *fiber.Ctx) error {
	ctx := c.UserContext()
	groups, err := h.groupService.List(ctx)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to list groups", "error", err)
		return utils.InternalErrorResponse(c, "Failed to list groups")
	}
	return utils.SuccessResponse(c, groups)
}

func (h *AdminRepHandler) UpdateGroup(c *fiber.Ctx) error {
	ctx := c.UserContext()
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}

	var req dto.UpdateGroupRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	if err := h.groupService.Update(ctx, id, &req); err != nil {
		logger.ErrorContext(ctx, "Failed to update group", "error", err)
		return utils.BadRequestResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{"updated": true})
}
