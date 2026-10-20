package handlers

import (
	"fmt"
	"time"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/services"
	"line-sales-api/pkg/logger"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

type AdminExportHandler struct {
	siteService services.SiteService
}

func NewAdminExportHandler(ss services.SiteService) *AdminExportHandler {
	return &AdminExportHandler{siteService: ss}
}

func (h *AdminExportHandler) ExportSites(c *fiber.Ctx) error {
	ctx := c.UserContext()

	resp, err := h.siteService.List(ctx, nil, &dto.SiteListFilter{
		Page:  1,
		Limit: 10000,
	})
	if err != nil {
		logger.ErrorContext(ctx, "Export failed", "error", err)
		return fiber.NewError(500, "Export failed")
	}

	f := excelize.NewFile()
	sheet := "รายงาน"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{
		"รหัส", "วันที่สร้าง", "ลูกค้า", "โทร", "เซลล์",
		"ประเภท", "อำเภอ", "ผู้ตัดสินใจ", "ขั้นตอน", "สถานะ",
		"นัดติดตาม", "รายงาน",
	}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"F5F5F5"}},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	f.SetRowStyle(sheet, 1, 1, headerStyle)

	statusLabels := map[string]string{
		"following": "กำลังติดตาม",
		"won":       "จบได้",
		"lost":      "จบที่อื่น",
		"cancelled": "ยกเลิก",
	}

	for i, site := range resp.Sites {
		row := i + 2
		f.SetCellValue(sheet, cell(1, row), site.SiteCode)
		f.SetCellValue(sheet, cell(2, row), site.CreatedAt.Format("02/01/2006"))
		f.SetCellValue(sheet, cell(3, row), site.CustomerName)
		f.SetCellValue(sheet, cell(4, row), site.Phone)
		f.SetCellValue(sheet, cell(5, row), site.OwnerName)
		f.SetCellValue(sheet, cell(6, row), site.CustomerType)
		f.SetCellValue(sheet, cell(7, row), site.Amphoe)
		f.SetCellValue(sheet, cell(8, row), "")
		f.SetCellValue(sheet, cell(9, row), site.Stage)
		label := statusLabels[site.Status]
		if label == "" {
			label = site.Status
		}
		f.SetCellValue(sheet, cell(10, row), label)
		if site.NextFollowUpDate != nil {
			f.SetCellValue(sheet, cell(11, row), *site.NextFollowUpDate)
		}
		f.SetCellValue(sheet, cell(12, row), site.ReportCount)
	}

	for i := range headers {
		col, _ := excelize.ColumnNumberToName(i + 1)
		f.SetColWidth(sheet, col, col, 15)
	}

	now := time.Now()
	filename := fmt.Sprintf("sites_%s.xlsx", now.Format("20060102_150405"))
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	return f.Write(c)
}

func cell(col, row int) string {
	name, _ := excelize.CoordinatesToCellName(col, row)
	return name
}
