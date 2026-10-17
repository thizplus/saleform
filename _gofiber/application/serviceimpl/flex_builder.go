package serviceimpl

import (
	"fmt"

	"line-sales-api/domain/models"
)

// BuildNewSiteFlexMessage creates a Flex Message for a new site report
func BuildNewSiteFlexMessage(site *models.Site, report *models.SiteReport, repName string) map[string]any {
	statusColor := "#1DB446" // green for new

	bodyContents := []map[string]any{
		{
			"type":   "text",
			"text":   fmt.Sprintf("ลูกค้า: %s", site.CustomerName),
			"size":   "sm",
			"wrap":   true,
		},
	}

	if site.Phone != "" {
		bodyContents = append(bodyContents, map[string]any{
			"type":   "text",
			"text":   fmt.Sprintf("โทร: %s", formatPhone(site.Phone)),
			"size":   "sm",
			"margin": "sm",
		})
	}

	if site.ContractorName != "" {
		bodyContents = append(bodyContents, map[string]any{
			"type":   "text",
			"text":   fmt.Sprintf("ผู้รับเหมา: %s", site.ContractorName),
			"size":   "sm",
			"margin": "sm",
		})
	}

	if report.Note != "" {
		bodyContents = append(bodyContents, map[string]any{
			"type":   "text",
			"text":   report.Note,
			"size":   "sm",
			"margin": "md",
			"wrap":   true,
			"color":  "#555555",
		})
	}

	if site.NextFollowUpDate != nil {
		bodyContents = append(bodyContents, map[string]any{
			"type":   "text",
			"text":   fmt.Sprintf("นัดติดตาม: %s", site.NextFollowUpDate.Format("02/01/2006")),
			"size":   "xs",
			"margin": "md",
			"color":  "#aaaaaa",
		})
	}

	return map[string]any{
		"type":    "flex",
		"altText": fmt.Sprintf("งานใหม่ #%s %s", site.SiteCode, site.CustomerName),
		"contents": map[string]any{
			"type": "bubble",
			"size": "kilo",
			"header": map[string]any{
				"type":   "box",
				"layout": "vertical",
				"contents": []map[string]any{
					{
						"type":   "text",
						"text":   fmt.Sprintf("งานใหม่ #%s", site.SiteCode),
						"weight": "bold",
						"size":   "lg",
						"color":  statusColor,
					},
					{
						"type":   "text",
						"text":   repName,
						"size":   "xs",
						"color":  "#aaaaaa",
					},
				},
			},
			"body": map[string]any{
				"type":     "box",
				"layout":   "vertical",
				"contents": bodyContents,
			},
			"footer": map[string]any{
				"type":   "box",
				"layout": "vertical",
				"contents": []map[string]any{
					{
						"type":  "text",
						"text":  "ระบบรายงานเซลล์ UP Steel",
						"size":  "xxs",
						"color": "#aaaaaa",
						"align": "center",
					},
				},
			},
		},
	}
}

// BuildFollowUpFlexMessage creates a Flex Message for a follow-up report
func BuildFollowUpFlexMessage(site *models.Site, report *models.SiteReport, repName string) map[string]any {
	statusColor := "#17A2B8" // blue for follow-up
	statusText := "ติดตาม"

	switch report.Status {
	case "won":
		statusColor = "#1DB446"
		statusText = "จบได้"
	case "lost":
		statusColor = "#DC3545"
		statusText = "จบที่อื่น"
	case "cancelled":
		statusColor = "#6C757D"
		statusText = "ยกเลิก"
	}

	bodyContents := []map[string]any{
		{
			"type":   "text",
			"text":   fmt.Sprintf("ลูกค้า: %s", site.CustomerName),
			"size":   "sm",
			"wrap":   true,
		},
		{
			"type":   "text",
			"text":   report.Note,
			"size":   "sm",
			"margin": "md",
			"wrap":   true,
			"color":  "#555555",
		},
	}

	if report.Status == "lost" && report.LostReason != "" {
		bodyContents = append(bodyContents, map[string]any{
			"type":   "text",
			"text":   fmt.Sprintf("สาเหตุ: %s", report.LostReason),
			"size":   "xs",
			"margin": "sm",
			"color":  "#DC3545",
		})
	}

	if site.NextFollowUpDate != nil && report.Status == "following" {
		bodyContents = append(bodyContents, map[string]any{
			"type":   "text",
			"text":   fmt.Sprintf("นัดติดตาม: %s", site.NextFollowUpDate.Format("02/01/2006")),
			"size":   "xs",
			"margin": "md",
			"color":  "#aaaaaa",
		})
	}

	return map[string]any{
		"type":    "flex",
		"altText": fmt.Sprintf("%s #%s %s", statusText, site.SiteCode, site.CustomerName),
		"contents": map[string]any{
			"type": "bubble",
			"size": "kilo",
			"header": map[string]any{
				"type":   "box",
				"layout": "vertical",
				"contents": []map[string]any{
					{
						"type":   "text",
						"text":   fmt.Sprintf("%s #%s", statusText, site.SiteCode),
						"weight": "bold",
						"size":   "lg",
						"color":  statusColor,
					},
					{
						"type":   "text",
						"text":   repName,
						"size":   "xs",
						"color":  "#aaaaaa",
					},
				},
			},
			"body": map[string]any{
				"type":     "box",
				"layout":   "vertical",
				"contents": bodyContents,
			},
		},
	}
}

func formatPhone(phone string) string {
	if len(phone) == 10 {
		return phone[:3] + "-" + phone[3:6] + "-" + phone[6:]
	}
	return phone
}
