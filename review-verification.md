# Review Verification Report

ตรวจสอบข้อแจ้งจาก reviewer (rcm.txt) เทียบกับ codebase จริง

**สรุปรวม**: จาก 20 ข้อ — **17 ข้อจริง, 2 ข้อไม่จริง, 1 ข้อจริงบางส่วน**

---

## ตารางสรุป

| # | ปัญหา | ผลตรวจ | ระดับ |
|---|--------|--------|-------|
| 1 | Secret จริงอยู่ใน .env.example | TRUE | Critical |
| 2 | APP_ENV=development สร้าง admin อัตโนมัติ | **FALSE** | - |
| 3 | /liff/auth/register route ไม่มี | TRUE | Critical |
| 4 | สร้าง admin user ไม่ได้ (GetByEmail bug) | TRUE | Critical |
| 5 | รูปเกิน 3 รูปจะพัง (LIFF 6 / Backend 3) | TRUE | High |
| 6 | npm run build ไม่ผ่าน | **FALSE** | - |
| 7 | ปิดบัญชีแล้ว token ยังใช้ได้ | TRUE | Medium |
| 8 | ขโมยรูปคนอื่นได้ (ไม่เช็คเจ้าของ) | TRUE | Medium |
| A | Admin แก้สถานะ won/lost แต่ไม่บันทึก closed_at | TRUE | High |
| B | Timezone ไม่ตรงกัน 3 แบบ | TRUE | High |
| C | กราฟรายวันจัดกลุ่มตาม UTC | TRUE | Medium |
| D | bucket=week ไม่ทำงาน (fallback เป็น daily) | TRUE | Low |
| E | LIFF นับตาม created_at / Admin นับตาม closed_at | TRUE | Medium |
| F | Overdue ไม่สนตัวกรอง / pipeline ติดลบได้ | TRUE | Medium |
| G | "วิ่งงาน" ในหน้าพื้นที่นับตลอดกาล | TRUE | Medium |
| H | หน้าเซลล์ขึ้น "NaN" (ไม่มี createdAt ใน DTO) | TRUE | Low |
| I | "วันที่คาดว่าจะสั่ง" หายทุกครั้ง | TRUE | High |
| J | ปุ่ม "อัปเดตงานนี้แทน" ไม่โผล่ | **PARTIAL** | High |
| K | ส่งเข้ากลุ่มล้มเหลวไม่มีปุ่มส่งซ้ำ | TRUE | Medium |
| L | หน้าแรก LIFF ไม่ refresh หลังส่งรายงาน | TRUE | Medium |
| M | Error ขึ้นเป็นภาษาอังกฤษ axios | TRUE | Medium |
| N | กดส่งซ้ำได้รายงานซ้ำ (Idempotency-Key ไม่ถูกใช้) | TRUE | High |

---

## รายละเอียด

### ข้อ 1 — Secret ใน .env.example: TRUE

**ไฟล์**: `_gofiber/.env.example`

มี credential จริงที่ไม่ใช่ placeholder:
- `DB_PASSWORD=linesales_secret` — รหัสผ่าน DB จริง
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — Cloudflare R2 key จริง
- `LINE_LOGIN_CHANNEL_ID=2012062839` — LINE channel จริง

`.env` อยู่ใน `.gitignore` แล้ว แต่ `.env.example` ไม่ได้อยู่ จึงถูก commit ขึ้น git พร้อม secret จริง

---

### ข้อ 2 — Auto-seed admin ใน production: FALSE (ไม่จริง)

**ไฟล์**: `_gofiber/pkg/di/container.go:108-120`

```go
if cfg.App.Env == "development" {
    seedAdmin(repos.adminUser)
}
```

มี guard ชัดเจน — seed เฉพาะ development เท่านั้น ถ้าตั้ง `APP_ENV=production` จะไม่สร้างบัญชี admin อัตโนมัติ ถ้า deploy จริงใช้ production env ก็ไม่มีปัญหา

---

### ข้อ 3 — /liff/auth/register ไม่มี route: TRUE

**Frontend** (`_liff/src/constants/api-routes.ts:5`):
```ts
REGISTER: `${API_BASE}/liff/auth/register`,
```

**Backend routes** (`routes.go:40-41`):
```go
v1.Post("/liff/auth", h.LIFFAuth.Auth)
// ไม่มี /liff/auth/register
```

เซลล์ใหม่กด register จะได้ 404 ทุกครั้ง ลงทะเบียนไม่ได้จริง

---

### ข้อ 4 — สร้าง admin user ไม่ได้: TRUE

**ไฟล์**: `_gofiber/infrastructure/postgres/repoimpl/admin_user_repo.go:31-35`

```go
func (r *adminUserRepository) GetByEmail(ctx context.Context, email string) (*models.AdminUser, error) {
    var user models.AdminUser
    err := postgres.GetDB(ctx, r.db).Where("email = ?", email).First(&user).Error
    return &user, err  // คืน &user เสมอ (ไม่เคย nil)
}
```

**Handler** (`admin_user.go:53`):
```go
if existing, _ := h.userRepo.GetByEmail(ctx, req.Email); existing != nil {
    return utils.BadRequestResponse(c, "อีเมลนี้ถูกใช้แล้ว")
}
```

`GetByEmail` คืน `&user` (non-nil pointer) เสมอ แม้ไม่เจอ record → handler เข้า condition ทุกครั้ง → สร้าง admin ไม่ได้เลย

---

### ข้อ 5 — รูปเกิน 3 รูปจะพัง: TRUE

- **LIFF** `PhotoPicker` default `max = 6`
- **Backend** `upload_service.go:33`: `if len(files) > 3 { return nil, "maximum 3 photos allowed" }`

เซลล์เลือกรูป 4-6 ใบ → upload ล้มเหลว → ส่งรายงานไม่ได้

---

### ข้อ 6 — npm run build ไม่ผ่าน: FALSE (ไม่จริง)

ทดสอบ `npx tsc --noEmit` ทั้ง admin และ LIFF → **ผ่านทั้งคู่ ไม่มี error**

---

### ข้อ 7 — ปิดบัญชีแล้ว token ยังใช้ได้: TRUE

**ไฟล์**: `_gofiber/interfaces/api/middleware/auth.go`

Middleware ตรวจแค่ JWT signature + role เท่านั้น ไม่มีการ query DB เช็คว่า user ยัง active อยู่หรือไม่ Token ที่ออกไปแล้วจะใช้ได้จนหมดอายุ (7 วัน)

---

### ข้อ 8 — ขโมยรูปคนอื่นได้: TRUE

**ไฟล์**: `_gofiber/infrastructure/postgres/repoimpl/media_file_repo.go:37-42`

```go
func (r *mediaFileRepository) UpdateReportID(ctx context.Context, ids []uuid.UUID, reportID uuid.UUID) error {
    return postgres.GetDB(ctx, r.db).Model(&models.MediaFile{}).
        Where("id IN ?", ids).  // ไม่มี AND rep_id = ?
        Update("report_id", reportID).Error
}
```

ไม่เช็ค ownership — ส่ง photo ID ของคนอื่นมาผูกกับรายงานตัวเองได้

---

### ข้อ A — Admin แก้สถานะ won/lost ไม่บันทึก closed_at: TRUE

**ไฟล์**: `_gofiber/application/serviceimpl/site_service.go` — method `Update()`

เปลี่ยน status เป็น won/lost แต่ไม่ set `site.ClosedAt = &now` (ต่างจาก `AddFollowUp()` ที่ทำถูก) ทำให้ analytics ที่ filter ตาม `closed_at` นับไม่เจอ

---

### ข้อ B — Timezone ไม่ตรงกัน: TRUE

| ที่ | วิธีใช้ | ไฟล์ |
|-----|---------|------|
| Site list tabs (due_today/overdue) | `time.Now().UTC()` | site_repo.go:54 |
| Analytics overdue count | `time.Now()` (server local) | analytics_repo.go:104 |
| Analytics date range | `time.LoadLocation("Asia/Bangkok")` | analytics_service.go:368 |

3 วิธีต่างกัน → ช่วง 00:00-07:00 น. ตัวเลขแต่ละที่ไม่ตรงกัน

---

### ข้อ C — กราฟรายวันจัดกลุ่มตาม UTC: TRUE

**ไฟล์**: `analytics_repo.go` — `dateTruncField()`

```go
return "to_char(" + field + ", 'YYYY-MM-DD')"  // ไม่มี AT TIME ZONE 'Asia/Bangkok'
```

รายงานช่วงเช้ามืด (00:00-07:00 ไทย) ตกไปวันก่อนหน้า

---

### ข้อ D — bucket=week ไม่ทำงาน: TRUE

`dateTruncField()` มีแค่ case `"month"`, `"year"`, `default` (day) — ไม่มี `"week"` → ส่ง `bucket=week` มาได้ daily กลับไป

---

### ข้อ E — LIFF นับตาม created_at / Admin นับตาม closed_at: TRUE

- **LIFF** `CountByRepAndStatus`: `WHERE created_at >= ?`
- **Admin** `CountSitesByStatus`: `WHERE closed_at >= ? AND closed_at < ?`

คนละ field คนละ logic → ตัวเลขไม่ตรงกัน

---

### ข้อ F — Overdue ไม่สนตัวกรอง: TRUE

`analytics_service.go` — `Summary()` เรียก `CountOverdueAll(ctx)` โดยไม่ส่ง `repID` → เลือกกรองตามเซลล์แต่ overdue ยังเป็นตัวเลขรวมทั้งทีม → `upcoming = following - overdue` สามารถติดลบได้

---

### ข้อ G — "วิ่งงาน" นับตลอดกาล: TRUE

`SiteCountsByArea()` — base query `count(*)` ไม่มี date filter → นับ site ทั้งหมดตลอดกาล ส่วน cancelled/new/overdue breakdown เป็น 0 ทุกแถว

---

### ข้อ H — หน้าเซลล์ขึ้น "NaN": TRUE

`dto.RepResponse` struct ไม่มี field `createdAt` → frontend ได้ `undefined` → `new Date(undefined)` = Invalid Date → แสดง "NaN"

---

### ข้อ I — "วันที่คาดว่าจะสั่ง" หาย: TRUE

**Frontend** ส่งข้อความเช่น `"ภายในเดือน"` → **Backend** parse ด้วย `time.Parse("2006-01-02", ...)` → fail silently → บันทึกเป็น NULL

---

### ข้อ J — ปุ่ม "อัปเดตงานนี้แทน" ไม่โผล่: PARTIAL

- **isMine ไม่ถูก set**: TRUE — `CheckDuplicate` ใน site_service.go สร้าง `DuplicateMatch` โดยไม่ set `IsMine` → เป็น `false` เสมอ → ปุ่มไม่โผล่จริง
- **acos error พิกัดเดียวกัน**: FALSE — พิกัดเดียวกัน `acos(1.0) = 0` ทำงานปกติ (แต่พิกัดใกล้กันมากอาจมี floating-point risk เล็กน้อย)

---

### ข้อ K — ส่งเข้ากลุ่มล้มเหลวไม่มีปุ่มส่งซ้ำ: TRUE

`chatMessages` ไม่ถูกเก็บไว้หลัง navigate ไป SuccessPage → ไม่มีข้อมูลสำหรับ retry → มีแค่ปุ่ม "คัดลอกข้อความ" เป็น fallback

---

### ข้อ L — หน้าแรก LIFF ไม่ refresh: TRUE

`useCreateSite` mutation ใช้ `meta: { invalidates: [siteKeys.all] }` แต่ไม่มี `MutationCache` handler ที่อ่าน `meta.invalidates` → cache ไม่ถูก invalidate → หน้าแรกแสดงข้อมูลเก่า

---

### ข้อ M — Error ขึ้นเป็นภาษาอังกฤษ: TRUE

`api-client.ts` interceptor re-throw raw `AxiosError` → call site ใช้ `err.message` ซึ่งเป็น `"Request failed with status code 400"` → ข้อความไทยจาก backend (`err.response.data.error.message`) ไม่ถูกแสดง

---

### ข้อ N — กดส่งซ้ำได้รายงานซ้ำ: TRUE

- **Frontend** ส่ง `Idempotency-Key` header ถูกต้อง
- **Backend** CORS allowlist `Idempotency-Key` ไว้แล้ว + model มี column + repo มี `GetByIdempotencyKey`
- **แต่** handler `CreateSite` ไม่เคยเรียก `GetByIdempotencyKey` → infrastructure พร้อมแต่ไม่ได้ wire เข้ากัน

---

## ลำดับการแก้ไขที่แนะนำ

### ด่วน (ก่อนเปิดใช้งานจริง)
1. **ข้อ 1** — ลบ secret จริงออกจาก .env.example, เปลี่ยน key ทั้งหมด
2. **ข้อ 3** — เพิ่ม register route ใน backend
3. **ข้อ 4** — แก้ GetByEmail ให้คืน `nil, err` เมื่อไม่เจอ
4. **ข้อ 5** — ปรับ limit ให้ตรงกัน (frontend/backend)
5. **ข้อ I** — รองรับ expectedOrderDate เป็นข้อความ
6. **ข้อ N** — Wire idempotency check ใน CreateSite handler

### สำคัญ (หลังเปิดใช้)
7. **ข้อ A** — Set closed_at เมื่อ admin เปลี่ยนสถานะ won/lost
8. **ข้อ B,C** — Standardize timezone เป็น Asia/Bangkok ทั้งระบบ
9. **ข้อ J** — Set isMine ใน CheckDuplicate
10. **ข้อ L** — แก้ cache invalidation หลังส่งรายงาน
11. **ข้อ M** — Extract Thai error message จาก API response

### ปรับปรุง (ทำทีหลังได้)
12. **ข้อ 7** — เพิ่ม DB check ใน auth middleware
13. **ข้อ 8** — เพิ่ม ownership check ตอนผูกรูป
14. **ข้อ D,E,F,G,H** — แก้ analytics queries ให้ถูกต้อง
15. **ข้อ K** — เพิ่มกลไก retry ส่งเข้ากลุ่ม
