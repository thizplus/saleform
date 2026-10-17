package handlers

import (
	"line-sales-api/application/serviceimpl"
	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"
	"line-sales-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type LIFFSiteHandler struct {
	siteService services.SiteService
}

func NewLIFFSiteHandler(ss services.SiteService) *LIFFSiteHandler {
	return &LIFFSiteHandler{siteService: ss}
}

func (h *LIFFSiteHandler) ListSites(c *fiber.Ctx) error {
	ctx := c.UserContext()
	repID := getRepID(c)

	var filter dto.SiteListFilter
	if err := c.QueryParser(&filter); err != nil {
		return utils.BadRequestResponse(c, "Invalid query parameters")
	}

	resp, err := h.siteService.List(ctx, repID, &filter)
	if err != nil {
		logger.ErrorContext(ctx, "Failed to list sites", "error", err)
		return utils.InternalErrorResponse(c, "Failed to list sites")
	}

	return utils.SuccessResponse(c, resp)
}

func (h *LIFFSiteHandler) GetSite(c *fiber.Ctx) error {
	ctx := c.UserContext()
	code := c.Params("code")
	repID := getRepID(c)

	resp, err := h.siteService.GetByCode(ctx, code, repID)
	if err != nil {
		return utils.NotFoundResponse(c, "Site not found")
	}

	return utils.SuccessResponse(c, resp)
}

func (h *LIFFSiteHandler) CreateSite(c *fiber.Ctx) error {
	ctx := c.UserContext()
	repID := getRepID(c)
	if repID == nil {
		return utils.UnauthorizedResponse(c, "Invalid user")
	}

	var req dto.CreateSiteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}
	if err := utils.ValidateStruct(&req); err != nil {
		return utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
	}

	resp, err := h.siteService.Create(ctx, *repID, &req)
	if err != nil {
		// Check if it's a duplicate error
		if dupErr, ok := err.(*serviceimpl.DuplicateError); ok {
			return utils.ConflictResponse(c, "Possible duplicate site found", fiber.Map{
				"matches": dupErr.Matches,
			})
		}
		logger.ErrorContext(ctx, "Failed to create site", "error", err)
		return utils.BadRequestResponse(c, err.Error())
	}

	return utils.CreatedResponse(c, resp)
}

func (h *LIFFSiteHandler) CheckDuplicate(c *fiber.Ctx) error {
	ctx := c.UserContext()
	phone := c.Query("phone")
	lat := c.QueryFloat("lat", 0)
	lng := c.QueryFloat("lng", 0)

	var latPtr, lngPtr *float64
	if lat != 0 {
		latPtr = &lat
	}
	if lng != 0 {
		lngPtr = &lng
	}

	resp, err := h.siteService.CheckDuplicate(ctx, phone, latPtr, lngPtr)
	if err != nil {
		return utils.InternalErrorResponse(c, "Failed to check duplicate")
	}

	return utils.SuccessResponse(c, resp)
}

func (h *LIFFSiteHandler) CreateFollowUp(c *fiber.Ctx) error {
	ctx := c.UserContext()
	code := c.Params("code")
	repID := getRepID(c)
	if repID == nil {
		return utils.UnauthorizedResponse(c, "Invalid user")
	}

	var req dto.CreateFollowUpRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}
	if err := utils.ValidateStruct(&req); err != nil {
		return utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
	}

	resp, err := h.siteService.AddFollowUp(ctx, *repID, code, &req)
	if err != nil {
		logger.WarnContext(ctx, "Failed to create follow-up", "error", err, "site_code", code)
		return utils.BadRequestResponse(c, err.Error())
	}

	return utils.CreatedResponse(c, resp)
}

func getRepID(c *fiber.Ctx) *uuid.UUID {
	userIDStr, ok := c.Locals("userID").(string)
	if !ok {
		return nil
	}
	uid, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil
	}
	return &uid
}
