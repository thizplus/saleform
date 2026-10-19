package dto

import "time"

type CheckInRequest struct {
	LicensePlate string `json:"licensePlate" validate:"required"`
	Mileage      int    `json:"mileage" validate:"required,min=0"`
	SelfieKey    string `json:"selfieKey"` // storage key จาก upload
}

type CheckInResponse struct {
	ID           string    `json:"id"`
	CheckInDate  string    `json:"checkInDate"`
	LicensePlate string    `json:"licensePlate"`
	Mileage      int       `json:"mileage"`
	SelfieURL    string    `json:"selfieUrl"`
	DailyKM      *int      `json:"dailyKm"`
	CreatedAt    time.Time `json:"createdAt"`
}

type CheckInStatusResponse struct {
	CheckedIn    bool            `json:"checkedIn"`
	Today        *CheckInResponse `json:"today,omitempty"`
	LastPlate    string          `json:"lastPlate"`    // ทะเบียนล่าสุด (pre-fill)
	LastMileage  int             `json:"lastMileage"`  // ไมล์ล่าสุด
}

// Admin
type AdminCheckInRow struct {
	ID           string    `json:"id"`
	RepID        string    `json:"repId"`
	RepName      string    `json:"repName"`
	PictureURL   string    `json:"pictureUrl"`
	CheckInDate  string    `json:"checkInDate"`
	LicensePlate string    `json:"licensePlate"`
	Mileage      int       `json:"mileage"`
	SelfieURL    string    `json:"selfieUrl"`
	DailyKM      *int      `json:"dailyKm"`
	CreatedAt    time.Time `json:"createdAt"`
}
