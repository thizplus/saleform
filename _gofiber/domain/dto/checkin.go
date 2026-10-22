package dto

import "time"

type CheckInRequest struct {
	LicensePlate string `json:"licensePlate" validate:"required"`
	Mileage      int    `json:"mileage" validate:"required,min=0"`
	SelfieKey    string `json:"selfieKey"` // storage key จาก upload
}

type CheckInResponse struct {
	ID           string           `json:"id"`
	CheckInDate  string           `json:"checkInDate"`
	LicensePlate string           `json:"licensePlate"`
	Mileage      int              `json:"mileage"`
	SelfieURL    string           `json:"selfieUrl"`
	DailyKM      *int             `json:"dailyKm"`
	CreatedAt    time.Time        `json:"createdAt"`
	ChatMessages []map[string]any `json:"chatMessages,omitempty"`
}

type CheckInStatusResponse struct {
	CheckedIn          bool             `json:"checkedIn"`
	Today              *CheckInResponse `json:"today,omitempty"`
	LastPlate          string           `json:"lastPlate"`          // ทะเบียนล่าสุด (pre-fill)
	LastMileage        int              `json:"lastMileage"`        // ไมล์ล่าสุด
	EveningSummaryDone bool             `json:"eveningSummaryDone"` // สรุปงานประจำวันแล้วหรือยัง
}

// Evening Summary (สรุปงานประจำวัน)
type EveningSummaryRequest struct {
	Mileage           int `json:"mileage" validate:"required,min=0"`
	CallCount         int `json:"callCount" validate:"min=0"`
	BillCount         int `json:"billCount" validate:"min=0"`
	OldCustomerAmount int `json:"oldCustomerAmount" validate:"min=0"` // บาท
	NewCustomerAmount int `json:"newCustomerAmount" validate:"min=0"` // บาท
}

type EveningSummaryResponse struct {
	ID                string           `json:"id"`
	Mileage           int              `json:"mileage"`
	CallCount         int              `json:"callCount"`
	BillCount         int              `json:"billCount"`
	OldCustomerAmount int              `json:"oldCustomerAmount"`
	NewCustomerAmount int              `json:"newCustomerAmount"`
	DailyKM           *int             `json:"dailyKm"`
	ChatMessages      []map[string]any `json:"chatMessages,omitempty"`
}

// Summary
type CheckInSummaryResponse struct {
	RepID      string               `json:"repId"`
	RepName    string               `json:"repName"`
	PictureURL string               `json:"pictureUrl"`
	Period     string               `json:"period"`
	TotalKM    int                  `json:"totalKm"`
	Days       int                  `json:"checkInDays"`
	AvgKMPerDay float64             `json:"avgKmPerDay"`
	Entries    []CheckInEntryBrief  `json:"entries,omitempty"`
}

type CheckInEntryBrief struct {
	Date         string `json:"date"`
	Mileage      int    `json:"mileage"`
	DailyKM      *int   `json:"dailyKm"`
	LicensePlate string `json:"licensePlate"`
}

type TeamCheckInSummary struct {
	Period  string                    `json:"period"`
	Reps    []CheckInSummaryResponse  `json:"reps"`
}

// Admin
type AdminCheckInRow struct {
	ID                string    `json:"id"`
	RepID             string    `json:"repId"`
	RepName           string    `json:"repName"`
	PictureURL        string    `json:"pictureUrl"`
	CheckInDate       string    `json:"checkInDate"`
	LicensePlate      string    `json:"licensePlate"`
	Mileage           int       `json:"mileage"`
	SelfieURL         string    `json:"selfieUrl"`
	DailyKM           *int      `json:"dailyKm"`
	CreatedAt         time.Time `json:"createdAt"`
	// สรุปงานประจำวัน
	EveningMileage    *int      `json:"eveningMileage"`
	CallCount         *int      `json:"callCount"`
	BillCount         *int      `json:"billCount"`
	OldCustomerAmount *int      `json:"oldCustomerAmount"`
	NewCustomerAmount *int      `json:"newCustomerAmount"`
	EveningSummaryAt  *time.Time `json:"eveningSummaryAt"`
}
