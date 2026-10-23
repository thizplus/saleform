# Daily Summary Push Message

## สิ่งที่ต้องทำ
- ทุกวัน ส่ง push message สรุปข้อมูลการทำงานรวมทุก sale เข้ากลุ่ม LINE
- Admin ตั้งเวลาส่งได้ (เช่น 18:00)
- ข้อมูลสรุปประจำวัน + สรุปเดือน (MTD)

## ข้อมูลที่ส่ง (ต่อวัน รวมทุก sale)

| หัวข้อ | แหล่งข้อมูล |
|---|---|
| การวิ่งงาน (ใหม่/ตาม/รวม) | COUNT site_reports by report_type |
| โทรหาลูกค้า | SUM daily_check_ins.call_count |
| จบงาน (ลค.เก่า/ใหม่) | COUNT site_reports WHERE close_status='success' GROUP BY customer_type |
| ยอดเงิน (ลค.เก่า/ใหม่/รวม) | SUM close_amount GROUP BY customer_type |
| % close rate | จบงาน / วิ่งงานรวม × 100 |
| บิลที่เปิด | SUM daily_check_ins.bill_count |

## รูปแบบ LINE Message

```
📊 สรุปประจำวัน 24/10/2569

📋 วิ่งงาน: 5 (ใหม่ 3 / ตาม 2)
📞 โทรลูกค้า: 8 ราย
✅ จบงาน: 2 (เก่า 1 / ใหม่ 1)
💰 ยอด: 25,000 บาท (เก่า 15,000 / ใหม่ 10,000)
📊 Close rate: 40.00%
🧾 บิล: 3

─────────────
📈 เดือน ต.ค. (MTD)
วิ่ง 65 | จบ 49 | ยอด 324,781 บาท
Close rate: 31.68% | บิล 45
```

## Implementation

### 1. Add cron library
- `go get github.com/robfig/cron/v3`

### 2. Scheduler (pkg/scheduler/)
- Start cron in main.go after DI container init
- Read schedule from app_configs (key: "daily_summary_config")
- Config: { "enabled": true, "time": "18:00", "groupId": "Cxxxx" }

### 3. Daily Summary Service
- `DailySummaryService.GetDailySummary(ctx, date)` → DailySummaryData
- `DailySummaryService.GetMonthSummary(ctx, year, month)` → MonthlySummaryData
- Query site_reports + daily_check_ins

### 4. Message Builder
- `BuildDailySummaryMessage(daily, monthly)` → []map[string]any

### 5. Admin API
- `GET /admin/daily-summary-config` → config
- `PUT /admin/daily-summary-config` → update config
- `POST /admin/daily-summary-config/test` → ส่งทดสอบทันที

### 6. Admin UI
- Settings page: เปิด/ปิด, เลือกเวลา, เลือกกลุ่ม LINE

## Files

### New
- `pkg/scheduler/scheduler.go` — cron scheduler
- `application/serviceimpl/daily_summary_service.go` — data aggregation + message
- `interfaces/api/handlers/admin_daily_summary.go` — admin API

### Modified
- `cmd/api/main.go` — start scheduler
- `pkg/di/container.go` — wire daily summary service
- `interfaces/api/routes/routes.go` — add admin routes
