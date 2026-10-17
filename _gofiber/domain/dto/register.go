package dto

type RegisterRepRequest struct {
	Nickname string `json:"nickname" validate:"required"`
	Area     string `json:"area"`
	Phone    string `json:"phone"`
}
