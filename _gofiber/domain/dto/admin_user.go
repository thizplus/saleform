package dto

import "time"

type AdminUserResponse struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"displayName"`
	Role        string    `json:"role"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
}

type CreateAdminUserRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=6"`
	DisplayName string `json:"displayName" validate:"required"`
	Role        string `json:"role" validate:"required,oneof=admin viewer"`
}

type UpdateAdminUserRequest struct {
	DisplayName *string `json:"displayName"`
	Role        *string `json:"role"`
	IsActive    *bool   `json:"isActive"`
	Password    *string `json:"password"`
}
