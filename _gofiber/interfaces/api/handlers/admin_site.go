package handlers

import (
	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type AdminSiteHandler struct {
	siteService services.SiteService
}

func NewAdminSiteHandler(ss services.SiteService) *AdminSiteHandler {
	return &AdminSiteHandler{siteService: ss}
}

func (h *AdminSiteHandler) ListSites(c *fiber.Ctx) error {
	ctx := c.UserContext()

	var filter dto.SiteListFilter
	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequestResponse(c, "Invalid query parameters")
	}

	resp, err := h.siteService.List(ctx, nil, &filter)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to list sites", "error", err)
		return utils.InternalErrorResponse(c, "Failed to list sites")
	}

	return utils.SuccessResponse(c, resp)
}

func (h *AdminSiteHandler) GetSite(c *fiber.Ctx) error {
	ctx := c.UserContext()
	code := c.Params("code")

	resp, err := h.siteService.GetByCode(ctx, code, nil)
	if err != nil {
		return utils.NotFoundResponse(c, "Site not found")
	}

	return utils.SuccessResponse(c, resp)
}

func (h *AdminSiteHandler) UpdateSite(c *fiber.Ctx) error {
	ctx := c.UserContext()
	code := c.Params("code")

	var req dto.UpdateSiteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	if err := h.siteService.Update(ctx, code, &req); err != nil {
		logger.ErrorContext(ctx, "Failed to update site", "error", err, "code", code)
		return utils.BadRequestResponse(c, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{"updated": true})
}
