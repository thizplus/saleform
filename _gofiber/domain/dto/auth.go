package dto

// LIFF Auth
type LIFFAuthRequest struct {
	IDToken  string `json:"idToken" validate:"required"`
	// Registration fields (optional, sent when pending user submits form)
	Nickname string `json:"nickname"`
	Area     string `json:"area"`
}

type LIFFAuthResponse struct {
	Token   string      `json:"token"`
	Profile RepProfile  `json:"profile"`
}

type RepProfile struct {
	ID          string    `json:"id"`
	DisplayName string    `json:"displayName"`
	PictureURL  string    `json:"pictureUrl"`
	Nickname    string    `json:"nickname"`
	Area        string    `json:"area"`
	Status      string    `json:"status"`
	Registered  bool      `json:"registered"`
	Counts      RepCounts `json:"counts"`
}

type RepCounts struct {
	DueToday  int `json:"dueToday"`
	Overdue   int `json:"overdue"`
	Following int `json:"following"`
}

// Admin Auth
type AdminLoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AdminLoginResponse struct {
	Token string       `json:"token"`
	User  AdminProfile `json:"user"`
}

type AdminProfile struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	Role        string `json:"role"`
}
