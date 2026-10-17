# 01 — `_gofiber` Review

✅ `go build ./...` และ `go vet ./...` ผ่าน (Go 1.24)

## จุดที่ดีแล้ว
- แยกชั้นตามแผน: `domain/{models,dto,repositories,services,ports}`, `application/serviceimpl`, `infrastructure/{postgres,redis,storage,line}`, `interfaces/api`
- `TxManager` เก็บ tx ใน context + `postgres.GetDB(ctx, db)` — service ไม่แตะ gorm ตรง
- DI แยก `container.go` / `repositories.go`
- Response format `{success,data}` / `{success:false,error}` เหมือน deli2you
- Webhook ตรวจ signature ด้วย `hmac.Equal`
- Duplicate check ทั้งเบอร์และระยะ 150 ม.

---

## P0 — ต้องแก้ทันที

### 1. Sales token เข้า admin API ได้ — `interfaces/api/middleware/auth.go`
ตรรกะปัจจุบัน: เมื่อ `requiredRole="admin"` และ `claims.Role="sales"` → ไม่เข้าเงื่อนไขไหนเลย → **ผ่าน**
```go
// แก้เป็น allow-list ชัดเจน
allowed := map[string][]string{
    "sales": {"sales"},
    "admin": {"admin", "viewer"},
}
if !slices.Contains(allowed[requiredRole], claims.Role) {
    return utils.ForbiddenResponse(c, "Forbidden")
}
if claims.Role == "viewer" && c.Method() != fiber.MethodGet {
    return utils.ForbiddenResponse(c, "Viewer role is read-only")
}
```
และ parse JWT ด้วย `jwt.WithValidMethods([]string{"HS256"})`, ใส่ `iss`/`aud` แยก LIFF กับ admin

### 2. เซลล์ใหม่ได้สถานะ `active` อัตโนมัติ — `application/serviceimpl/auth_service.go`
คอมเมนต์เขียน "pending" แต่โค้ดตั้ง `"active"` → ใครก็ได้ที่เปิดลิงก์ LIFF เห็นข้อมูลลูกค้าทั้งหมด
- สร้างเป็น `pending` → ตอบ `403 REP_PENDING` → LIFF แสดง "รอแอดมินอนุมัติ"
- (ถ้ามี OA ในกลุ่ม) เช็ก `GetGroupMemberProfile` กับกลุ่มเซลล์ → active อัตโนมัติ
- แยก "ไม่พบ" กับ "DB error": ตอนนี้ `GetByLineUserID` error อะไรก็ตามจะพยายามสร้างใหม่ → ใช้ `errors.Is(err, domainerrors.ErrNotFound)`

### 3. `SiteReport.IdempotencyKey` unique + ค่าว่าง — `domain/models/site_report.go`
ทุกแถวได้ `''` → แถวที่ 2 ชน unique → สร้างรายงาน/งานใหม่ไม่ได้อีกเลย
```go
IdempotencyKey *string `gorm:"uniqueIndex"` // NULL ไม่ชนกัน
```
แล้วตั้งค่าจาก header `Idempotency-Key` จริง (ดู P1-5)

### 4. `Contact.Phone` unique — `domain/models/contact.go`
ช่าง 1 คนรับหลายหน้างานเป็นเรื่องปกติ (เห็นในข้อมูลจริง) → สร้างงานที่ 2 ด้วยเบอร์เดิมล้มทั้ง transaction
- ตัวเลือก A (ง่าย): ลบ unique ใช้ index ธรรมดา
- ตัวเลือก B (ตามแผน): `Contact` (phone unique) + ตารางกลาง `SiteContact(site_id, contact_id, role)`

### 5. รหัสงานซ้ำเมื่อกดพร้อมกัน — `infrastructure/postgres/repoimpl/site_code_counter_repo.go`
upsert แล้วค่อย `SELECT` แยก → 2 request อ่านได้ seq เดียวกัน และ `NextCode` ถูกเรียก **นอก** transaction
```go
var seq int
err := db.Raw(`
  INSERT INTO site_code_counters(date, seq) VALUES (?, 1)
  ON CONFLICT (date) DO UPDATE SET seq = site_code_counters.seq + 1
  RETURNING seq`, datePrefix).Scan(&seq).Error
```
และย้ายการเรียกเข้าไปใน `WithTx`

### 6. URL รูปผิด + ไม่มี thumbnail — `site_service.go` `GetByCode`, `upload_service.go`
- `PhotoBrief{ThumbURL: p.ThumbKey, FullURL: p.StorageKey}` คืน **key** ไม่ใช่ URL → `<img src="thumbs/xxx.jpg">` แตก
- `thumbKey` ถูกบันทึกแต่ **ไม่เคยอัปโหลดไฟล์ thumb** → URL thumb 404 ทุกรูป (รวมรูปใน Flex ถ้าจะใส่)
- แก้: สร้าง thumb ตอนอัป (เช่น `disintegration/imaging` resize 600px) แล้วคืน `storage.PublicURL(thumbKey)`; รูปเต็มใช้ presigned URL (ต้องเพิ่ม `PresignGet` ใน port)
- ⚠️ ตอนนี้ใช้ `r2.dev` public URL = **ทั้ง bucket เป็น public** รวม `photos/` → ถ้าต้องการให้รูปเต็มเป็น private ให้แยก bucket (public สำหรับ thumb, private สำหรับรูปเต็ม) หรือใช้ custom domain + WAF rule เฉพาะ prefix `thumbs/`

### 7. ไม่มี recover / ErrorHandler รั่วข้อความ — `cmd/api/main.go`
- เพิ่ม `app.Use(recover.New())`
- `defaultErrorHandler` คืน `err.Error()` ให้ client → เปลี่ยนเป็นข้อความทั่วไป + log รายละเอียด

### 8. CORS — `interfaces/api/middleware/cors.go`, `.env`
- origin ของหน้า LIFF คือ **โดเมน endpoint ของคุณ** (`https://liff.puekk.com`) ไม่ใช่ `https://liff.line.me` → ต้องเพิ่ม `https://liff.puekk.com`
- ค่า default `CORS_ORIGINS="*"` + `AllowCredentials: true` → Fiber จะ panic ตอนเริ่ม; ไม่ได้ใช้ cookie อยู่แล้ว → ตั้ง `AllowCredentials: false`

---

## P1 — ก่อนเปิดใช้จริง

### Business logic
| # | ปัญหา | ที่ไหน | แก้ |
|---|---|---|---|
| 1 | `countSites`: `DueToday = len(list Limit:1)` → สูงสุด 1 | `auth_service.go` | เพิ่ม `SiteRepository.CountByTab(ctx, repID, tab)` ใช้ `COUNT(*)` |
| 2 | `due_today/overdue` ใช้ "วันนี้" แบบ UTC | `site_repo.go` `List` | คำนวณ today ด้วย `time.LoadLocation("Asia/Bangkok")` หรือเก็บวันที่เป็น `type:date` แล้วเทียบ `CURRENT_DATE AT TIME ZONE 'Asia/Bangkok'` |
| 3 | `FindNearby` ใช้ `acos(...)` — พิกัดเท่ากันเป๊ะได้ค่า >1 → Postgres error → ถูกกลืนเงียบ | `site_repo.go` | `acos(LEAST(1, GREATEST(-1, ...)))` + bounding box `latitude BETWEEN` ก่อนเพื่อใช้ index |
| 4 | ไม่บันทึก **อำเภอ/ตำบล/จังหวัด** เลย (LIFF ส่งแค่ lat/lng) | `Create` | ให้ LIFF เลือก อำเภอ/ตำบล (dropdown จาก config) หรือ reverse geocode ฝั่ง backend (port `Geocoder`) → **จำเป็นสำหรับรายงานตามพื้นที่** |
| 5 | ไม่มี Idempotency-Key | handlers POST | middleware อ่าน header → `GetByIdempotencyKey` → ถ้ามีคืนผลเดิม |
| 6 | วันที่ parse ผิดถูกเงียบ (`time.Parse` error ถูกทิ้ง) | `Create`, `AddFollowUp` | validate `datetime=2006-01-02` ใน DTO → 422 |
| 7 | `normalizePhone` ไม่แปลง `+66`/`66` → `0` | `site_service.go` | ย้ายไป `pkg/phone` + test |
| 8 | `UpdateReportID` ผูกรูปของใครก็ได้ และรูปที่ผูกแล้วก็ย้ายได้ | `media_file_repo.go` | `WHERE id IN ? AND rep_id = ? AND report_id IS NULL` |
| 9 | Upload เชื่อ `Content-Type` จาก client, ไม่จำกัดขนาด/ชนิด, ไฟล์ที่ fail ถูกข้ามเงียบ | `upload_service.go` | `http.DetectContentType` อนุญาตแค่ jpeg/png/webp, ≤5MB, ถ้ามีไฟล์ fail ให้ตอบ error |
| 10 | follow-up `won/lost/cancelled` แต่ `NextFollowUpDate` ค้างค่าเดิมได้ถ้าส่งมา | `AddFollowUp` | ล้างเป็น nil เมื่อไม่ใช่ `following` |
| 11 | Admin `Update` รับ `status`/`stage` เป็น text อิสระ, ไม่มี log ว่าใครแก้ | `site_service.go` `Update` | validate `oneof`, บันทึก `SiteReport{Source:"admin"}` ทุกครั้งที่แก้สถานะ |
| 12 | Duplicate check ข้าม site ที่ไม่ใช่ `following` (ทั้ง phone และ geo) | `CheckDuplicate` | ควรแสดงงานที่จบแล้วด้วย (ลูกค้าเก่า) แต่ติดป้ายสถานะ |
| 13 | N+1: `salesRepRepo.GetByID` ทุกแถวใน List/Detail/Duplicate | `site_service.go` | `Preload("Owner")` / join ครั้งเดียว |
| 14 | `CustomerName` บังคับ แต่ข้อมูลจริงหลายงานมีแค่ชื่อช่าง | DTO | บังคับ "ชื่อลูกค้า **หรือ** ชื่อช่าง อย่างน้อย 1" |

### Flex Message — `flex_builder.go`
- ไม่มีรูป (hero) และไม่มีปุ่ม URI "ดูรายละเอียด" → เพิ่ม `https://liff.line.me/{LIFF_ID}/sites/{code}` (ต้องเพิ่ม `LIFF_ID` ใน config)
- `text` ใน Flex ห้ามเป็น `""` — ตอนนี้ปลอดภัยเพราะ validate แล้ว แต่ควรกันไว้ใน builder (`if s != ""`)
- ป้าย "ผู้รับเหมา" ควรเป็น "ช่าง" ตามที่ทีมใช้
- ตัดข้อความยาวไม่ให้เกินลิมิต Flex (altText ≤ 400 ตัวอักษร)
- ย้ายเป็น pure package `domain/flex` + unit test snapshot JSON

### Clean Architecture ที่ยังรั่ว
| จุด | ปัญหา | แก้ |
|---|---|---|
| `handlers/admin_rep.go`, `admin_options.go`, `liff_options.go` | handler ถือ repository ตรง | สร้าง `SalesRepService`, `OptionsService` |
| `handlers/admin_rep.go` `SeedAdmin` | seed admin `admin@puekk.com / admin1234` **ทุก environment** อยู่ใน handler | ย้ายไป `cmd/create-admin` อ่านรหัสจาก env/flag; ห้าม seed อัตโนมัติใน production |
| `handlers/liff_site.go` | import `serviceimpl.DuplicateError` | ย้ายไป `domain/errors` |
| `serviceimpl/webhook_service.go` | import `infrastructure/line` | ทำ port `LineWebhookVerifier/Parser` หรือย้าย verify ไป middleware |
| `serviceimpl/auth_service.go` | เรียก `http.PostForm` LINE ตรง (ไม่มี ctx/timeout) | port `LineAuthVerifier` ใน `infrastructure/line` ใช้ `http.Client{Timeout:5s}` + `NewRequestWithContext` |
| services รับ `config.*Config` | domain/application ผูกกับ pkg/config | ส่งเป็นค่าที่ต้องใช้ (struct ของตัวเอง) |
| `domain/models/base.go` | import `gorm.DeletedAt` | ยอมรับได้แบบ pragmatic แต่ถ้าจะเข้ม ใช้ `*time.Time` + `gorm:"index"` |
| errors เป็น `errors.New("site not found")` | handler แยกชนิดไม่ได้ → ตอบ 400 หมด | `domain/errors`: `ErrNotFound`, `ErrForbidden`, `ErrValidation`, `ErrConflict` + map ใน ErrorHandler |

### Webhook (ถ้ายังใช้ OA)
- ไม่มี unique `webhook_event_id` → redelivery สร้างแถวซ้ำ
- signature ผิดตอบ 500 → ควร 400/401 (และไม่ log เป็น error)
- ทำงาน sync ใน request — ถ้าจะดาวน์โหลดรูปต้องย้ายไป worker
- **ถ้าตัดสินใจไม่ใช้ OA** → ลบทั้งชุดออก

### Config / Logging
- `JWT_SECRET` default `"change-me"` → ถ้า `APP_ENV=production` และยังเป็นค่า default ให้ `panic` ตอนเริ่ม
- gorm log level เช็ก `cfg.Host == "production"` (ผิดฟิลด์) → log SQL ระดับ Info ตลอด รวมเบอร์โทรลูกค้า → ใช้ `App.Env`
- ไม่มี rate limiter (deli2you มี) → ใส่อย่างน้อยที่ `/api/v1/liff/auth`, `/admin/auth`, `/liff/uploads`
- Timeout middleware ต่อ request (deli2you มี)
- `AutoMigrate` ทุกครั้งที่ start → ย้ายไป `cmd/migrate` (มีไฟล์แล้ว) และให้ `api` ไม่ migrate เอง
- `SITE_CODE_PREFIX` ใน `.env.example` ไม่ถูกใช้

---

## P2 — คุณภาพระยะยาว
- **Unit test**: site code, phone normalize, haversine, flex builder, auth middleware (role matrix), `CheckDuplicate`
- **Integration test** repository กับ Postgres (testcontainers)
- เก็บ `ExpectedOrderDate/NextFollowUpDate` เป็น `type:date`
- `Site.Stage` default `'new'` แต่ตัวเลือกใน options เป็นภาษาไทย/อังกฤษปนกัน → ใช้ code + label แยก
- เพิ่ม `Site.Tambon/Province` ใน DTO (มีใน model แล้วแต่ไม่ถูกใช้)
- Health check ตรวจ DB/Redis จริง (ตอนนี้คืน ok เสมอ)
- Redis ยังไม่ได้ใช้งานจริง → ใช้เก็บ idempotency/rate limit หรือถอดออก
- Graceful shutdown ปิด DB/Redis
