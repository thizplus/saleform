package dto

import "time"

type RepResponse struct {
	ID          string    `json:"id"`
	LineUserID  string    `json:"lineUserId"`
	DisplayName string    `json:"displayName"`
	PictureURL  string    `json:"pictureUrl"`
	Nickname    string    `json:"nickname"`
	Area        string    `json:"area"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

type UpdateRepRequest struct {
	Nickname *string `json:"nickname"`
	Area     *string `json:"area"`
	Status   *string `json:"status"`
}
