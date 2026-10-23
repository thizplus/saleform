# RCM Phase 2 — ปิดงาน + ปรับ Form

## สรุป 4 เรื่องที่ลูกค้าขอ

1. **นัดติดตาม → เพิ่ม "ไม่ติดตาม"** (งานจบแล้ว)
2. **เพิ่ม section "ปิดงาน"** — toggle แยกในฟอร์ม
   - สำเร็จ → ใส่ยอดเปิดบิล
   - ไม่สำเร็จ → เลือกเหตุผล 7 ข้อ (+ อื่นๆ free text)
3. **คาดว่าจะสั่งของ → เพิ่ม "สั่งเลย"**
4. **สรุปงานประจำวัน → ไม่ส่ง LINE message**

## Conditional Field Logic

| Field | ปกติ | ปิดงาน-สำเร็จ | ปิดงาน-ไม่สำเร็จ |
|---|---|---|---|
| รูป/GPS/ผู้ติดต่อ | แสดง | แสดง | แสดง |
| สถานะงาน (stage) | แสดง | ซ่อน | ซ่อน |
| ตัวเลือกงาน (jobType) | แสดง | แสดง | ซ่อน |
| สินค้าที่สนใจ | แสดง | แสดง | ซ่อน |
| รายละเอียดหน้างาน | แสดง | แสดง | แสดง |
| คาดว่าจะสั่งของ | แสดง | auto "สั่งเลย" | ซ่อน |
| นัดติดตาม | แสดง | auto "ไม่ติดตาม" | auto "ไม่ติดตาม" |
| ยอดเปิดบิล | - | แสดง (required) | - |
| เหตุผลไม่สำเร็จ | - | - | แสดง (required) |

## Implementation

### Backend — Model
```
SiteReport + CloseStatus (success/failed/"")
           + CloseAmount (int64, บาท)
           + CloseReason (string)
           + CloseReasonOther (string)
```
เมื่อปิดงาน: Site.Status → "won"/"lost", Site.ClosedAt → now

### Backend — Evening Summary
- ลบ ChatMessages จาก response + ลบ BuildEveningSummaryMessages call
- LIFF: ลบ sendChatMessages, เปลี่ยนปุ่มเป็น "บันทึก"

### Options
- เพิ่ม `closeReasons` ใน Options (admin จัดการได้)
- Default: 6 เหตุผล + "อื่นๆ"

### LIFF — FollowUpDateChips
- เพิ่ม chip "ไม่ติดตาม" → value = "none"

### LIFF — NewReportPage
- เพิ่ม toggle "ปิดงาน" → สำเร็จ/ไม่สำเร็จ
- Conditional hide/show fields ตามตาราง
- "สั่งเลย" ใน expectedOrder chips

## Files to Change

### Backend
- `_gofiber/domain/models/site_report.go`
- `_gofiber/domain/dto/site.go`
- `_gofiber/domain/dto/options.go`
- `_gofiber/domain/dto/checkin.go`
- `_gofiber/application/serviceimpl/site_service.go`
- `_gofiber/application/serviceimpl/message_builder.go`
- `_gofiber/application/serviceimpl/checkin_service.go`

### LIFF
- `_liff/src/features/report-new/types.ts`
- `_liff/src/features/report-new/service.ts`
- `_liff/src/features/report-new/components/FollowUpDateChips.tsx`
- `_liff/src/features/report-new/pages/NewReportPage.tsx`
- `_liff/src/features/checkin/EveningSummaryPage.tsx`
