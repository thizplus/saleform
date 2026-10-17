package dto

type UploadResponse struct {
	Files []UploadedFile `json:"files"`
}

type UploadedFile struct {
	ID       string `json:"id"`
	ThumbURL string `json:"thumbUrl"`
}
