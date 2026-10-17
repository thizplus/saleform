# 05 — ลำดับการแก้ที่แนะนำ (Checklist)

## รอบ 1 — ให้ใช้งานบนมือถือได้จริง (ครึ่งวัน–1 วัน)
- [ ] Rotate R2 token, ล้างค่าใน `.env.example`, ลบรหัส admin ออกจาก `SETUP_TUNNEL.md`
- [ ] `git init` + `.gitignore` root
- [ ] Backend: `IdempotencyKey` → `*string`
- [ ] Backend: ลบ unique ของ `Contact.Phone`
- [ ] Backend: `NextCode` ใช้ `RETURNING` และเรียกใน transaction
- [ ] Backend: แก้ role middleware (allow-list) + `WithValidMethods`
- [ ] Backend: เซลล์ใหม่เป็น `pending` + endpoint อนุมัติ (admin) + หน้า "รออนุมัติ" (LIFF)
- [ ] Backend: `recover` middleware, ErrorHandler ไม่คืน `err.Error()`
- [ ] Backend: CORS เพิ่ม `https://liff.puekk.com`, `AllowCredentials:false`
- [ ] LIFF/Admin: `VITE_API_URL=https://lineapi.puekk.com/api/v1`
- [ ] LIFF/Admin: แก้ `tsconfig.app.json` (TS5101) แล้ว `npm run build` ให้ผ่าน
- [ ] รูป: สร้าง thumb จริง + คืน URL (ไม่ใช่ key)
- [ ] ทดสอบ: สร้างงาน 3 งานติดกัน (เบอร์เดียวกัน 2 งาน), follow-up, ดูรูป, การ์ดขึ้นกลุ่ม

## รอบ 2 — ให้ข้อมูลครบตาม requirement (1–2 วัน)
- [ ] อำเภอ/ตำบล (dropdown หรือ reverse geocode) + ส่งเข้า API
- [ ] วันคาดการณ์สั่งของในฟอร์ม
- [ ] บังคับ GPS + รูป ≥1 (หรือ config)
- [ ] Idempotency-Key (LIFF ส่ง + middleware backend)
- [ ] `countSites` ใช้ COUNT, today แบบ Asia/Bangkok
- [ ] `FindNearby` clamp `acos` + แสดงงานที่จบแล้วใน duplicate
- [ ] `pkg/phone` normalize `+66`
- [ ] `UpdateReportID` เช็กเจ้าของรูป
- [ ] Upload validate ชนิด/ขนาด, re-encode JPEG ฝั่ง LIFF
- [ ] DuplicateDialog → ปุ่ม "อัปเดตงานนี้"
- [ ] Route `/sites/:code` + ปุ่มในการ์ด Flex
- [ ] `invalidateQueries` หลังสร้างงาน, error message จาก API, ซ่อน `/test`

## รอบ 3 — Clean Architecture ให้สะอาด (0.5–1 วัน)
- [ ] `domain/errors` + map ใน ErrorHandler
- [ ] `SalesRepService`, `OptionsService` (handler ไม่ใช้ repository)
- [ ] `SeedAdmin` → `cmd/create-admin`
- [ ] port `LineAuthVerifier` (+ timeout/ctx)
- [ ] ย้าย Flex → `domain/flex` + test
- [ ] ตัดสินใจเรื่อง webhook/OA: ลบ หรือทำ dedupe + 401 signature
- [ ] AutoMigrate → `cmd/migrate`, gorm log level ตาม `APP_ENV`, rate limit

## รอบ 4 — Admin ตาม requirement (3–5 วัน)
- [ ] หน้ารายละเอียดหน้างาน (timeline, รูป, แผนที่, แก้สถานะ + log)
- [ ] ตัวกรองสถานะ/เซลล์/อำเภอ/ช่วงวัน
- [ ] อนุมัติเซลล์, ตั้งชื่อเล่น/พื้นที่, ผู้ใช้ admin/viewer
- [ ] Analytics API + Dashboard KPI (รายวัน/เดือน/ปี, ต่อเซลล์, ต่อพื้นที่, สาเหตุจบที่อื่น)
- [ ] Export Excel (คอลัมน์ชีทเดิม) / Import Excel

## รอบ 5 — ก่อนขึ้น Production
- [ ] Unit test domain + middleware role matrix
- [ ] docker-compose: bind 127.0.0.1, restart, healthcheck, migrate service, backup
- [ ] build static LIFF/Admin + nginx
- [ ] ย้ายขึ้น VPS, ตั้ง LIFF endpoint ใหม่
