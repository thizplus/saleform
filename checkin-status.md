# Daily Check-in — สถานะ + สิ่งที่ต้องทำเพิ่ม

## สิ่งที่ทำเสร็จแล้ว

### Backend API (ครบ)
| Method | Route | สถานะ | รายละเอียด |
|--------|-------|-------|-----------|
| `POST` | `/liff/check-in` | DONE | เช็คอิน: ทะเบียน + ไมล์ + เซลฟี่, ป้องกันซ้ำ, คำนวณ dailyKM |
| `GET` | `/liff/check-in/status` | DONE | เช็ควันนี้เช็คอินแล้วหรือยัง + ทะเบียน/ไมล์ล่าสุด (pre-fill) |
| `GET` | `/admin/check-ins?date=` | DONE | Admin ดู log ตามวัน |

### LIFF Frontend (ครบ)
| ส่วน | สถานะ | รายละเอียด |
|------|-------|-----------|
| CheckInPage | DONE | Form: ทะเบียน (pre-fill), ไมล์, ถ่ายเซลฟี่ |
| Check-in gate | DONE | บังคับเช็คอินก่อนเข้าหน้าหลัก (App.tsx) |
| Auto-skip | DONE | ถ้าเช็คอินวันนี้แล้ว → ข้ามไปเลย |

### Database
| Table | สถานะ |
|-------|-------|
| `daily_check_ins` | DONE (AutoMigrate) |

---

## สิ่งที่ต้องทำเพิ่ม

### 1. Admin — หน้าดู Check-in Log

**ไฟล์ที่ต้องสร้าง/แก้ (Admin frontend):**
- `_admin/src/features/checkins/` — feature folder ใหม่
  - `pages/CheckInsPage.tsx` — หน้าหลัก
  - `service.ts` — API calls
  - `hooks.ts` — React Query hooks
  - `index.ts` — barrel export
- `_admin/src/constants/api-routes.ts` — เพิ่ม CHECK_INS route
- `_admin/src/routes/AppRoutes.tsx` — เพิ่ม route `/check-ins`
- `_admin/src/components/layout/AppSidebar.tsx` — เพิ่ม menu item

**UI ที่ต้องแสดง:**
- Date picker เลือกวัน (default วันนี้)
- ตารางแสดง: รูป sale, ชื่อ, ทะเบียน, ไมล์, ระยะทาง (km), เวลาเช็คอิน, รูปเซลฟี่
- สรุปจำนวน: เช็คอินแล้ว X / ทั้งหมด Y คน
- แสดงเซลล์ที่ยังไม่เช็คอิน (เทียบกับ active reps)

### 2. Backend — Summary API (ระยะทางรวม)

**API ใหม่ที่ต้องเพิ่ม:**

| Method | Route | รายละเอียด |
|--------|-------|-----------|
| `GET` | `/admin/check-ins/summary?repId=&period=month` | สรุประยะทางรวมของ sale คนนี้ |
| `GET` | `/admin/check-ins/summary/team?period=month` | สรุประยะทางรวมทั้งทีม |

**Response ที่ต้องส่ง:**
```json
{
  "repId": "xxx",
  "repName": "บอม",
  "period": "2026-10",
  "totalKM": 1250,
  "checkInDays": 22,
  "workingDays": 24,
  "avgKMPerDay": 56.8,
  "entries": [
    { "date": "2026-10-20", "mileage": 50123, "dailyKm": 85, "licensePlate": "กข 1234" },
    { "date": "2026-10-19", "mileage": 50038, "dailyKm": 62, "licensePlate": "กข 1234" }
  ]
}
```

**สิ่งที่ต้องทำ:**
- เพิ่ม `SummaryByRep` ใน CheckInRepository
- เพิ่ม `Summary` / `TeamSummary` ใน CheckInService
- เพิ่ม handler + route

**Period รองรับ:**
- `day` — วันนี้
- `week` — สัปดาห์นี้
- `month` — เดือนนี้ (default)
- `year` — ปีนี้
- custom: `from=2026-10-01&to=2026-10-31`

### 3. Admin — หน้า Summary ระยะทาง

**อาจรวมอยู่ในหน้า Check-in Log หรือแยกเป็น tab:**

**Tab 1: Log วันนี้**
- ตารางเช็คอินรายวัน (ที่มีอยู่แล้ว)

**Tab 2: สรุประยะทาง**
- เลือกช่วงเวลา: สัปดาห์ / เดือน / ปี
- ตาราง: ชื่อ sale, จำนวนวันเช็คอิน, ระยะทางรวม (km), เฉลี่ยต่อวัน
- เรียงตามระยะทาง (มากไปน้อย)
- กดชื่อ → ดูรายละเอียดแต่ละวัน

### 4. LIFF — ดูสถิติเช็คอินตัวเอง (optional)

- เพิ่มในหน้า "ผลงานของฉัน" (MyStats)
- แสดง: เช็คอินแล้ว X วัน, ระยะทางรวม Y km, เฉลี่ย Z km/วัน

---

## ลำดับการทำ

| ลำดับ | งาน | ขอบเขต |
|-------|-----|--------|
| 1 | Backend: Summary API | เพิ่ม repo + service + handler + route |
| 2 | Admin: หน้า Check-in Log + Summary | feature folder + 2 tabs |
| 3 | Admin: Sidebar menu | เพิ่ม "เช็คอิน" ใน sidebar |
| 4 | LIFF: สถิติเช็คอินตัวเอง (optional) | เพิ่มใน MyStats |
