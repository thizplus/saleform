package dto

import "time"

// Create Site (new report)
type CreateSiteRequest struct {
	Phone            string   `json:"phone"`
	CustomerName     string   `json:"customerName"`
	CustomerType     string   `json:"customerType"`
	ContractorName   string   `json:"contractorName"`
	Stage            string   `json:"stage"`
	Detail           string   `json:"detail"`           // สินค้าที่สนใจ
	JobType          string   `json:"jobType"`           // ตัวเลือกงาน
	JobTypeOther     string   `json:"jobTypeOther"`      // อื่นๆ (free text)
	JobDetail        string   `json:"jobDetail"`         // รายละเอียดหน้างาน
	Latitude         *float64 `json:"lat"`
	Longitude        *float64 `json:"lng"`
	Tambon           string   `json:"tambon"`
	Amphoe           string   `json:"amphoe"`
	Province         string   `json:"province"`
	Postcode         string   `json:"postcode"`
	ExpectedOrderDate *string `json:"expectedOrderDate"` // YYYY-MM-DD
	NextFollowUpDate  *string `json:"nextFollowUpDate"`  // YYYY-MM-DD
	PhotoIDs         []string       `json:"photoIds"`
	Contacts         []ContactInput `json:"contacts"` // ผู้ติดต่อหลายคน
	ForceNew         bool           `json:"forceNew"` // skip duplicate check
	GroupID          string         `json:"groupId"`  // LINE group ID for push message
	IdempotencyKey   string         `json:"-"`        // จาก header, ไม่รับจาก body
}

type CreateSiteResponse struct {
	Site         SiteBrief        `json:"site"`
	Report       ReportBrief      `json:"report"`
	MessageSent  bool             `json:"messageSent"`  // backend push สำเร็จหรือไม่
	ChatMessages []map[string]any `json:"chatMessages"` // fallback สำหรับ liff.sendMessages()
}

// Follow-up
type CreateFollowUpRequest struct {
	Note             string   `json:"note" validate:"required"`
	Status           string   `json:"status" validate:"required,oneof=following won lost cancelled"`
	NextFollowUpDate *string  `json:"nextFollowUpDate"` // required if status=following
	LostReason       string   `json:"lostReason"`       // required if status=lost
	Competitor       string   `json:"competitor"`
	Stage            string   `json:"stage"`
	PhotoIDs         []string `json:"photoIds"`
	GroupID          string   `json:"groupId"`
	NewPhone         string         `json:"newPhone"` // backward compat
	Contacts         []ContactInput `json:"contacts,omitempty"` // ถ้าส่งมา = replace contacts ทั้งหมด
}

type CreateFollowUpResponse struct {
	Site         SiteBrief        `json:"site"`
	Report       ReportBrief      `json:"report"`
	MessageSent  bool             `json:"messageSent"`
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
	SiteCode         string     `json:"siteCode"`
	CustomerName     string     `json:"customerName"`
	CustomerType     string     `json:"customerType"`
	ContractorName   string     `json:"contractorName"`
	Phone            string     `json:"phone"`
	Status           string     `json:"status"`
	Stage            string     `json:"stage"`
	Amphoe           string     `json:"amphoe"`
	Tambon           string     `json:"tambon"`
	Province         string     `json:"province"`
	Postcode         string     `json:"postcode"`
	NextFollowUpDate *string    `json:"nextFollowUpDate"`
	LastReportAt     *time.Time `json:"lastReportAt"`
	ThumbURL         string     `json:"thumbUrl"`
	IsMine           bool       `json:"isMine"`
	OwnerName        string     `json:"ownerName"`
	ReportCount      int        `json:"reportCount"`
	CreatedAt        time.Time  `json:"createdAt"`
	ClosedAt         *time.Time `json:"closedAt,omitempty"`
}

// Site detail
type SiteDetailResponse struct {
	SiteCode         string    `json:"siteCode"`
	CustomerName     string    `json:"customerName"`
	CustomerType     string    `json:"customerType"`
	ContractorName   string    `json:"contractorName"`
	Phone            string    `json:"phone"`
	Latitude         *float64  `json:"lat"`
	Longitude        *float64  `json:"lng"`
	Tambon           string    `json:"tambon"`
	Amphoe           string    `json:"amphoe"`
	Province         string    `json:"province"`
	Postcode         string    `json:"postcode"`
	Stage            string    `json:"stage"`
	Status           string    `json:"status"`
	LostReason       string    `json:"lostReason"`
	Competitor       string    `json:"competitor"`
	ExpectedOrderDate *string  `json:"expectedOrderDate"`
	NextFollowUpDate  *string  `json:"nextFollowUpDate"`
	OwnerName        string     `json:"ownerName"`
	OwnerID          string     `json:"ownerId"`
	CanEdit          bool       `json:"canEdit"`
	MapsURL          string     `json:"mapsUrl"`
	CreatedAt        time.Time  `json:"createdAt"`
	ClosedAt         *time.Time `json:"closedAt,omitempty"`
	Reports          []ReportBrief  `json:"reports"`
	Photos           []PhotoBrief   `json:"photos"`
	Contacts         []ContactBrief `json:"contacts"`
}

type ReportBrief struct {
	ID           string    `json:"id"`
	ReportType   string    `json:"reportType"`
	Note         string    `json:"note"`          // สินค้าที่สนใจ
	JobType      string    `json:"jobType"`       // ตัวเลือกงาน
	JobTypeOther string    `json:"jobTypeOther"`  // อื่นๆ
	JobDetail    string    `json:"jobDetail"`     // รายละเอียดหน้างาน
	Stage        string    `json:"stage"`
	Status       string    `json:"status"`
	RepName      string    `json:"repName"`
	ReportDate   time.Time `json:"reportDate"`
	Photos       []PhotoBrief `json:"photos"`
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

// My Stats (L10)
type MyStatsResponse struct {
	Running         int           `json:"running"`         // COUNT(site_reports) ในช่วงเวลา
	NewJobs         int           `json:"newJobs"`         // reports WHERE kind='new'
	Completed       int           `json:"completed"`       // won + lost (งานจบทั้งหมด)
	CloseRate       float64       `json:"closeRate"`       // won / (won+lost) * 100
	TeamCloseRate   *float64      `json:"teamCloseRate"`   // สูตรเดียวกันทั้งทีม
	TeamAvgRunning  *float64      `json:"teamAvgRunning"`  // ค่าเฉลี่ยทีม วิ่งงาน
	TeamAvgNewJobs  *float64      `json:"teamAvgNewJobs"`  // ค่าเฉลี่ยทีม งานใหม่
	Outcomes        StatsOutcomes `json:"outcomes"`
	OnTimeRate      *float64      `json:"onTimeRate"`
	Overdue         int           `json:"overdue"`         // sites following & next_follow_up < today
}

type StatsOutcomes struct {
	Won       int `json:"won"`
	Following int `json:"following"`
	Lost      int `json:"lost"`
}

// Contact DTO
type ContactInput struct {
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	ContactType string `json:"contactType"` // ผู้มุ่งหวังใหม่, ลูกค้าเก่า, ไม่แน่ใจ
	Authority   string `json:"authority"`   // มีอำนาจตัดสินใจ, ไม่มีอำนาจ, ไม่แน่ใจ
	Role        string `json:"role"`        // เจ้าของ, ช่าง, ไม่แน่ใจ
}

type ContactBrief struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	ContactType string `json:"contactType"`
	Authority   string `json:"authority"`
	Role        string `json:"role"`
	IsPrimary   bool   `json:"isPrimary"`
}

// Update site (admin)
type UpdateSiteRequest struct {
	CustomerName    *string `json:"customerName"`
	CustomerType    *string `json:"customerType"`
	ContractorName  *string `json:"contractorName"`
	Phone           *string `json:"phone"`
	Amphoe          *string `json:"amphoe"`
	Stage           *string `json:"stage"`
	Status          *string `json:"status"`
	LostReason      *string        `json:"lostReason"`
	Competitor      *string        `json:"competitor"`
	Contacts        []ContactInput `json:"contacts,omitempty"` // ถ้าส่งมา = replace ทั้งหมด
}
