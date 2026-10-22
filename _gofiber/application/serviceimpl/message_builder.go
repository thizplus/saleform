package serviceimpl

import (
	"fmt"
	"strings"
	"time"

	"line-sales-api/domain/models"
)

// BuildNewSiteMessages สร้างข้อความ+Flex รูป+ตำแหน่งสำหรับงานใหม่
// ส่งผ่าน liff.sendMessages() (ฟรี ไม่เสียโควต้า)
func BuildNewSiteMessages(site *models.Site, report *models.SiteReport, repName string, contacts []models.Contact, photoURLs []string, liffID string) []map[string]any {
	var messages []map[string]any

	// 1. ข้อความหลัก
	var lines []string
	lines = append(lines, fmt.Sprintf("📋 งานใหม่ #%s", site.SiteCode))
	lines = append(lines, fmt.Sprintf("👤 %s", repName))
	lines = append(lines, "─────────────")

	if site.CustomerName != "" {
		lines = append(lines, fmt.Sprintf("🏠 ชื่องาน: %s", site.CustomerName))
	}
	if site.Stage != "" && site.Stage != "new" {
		lines = append(lines, fmt.Sprintf("📐 สถานะงาน: %s", site.Stage))
	}

	// ตัวเลือกงาน
	if report.JobType != "" {
		jobText := report.JobType
		if report.JobType == "อื่นๆ" && report.JobTypeOther != "" {
			jobText = report.JobTypeOther
		}
		lines = append(lines, fmt.Sprintf("🔧 ตัวเลือกงานอื่นๆ: %s", jobText))
	}

	// ผู้ติดต่อ
	if len(contacts) > 0 {
		lines = append(lines, "")
		for _, c := range contacts {
			contactLine := "👥 "
			if c.Name != "" {
				contactLine += c.Name
			}
			if c.Role != "" {
				contactLine += fmt.Sprintf(" (%s)", c.Role)
			}
			if c.Phone != "" {
				contactLine += fmt.Sprintf(" %s", formatPhone(c.Phone))
			}
			lines = append(lines, contactLine)
			// แสดงประเภท + สิทธิ์
			var tags []string
			if c.ContactType != "" {
				tags = append(tags, c.ContactType)
			}
			if c.Authority != "" {
				tags = append(tags, c.Authority)
			}
			if len(tags) > 0 {
				lines = append(lines, fmt.Sprintf("   %s", strings.Join(tags, " · ")))
			}
		}
	}

	if report.Note != "" {
		lines = append(lines, "")
		lines = append(lines, fmt.Sprintf("🛒 สินค้าที่สนใจ: %s", report.Note))
	}

	if report.JobDetail != "" {
		lines = append(lines, fmt.Sprintf("📝 รายละเอียดหน้างาน: %s", report.JobDetail))
	}

	if site.NextFollowUpDate != nil {
		lines = append(lines, "")
		lines = append(lines, fmt.Sprintf("📅 นัดติดตาม: %s", formatThaiDateShort(site.NextFollowUpDate)))
	}

	addr := composeAddress(site.Tambon, site.Amphoe, site.Province)
	if addr != "" {
		lines = append(lines, fmt.Sprintf("📍 %s", addr))
	}

	messages = append(messages, map[string]any{
		"type": "text",
		"text": strings.Join(lines, "\n"),
	})

	// 2. Flex carousel รูปภาพ (สูงสุด 12 รูปต่อ 1 ข้อความ)
	if len(photoURLs) > 0 {
		messages = append(messages, buildImageFlexCarousel(site.SiteCode, photoURLs, liffID))
	}

	// 3. ตำแหน่ง (ถ้ามี GPS)
	if site.Latitude != nil && site.Longitude != nil {
		title := fmt.Sprintf("#%s %s", site.SiteCode, site.CustomerName)
		if len(title) > 100 {
			title = title[:100]
		}
		locAddr := composeAddress(site.Tambon, site.Amphoe, site.Province)
		if locAddr == "" {
			locAddr = fmt.Sprintf("%.5f, %.5f", *site.Latitude, *site.Longitude)
		}
		messages = append(messages, map[string]any{
			"type":      "location",
			"title":     title,
			"address":   locAddr,
			"latitude":  *site.Latitude,
			"longitude": *site.Longitude,
		})
	}

	return messages
}

// BuildFollowUpMessages สร้างข้อความ+Flex รูปสำหรับอัปเดตงาน
func BuildFollowUpMessages(site *models.Site, report *models.SiteReport, repName string, contacts []models.Contact, photoURLs []string, liffID string) []map[string]any {
	var messages []map[string]any

	statusEmoji := "🔄"
	statusText := "ติดตาม"
	switch report.Status {
	case "won":
		statusEmoji = "✅"
		statusText = "จบได้"
	case "lost":
		statusEmoji = "❌"
		statusText = "จบที่อื่น"
	case "cancelled":
		statusEmoji = "🚫"
		statusText = "ยกเลิก"
	}

	var lines []string
	lines = append(lines, fmt.Sprintf("%s %s #%s", statusEmoji, statusText, site.SiteCode))
	lines = append(lines, fmt.Sprintf("👤 %s", repName))
	lines = append(lines, "─────────────")

	if site.CustomerName != "" {
		lines = append(lines, fmt.Sprintf("🏠 ชื่องาน: %s", site.CustomerName))
	}

	if report.Note != "" {
		lines = append(lines, "")
		lines = append(lines, report.Note)
	}

	if report.Status == "lost" {
		if report.LostReason != "" {
			lines = append(lines, fmt.Sprintf("💬 สาเหตุ: %s", report.LostReason))
		}
		if report.Competitor != "" {
			lines = append(lines, fmt.Sprintf("🏪 ร้านที่ได้: %s", report.Competitor))
		}
	}

	if report.Stage != "" {
		lines = append(lines, fmt.Sprintf("📐 สถานะงาน: %s", report.Stage))
	}

	if site.NextFollowUpDate != nil && report.Status == "following" {
		lines = append(lines, "")
		lines = append(lines, fmt.Sprintf("📅 นัดติดตาม: %s", formatThaiDateShort(site.NextFollowUpDate)))
	}

	messages = append(messages, map[string]any{
		"type": "text",
		"text": strings.Join(lines, "\n"),
	})

	// Flex carousel รูปภาพ
	if len(photoURLs) > 0 {
		messages = append(messages, buildImageFlexCarousel(site.SiteCode, photoURLs, liffID))
	}

	return messages
}

// buildImageFlexCarousel สร้าง Flex carousel แสดงรูปภาพ — แตะเปิดหน้ารายละเอียดงาน
func buildImageFlexCarousel(siteCode string, photoURLs []string, liffID string) map[string]any {
	detailURL := fmt.Sprintf("https://liff.line.me/%s/sites/%s", liffID, siteCode)

	// จำกัด 12 รูปต่อ carousel (LINE limit)
	urls := photoURLs
	if len(urls) > 12 {
		urls = urls[:12]
	}

	var bubbles []map[string]any
	for _, url := range urls {
		bubbles = append(bubbles, map[string]any{
			"type": "bubble",
			"size": "micro",
			"hero": map[string]any{
				"type":       "image",
				"url":        url,
				"size":       "full",
				"aspectRatio": "1:1",
				"aspectMode": "cover",
				"action": map[string]any{
					"type": "uri",
					"uri":  detailURL,
				},
			},
		})
	}

	// ถ้ามีรูปเดียว ส่งเป็น bubble เดี่ยว ไม่ต้อง carousel
	var contents map[string]any
	if len(bubbles) == 1 {
		contents = bubbles[0]
	} else {
		contents = map[string]any{
			"type":     "carousel",
			"contents": bubbles,
		}
	}

	return map[string]any{
		"type":    "flex",
		"altText": fmt.Sprintf("รูปภาพ #%s (%d รูป)", siteCode, len(urls)),
		"contents": contents,
	}
}

// BuildCheckInMessages สร้างข้อความเช็คอินส่งเข้ากลุ่ม LINE
func BuildCheckInMessages(repName, licensePlate string, mileage int, dailyKM *int, selfieURL string) []map[string]any {
	var messages []map[string]any

	var lines []string
	lines = append(lines, "📍 เช็คอิน")
	lines = append(lines, fmt.Sprintf("👤 %s", repName))
	lines = append(lines, "─────────────")
	lines = append(lines, fmt.Sprintf("🚗 ทะเบียน: %s", licensePlate))
	lines = append(lines, fmt.Sprintf("🔢 ไมล์: %s", formatNumber(mileage)))
	if dailyKM != nil {
		lines = append(lines, fmt.Sprintf("📏 วิ่งวันนี้: %s กม.", formatNumber(*dailyKM)))
	}

	messages = append(messages, map[string]any{
		"type": "text",
		"text": strings.Join(lines, "\n"),
	})

	// รูปเซลฟี่
	if selfieURL != "" {
		messages = append(messages, map[string]any{
			"type":               "image",
			"originalContentUrl": selfieURL,
			"previewImageUrl":    selfieURL,
		})
	}

	return messages
}

func formatNumber(n int) string {
	s := fmt.Sprintf("%d", n)
	if len(s) <= 3 {
		return s
	}
	var result []byte
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			result = append(result, ',')
		}
		result = append(result, byte(c))
	}
	return string(result)
}

// composeAddress สร้างที่อยู่จาก tambon/amphoe/province
func composeAddress(tambon, amphoe, province string) string {
	var parts []string
	if tambon != "" {
		parts = append(parts, "ต."+tambon)
	}
	if amphoe != "" {
		parts = append(parts, "อ."+amphoe)
	}
	if province != "" {
		parts = append(parts, "จ."+province)
	}
	return strings.Join(parts, " ")
}

// BuildEveningSummaryMessages สร้างข้อความสรุปงานประจำวันส่งเข้ากลุ่ม LINE
func BuildEveningSummaryMessages(repName, licensePlate string, morningMileage, eveningMileage int, dailyKM *int, callCount, billCount, oldAmount, newAmount int) []map[string]any {
	var messages []map[string]any

	var lines []string
	lines = append(lines, "📊 สรุปงานประจำวัน")
	lines = append(lines, fmt.Sprintf("👤 %s", repName))
	lines = append(lines, "─────────────")
	lines = append(lines, fmt.Sprintf("🚗 ทะเบียน: %s", licensePlate))
	lines = append(lines, fmt.Sprintf("🔢 ไมล์เช้า: %s", formatNumber(morningMileage)))
	lines = append(lines, fmt.Sprintf("🔢 ไมล์เย็น: %s", formatNumber(eveningMileage)))
	if dailyKM != nil {
		lines = append(lines, fmt.Sprintf("📏 ระยะทางวันนี้: %s กม.", formatNumber(*dailyKM)))
	}
	lines = append(lines, "─────────────")
	lines = append(lines, fmt.Sprintf("📞 โทรติดตาม: %d ราย", callCount))
	lines = append(lines, fmt.Sprintf("🧾 เปิดบิล: %d บิล", billCount))
	if oldAmount > 0 {
		lines = append(lines, fmt.Sprintf("💰 ยอด ลค.เก่า: %s บาท", formatNumber(oldAmount)))
	}
	if newAmount > 0 {
		lines = append(lines, fmt.Sprintf("💰 ยอด ลค.ใหม่: %s บาท", formatNumber(newAmount)))
	}
	totalAmount := oldAmount + newAmount
	if totalAmount > 0 {
		lines = append(lines, fmt.Sprintf("💵 ยอดรวม: %s บาท", formatNumber(totalAmount)))
	}

	messages = append(messages, map[string]any{
		"type": "text",
		"text": strings.Join(lines, "\n"),
	})

	return messages
}

// formatThaiDateShort formats as DD/MM/YYYY+543 (Buddhist year)
func formatThaiDateShort(t *time.Time) string {
	if t == nil {
		return ""
	}
	buddhistYear := t.Year() + 543
	return fmt.Sprintf("%02d/%02d/%d", t.Day(), t.Month(), buddhistYear)
}
