package utils

import (
	"github.com/gofiber/fiber/v2"
)

type Response struct {
	Success bool       `json:"success"`
	Data    any        `json:"data,omitempty"`
	Error   *ErrorInfo `json:"error,omitempty"`
}

type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

type PaginatedResponse struct {
	Success bool `json:"success"`
	Data    any  `json:"data"`
	Meta    Meta `json:"meta"`
}

type Meta struct {
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalPages int   `json:"totalPages"`
	HasNext    bool  `json:"hasNext"`
	HasPrev    bool  `json:"hasPrev"`
}

// Error code constants
const (
	ErrCodeValidation    = "VALIDATION_ERROR"
	ErrCodeUnauthorized  = "UNAUTHORIZED"
	ErrCodeForbidden     = "FORBIDDEN"
	ErrCodeNotFound      = "NOT_FOUND"
	ErrCodeConflict      = "CONFLICT"
	ErrCodeInternalError = "INTERNAL_ERROR"
	ErrCodeBadRequest    = "BAD_REQUEST"
)

func SuccessResponse(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusOK).JSON(Response{
		Success: true,
		Data:    data,
	})
}

func CreatedResponse(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusCreated).JSON(Response{
		Success: true,
		Data:    data,
	})
}

func PaginatedSuccessResponse(c *fiber.Ctx, data any, meta Meta) error {
	return c.Status(fiber.StatusOK).JSON(PaginatedResponse{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

func BadRequestResponse(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusBadRequest).JSON(Response{
		Success: false,
		Error:   &ErrorInfo{Code: ErrCodeBadRequest, Message: message},
	})
}

func ValidationErrorResponse(c *fiber.Ctx, details any) error {
	return c.Status(fiber.StatusBadRequest).JSON(Response{
		Success: false,
		Error:   &ErrorInfo{Code: ErrCodeValidation, Message: "Validation failed", Details: details},
	})
}

func UnauthorizedResponse(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusUnauthorized).JSON(Response{
		Success: false,
		Error:   &ErrorInfo{Code: ErrCodeUnauthorized, Message: message},
	})
}

func ForbiddenResponse(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusForbidden).JSON(Response{
		Success: false,
		Error:   &ErrorInfo{Code: ErrCodeForbidden, Message: message},
	})
}

func NotFoundResponse(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusNotFound).JSON(Response{
		Success: false,
		Error:   &ErrorInfo{Code: ErrCodeNotFound, Message: message},
	})
}

func ConflictResponse(c *fiber.Ctx, message string, details any) error {
	return c.Status(fiber.StatusConflict).JSON(Response{
		Success: false,
		Error:   &ErrorInfo{Code: ErrCodeConflict, Message: message, Details: details},
	})
}

func InternalErrorResponse(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusInternalServerError).JSON(Response{
		Success: false,
		Error:   &ErrorInfo{Code: ErrCodeInternalError, Message: message},
	})
}
