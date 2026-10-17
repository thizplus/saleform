package dto

import "time"

// Create Site (new report)
type CreateSiteRequest struct {
	Phone            string   `json:"phone" validate:"required"`
	CustomerName     string   `json:"customerName" validate:"required"`
	CustomerType     string   `json:"customerType"`
	ContractorName   string   `json:"contractorName"`
	DecisionMaker    string   `json:"decisionMaker"`
	Stage            string   `json:"stage"`
	Detail           string   `json:"detail"`
	Latitude         *float64 `json:"lat"`
	Longitude        *float64 `json:"lng"`
	Address          string   `json:"address"`
	Tambon           string   `json:"tambon"`
	Amphoe           string   `json:"amphoe"`
	ExpectedOrderDate *string `json:"expectedOrderDate"` // YYYY-MM-DD
	NextFollowUpDate  *string `json:"nextFollowUpDate"`  // YYYY-MM-DD
	PhotoIDs         []string `json:"photoIds"`
	ForceNew         bool     `json:"forceNew"` // skip duplicate check
}

type CreateSiteResponse struct {
	Site         SiteBrief        `json:"site"`
	Report       ReportBrief      `json:"report"`
	ChatMessages []map[string]any `json:"chatMessages"` // LINE messages (text+image+location) ส่งผ่าน liff.sendMessages()
}

// Follow-up
type CreateFollowUpRequest struct {
	Note             string   `json:"note" validate:"required"`
	Status           string   `json:"status" validate:"required,oneof=following won lost cancelled"`
	NextFollowUpDate *string  `json:"nextFollowUpDate"` // required if status=following
	LostReason       string   `json:"lostReason"`       // required if status=lost
	Competitor       string   `json:"competitor"`
	Stage            string   `json:"stage"`
	DecisionMaker    string   `json:"decisionMaker"`
	PhotoIDs         []string `json:"photoIds"`
}

type CreateFollowUpResponse struct {
	Site         SiteBrief        `json:"site"`
	Report       ReportBrief      `json:"report"`
	ChatMessages []map[string]any `json:"chatMessages"`
}

// Site list
type SiteListFilter struct {
	Tab    string `query:"tab"`    // due_today, overdue, following, all
	Search string `query:"q"`
	Page   int    `query:"page"`
	Limit  int    `query:"limit"`
	// Admin filters
	Status string `query:"status"`
	RepID  string `query:"repId"`
	Amphoe string `query:"amphoe"`
}

type SiteListResponse struct {
	Sites []SiteBrief `json:"sites"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

type SiteBrief struct {
	SiteCode         string  `json:"siteCode"`
	CustomerName     string  `json:"customerName"`
	Phone            string  `json:"phone"`
	Status           string  `json:"status"`
	Stage            string  `json:"stage"`
	NextFollowUpDate *string `json:"nextFollowUpDate"`
	ThumbURL         string  `json:"thumbUrl"`
	IsMine           bool    `json:"isMine"`
	OwnerName        string  `json:"ownerName"`
	ReportCount      int     `json:"reportCount"`
	ContractorName   string     `json:"contractorName"`
	Tambon           string     `json:"tambon"`
	Amphoe           string     `json:"amphoe"`
	Lat              *float64   `json:"lat"`
	Lng              *float64   `json:"lng"`
	LastReportAt     *time.Time `json:"lastReportAt"`
}

// Site detail
type SiteDetailResponse struct {
	SiteCode         string    `json:"siteCode"`
	CustomerName     string    `json:"customerName"`
	CustomerType     string    `json:"customerType"`
	ContractorName   string    `json:"contractorName"`
	DecisionMaker    string    `json:"decisionMaker"`
	Phone            string    `json:"phone"`
	Latitude         *float64  `json:"lat"`
	Longitude        *float64  `json:"lng"`
	Address          string    `json:"address"`
	Amphoe           string    `json:"amphoe"`
	Tambon           string    `json:"tambon"`
	Stage            string    `json:"stage"`
	Status           string    `json:"status"`
	LostReason       string    `json:"lostReason"`
	Competitor       string    `json:"competitor"`
	ExpectedOrderDate *string  `json:"expectedOrderDate"`
	NextFollowUpDate  *string  `json:"nextFollowUpDate"`
	OwnerName        string    `json:"ownerName"`
	OwnerID          string    `json:"ownerId"`
	CanEdit          bool      `json:"canEdit"`
	MapsURL          string    `json:"mapsUrl"`
	CreatedAt        time.Time `json:"createdAt"`
	Reports          []ReportBrief `json:"reports"`
	Photos           []PhotoBrief  `json:"photos"`
}

type ReportBrief struct {
	ID          string    `json:"id"`
	ReportType  string    `json:"reportType"`
	Note        string    `json:"note"`
	Stage       string    `json:"stage"`
	Status      string    `json:"status"`
	RepName     string    `json:"repName"`
	ReportDate  time.Time `json:"reportDate"`
	Photos      []PhotoBrief `json:"photos"`
}

type PhotoBrief struct {
	ID       string `json:"id"`
	ThumbURL string `json:"thumbUrl"`
	FullURL  string `json:"fullUrl"`
}

// Duplicate check
type DuplicateCheckResponse struct {
	HasDuplicate bool              `json:"hasDuplicate"`
	Matches      []DuplicateMatch  `json:"matches"`
}

type DuplicateMatch struct {
	SiteCode     string `json:"siteCode"`
	CustomerName string `json:"customerName"`
	Phone        string `json:"phone"`
	Reason       string `json:"reason"` // phone, nearby
	DistanceM    *int   `json:"distanceM,omitempty"`
	OwnerName    string `json:"ownerName"`
	Status       string `json:"status"`
	IsMine       bool   `json:"isMine"`
}

// Update site (admin)
type UpdateSiteRequest struct {
	CustomerName    *string `json:"customerName"`
	CustomerType    *string `json:"customerType"`
	ContractorName  *string `json:"contractorName"`
	DecisionMaker   *string `json:"decisionMaker"`
	Phone           *string `json:"phone"`
	Address         *string `json:"address"`
	Amphoe          *string `json:"amphoe"`
	Stage           *string `json:"stage"`
	Status          *string `json:"status"`
	LostReason      *string `json:"lostReason"`
	Competitor      *string `json:"competitor"`
}
