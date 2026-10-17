# 01 — Backend Go Fiber (Clean Architecture) — แผนการสร้าง

อ้างอิง convention จาก `_FOOD_DELIVERY/_gofiber` (Go 1.24, Fiber v2.52, GORM, go-redis v9, aws-sdk-go-v2, validator v10, golang-jwt v5, lumberjack, `utils.SuccessResponse` / `ErrorResponse` format `{success, data}` / `{success:false, error:{code,message,details}}`)

## 1. กฎ Clean Architecture (บังคับทั้งโปรเจกต์)

```
interfaces (HTTP/webhook/worker)  →  application (use cases)  →  domain (entities, interfaces)
                                                                     ▲
infrastructure (postgres, redis, line, r2) ── implements ────────────┘
pkg/di = ที่เดียวที่รู้จักทุกชั้นและประกอบร่าง
```

| ชั้น | import ได้ | ห้าม |
|---|---|---|
| `domain/*` | stdlib, `uuid`, ภายใน domain | gorm, fiber, redis, line-sdk, aws (ใส่ gorm tag เป็น string ได้ แต่ไม่ import gorm) |
| `application/serviceimpl` | domain | fiber, gorm, infrastructure |
| `infrastructure/*` | domain, ไลบรารีภายนอก | application, interfaces |
| `interfaces/api/*` | domain (services, dto, errors), pkg/utils | repositories, infrastructure โดยตรง |
| `pkg/di` | ทุกชั้น | — |

**ต่างจาก deli2you (ตั้งใจให้เข้มขึ้น):**
- Handler **ไม่ถือ repository** — ทุกอย่างผ่าน service (`handlers.Services` มีแต่ service interfaces)
- Transaction ผ่าน port `TxManager.WithinTx(ctx, fn)` — service ไม่รู้จัก `*gorm.DB`
- DI container แยกไฟล์ (`infra.go`, `repos.go`, `services.go`, `handlers.go`) ไม่ให้ไฟล์เดียวยาว 1,500 บรรทัด
- Domain errors (`domain/errors`) → handler map เป็น HTTP status ในที่เดียว (`middleware.ErrorHandler`)
- ตรวจกฎ import อัตโนมัติด้วย `go-arch-lint` หรือ test ง่าย ๆ ที่ scan import (B10)

## 2. โครงโฟลเดอร์

```
_gofiber/
├── cmd/
│   ├── api/main.go                 # HTTP + worker + scheduler
│   ├── migrate/main.go             # AutoMigrate + SQL index/constraint
│   ├── create-admin/main.go
│   ├── import-excel/main.go        # (B8)
│   └── reparse/main.go             # (B7) re-parse line_events
├── domain/
│   ├── models/                     # entities (ข้อ 3)
│   ├── dto/                        # request/response + mappers
│   ├── services/                   # service interfaces
│   ├── repositories/               # repository interfaces
│   ├── ports/                      # TxManager, LineMessenger, LineContentFetcher, LineAuthVerifier,
│   │                               # ObjectStorage, JobQueue, Clock, IDGenerator
│   ├── errors/                     # ErrNotFound, ErrDuplicate, ErrForbidden, ErrValidation...
│   ├── events/
│   ├── sitecode/                   # pure: format/parse YYMMDD-NN (พ.ศ.)
│   ├── flex/                       # pure: build Flex Message JSON (การ์ดรายงาน)
│   └── reportparser/               # pure: parse ข้อความพิมพ์ (B7)
├── application/serviceimpl/
│   ├── auth_service_impl.go        # LIFF ID token → JWT, admin login
│   ├── sales_rep_service_impl.go
│   ├── line_group_service_impl.go
│   ├── webhook_ingest_service_impl.go
│   ├── event_processor_service_impl.go
│   ├── media_service_impl.go
│   ├── site_service_impl.go        # new site, follow-up, duplicate check, my sites, due
│   ├── report_service_impl.go
│   ├── upload_service_impl.go
│   ├── review_service_impl.go      # (B7)
│   ├── export_service_impl.go      # (B8)
│   ├── analytics_service_impl.go   # (B9)
│   └── reminder_service_impl.go    # (B9)
├── infrastructure/
│   ├── postgres/                   # db.go, tx_manager.go, *_repository_impl.go
│   ├── redis/                      # client, dedupe, cache
│   ├── queue/                      # Redis list/stream job queue + worker pool
│   ├── line/                       # messenger.go, content.go, auth_verifier.go (verify ID token), signature.go
│   ├── storage/                    # r2.go (Put, PresignGet, PublicURL)
│   └── excel/                      # (B8) excelize
├── interfaces/
│   ├── api/
│   │   ├── handlers/               # handlers.go (Services struct) + *_handler.go
│   │   ├── routes/                 # routes.go + *_routes.go (pattern เดียวกับ deli2you)
│   │   └── middleware/             # request_id, logger, cors, error, auth(JWT), role, line_signature
│   └── worker/                     # job handlers ที่ worker เรียก (process_event, fetch_media)
├── pkg/
│   ├── config/  di/  logger/  scheduler/
│   ├── utils/                      # response.go, validator.go, jwt.go, phone.go, geo.go
│   └── thaidate/                   # format/parse วันที่ไทย พ.ศ.
├── migrations/                     # SQL เสริม (index, partial unique)
├── Dockerfile  .air.toml  .env.example  Makefile  CLAUDE.md
└── go.mod  (module line-sales-api)
```

## 3. Domain Models

| Model | Fields หลัก |
|---|---|
| **AdminUser** | ID, Email, PasswordHash, Name, Role(admin/viewer), IsActive |
| **LineGroup** | ID, GroupID(uniq), Name, IsSalesGroup, IsActive, JoinedAt, LeftAt |
| **SalesRep** | ID, LineUserID(uniq), DisplayName, PictureURL, Nickname, Area, Status(pending/active/inactive), LastSeenAt |
| **LineEvent** | ID, WebhookEventID(uniq), Type, SourceType, GroupID, UserID, MessageID, MessageType, QuotedMessageID, Payload(jsonb), EventTime, ProcessStatus, ProcessError |
| **Contact** | ID, PhoneNormalized(index), Name, Type(owner/contractor/other) |
| **Site** | ID, SiteCode(uniq), OwnerRepID, CustomerName, CustomerType, ContractorName, Phone, DecisionMaker, Stage, Detail, Lat, Lng, Address, Tambon, Amphoe, Province, Status(following/won/lost/cancelled), LostReason, Competitor, ExpectedOrderDate, NextFollowUpDate, FollowUpCount, FirstReportedAt, LastReportedAt, IsCustomerNew, Source(liff/text/import), MergedIntoID |
| **SiteContact** | SiteID, ContactID, Role |
| **SiteReport** | ID, SiteID, RepID, Kind(new/follow_up), Note, StatusAfter, NextFollowUpDate, Payload(jsonb snapshot ฟอร์ม), Source(liff/text/admin), LineMessageID?, ReportedAt, DeletedAt |
| **MediaFile** | ID, ReportID?, SiteID?, Source(liff/line), LineMessageID?, R2Key, ThumbKey, Width, Height, Bytes, Status |
| **SiteCodeCounter** | Date(PK), LastSeq — ใช้ `SELECT ... FOR UPDATE` รันเลขต่อวัน |
| **ReviewItem** | (B7) Kind, RefIDs, Suggestion, Status, ResolvedBy |
| **AppConfig** | Key, Value (dropdown options, geo radius, reply mode) |

## 4. Ports (interfaces ใน `domain/ports`)

```go
type TxManager interface {
    WithinTx(ctx context.Context, fn func(ctx context.Context) error) error
}
type LineAuthVerifier interface { // verify LIFF ID token กับ https://api.line.me/oauth2/v2.1/verify
    VerifyIDToken(ctx context.Context, idToken string) (*LineIdentity, error)
}
type LineMessenger interface {
    Reply(ctx context.Context, replyToken string, msgs []json.RawMessage) error
    Push(ctx context.Context, to string, msgs []json.RawMessage) error
    GetGroupMemberProfile(ctx context.Context, groupID, userID string) (*LineProfile, error)
    GetGroupSummary(ctx context.Context, groupID string) (*LineGroupSummary, error)
}
type LineContentFetcher interface {
    Fetch(ctx context.Context, messageID string) (io.ReadCloser, string, error)
}
type ObjectStorage interface {
    Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error
    PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error)
    PublicURL(key string) string
}
type JobQueue interface {
    Enqueue(ctx context.Context, job Job) error
}
type Clock interface{ Now() time.Time }
```

## 5. ขั้นตอนการสร้าง (Backend)

แต่ละขั้น = 1 PR/commit ที่รันได้ + test

### B0 — Scaffold (M1)
- `go mod init line-sales-api`, deps ตาม deli2you + `line-bot-sdk-go/v8`, `excelize/v2`, `robfig/cron/v3`
- `pkg/config` (env → struct), `pkg/logger` (slog + lumberjack), `pkg/utils/response.go` (copy format เดิม)
- `cmd/api/main.go`: middleware stack แบบ deli2you (RequestID → Logger → Recover → Timeout → RateLimiter → CORS) + `/health` (DB + Redis)
- `pkg/di` แยกไฟล์ init
- `Dockerfile` (multi-stage), `.air.toml`, root `docker-compose.yml` (postgres, redis, api, cloudflared), `.env.example`, `Makefile` (`dev`, `test`, `lint`, `migrate`)
- ✅ `curl https://api.<domain>/health` ผ่าน Tunnel ได้

### B1 — Models + Migration (M1)
- models ทั้งหมดในข้อ 3, `cmd/migrate` (AutoMigrate + SQL: unique, index `sites(owner_rep_id, status, next_follow_up_date)`, `sites(phone)`, `line_events(webhook_event_id)`)
- `infrastructure/postgres/tx_manager.go` (tx เก็บใน context)
- `cmd/create-admin`
- ✅ migrate บน DB ว่างผ่าน, test tx rollback

### B2 — LINE Webhook Ingest (M1)
- `middleware/line_signature.go` — HMAC-SHA256 body ด้วย Channel Secret เทียบ `X-Line-Signature` (ใช้ raw body)
- `POST /webhook/line` → `WebhookIngestService.Ingest` → insert `line_events` `ON CONFLICT DO NOTHING` → enqueue → 200
- Worker pool (`infrastructure/queue` + `interfaces/worker`) → `EventProcessorService`:
  - `join`/`leave` → LineGroup, `memberJoined/Left`
  - ทุก message ในกลุ่ม → ensure SalesRep (GetGroupMemberProfile ครั้งแรก)
  - เก็บ raw อย่างเดียว (parse ทำใน B7)
- ✅ เชิญ OA เข้ากลุ่มทดสอบ, ส่ง text/รูป/location → เห็นใน `line_events`; ส่ง webhook ซ้ำ → ไม่ซ้ำ

### B3 — Media จาก LINE → R2 (M1)
- `infrastructure/storage/r2.go`, `infrastructure/line/content.go`
- event image/video → job `fetch_media` → R2 `line/{yyyy}/{mm}/{messageId}.jpg` + retry 3 ครั้ง
- ✅ ส่งรูปในกลุ่ม → ไฟล์อยู่ใน R2

### B4 — Auth (M2)
- `POST /api/v1/liff/auth` `{idToken}` → `LineAuthVerifier.VerifyIDToken` (client_id = LINE Login Channel ID) → หา SalesRep ตาม `sub`
  - ถ้ายังไม่มี → เช็กว่าเป็นสมาชิกกลุ่มเซลล์ (GetGroupMemberProfile กับ group ที่ `IsSalesGroup`) → สร้าง `active` / ไม่ใช่ → 403
- ออก JWT (role `sales`, sub = repID) อายุ 7 วัน
- `POST /api/v1/admin/auth/login` (email/password, bcrypt) → JWT role `admin`
- middleware `Protected()`, `RequireRole("sales"|"admin")`, `InjectRepID`
- ✅ test verify mock, token หมดอายุ, คนนอกกลุ่ม 403

### B5 — Site & Report Core (M2) ★
- `sitecode` (pure) + `SiteCodeCounter` FOR UPDATE → `690825-01`
- `SiteService`:
  - `CreateNewSite(repID, req)` — tx: counter → Site → Contact(upsert by phone) → SiteReport(new) → attach media
  - `AddFollowUp(repID, siteID, req)` — tx: SiteReport(follow_up) → update Site (status, next date, count, last) ; จบได้/จบที่อื่น บังคับเหตุผลตาม config
  - `CheckDuplicate(phone, lat, lng)` — เบอร์ตรง หรือ ห่าง ≤ `SITE_GEO_RADIUS_M` (Haversine ใน SQL หรือ bounding box + Go)
  - `ListMySites(repID, filter: due_today|overdue|following|all, q)`
  - `GetSite(siteCode)` — detail + timeline + media URLs
- ownership: เซลล์อัปเดตได้เฉพาะงานตัวเอง (admin ได้ทุกงาน) — config ได้
- `pkg/thaidate`, `utils/phone` normalize
- ✅ unit test service ด้วย mock repo; integration test กับ Postgres (docker)

### B6 — Upload + Flex (M2)
- `POST /api/v1/liff/uploads` multipart (≤ 3 รูป/ครั้ง, ≤ 5MB/รูป) → R2 `site/{siteCode|tmp}/{uuid}.jpg` + สร้าง thumb (resize 600px ด้วย `disintegration/imaging`) → `thumb/{uuid}.jpg` (public domain)
- `domain/flex.BuildReportCard(site, report, thumbURL, liffURL)` → Flex JSON (hero รูป, ชื่อ/ช่าง/อำเภอ, สถานะ, ตามต่อ, ปุ่ม URI "ดูรายละเอียด" → `https://liff.line.me/{liffId}/sites/{code}`)
- response ของ create/follow-up คืน `flexMessage` ให้ LIFF ส่ง
- ✅ ทดสอบใน LINE Flex Simulator + ส่งจริงในกลุ่มทดสอบ

### B7 — Text fallback (M4)
- `domain/reportparser` (ตาม docs/02) + test จากข้อความจริง
- Bundler (Redis state), SiteMatching (quote → code → phone → geo), ReviewItem, reply ยืนยัน (ใช้ reply token = ฟรี)
- `cmd/reparse`
- ข้อความ text ที่ตรงกับ "การ์ดจาก LIFF" ไม่ต้อง parse (Flex ไม่ยิง webhook อยู่แล้ว)

### B8 — Admin APIs + Excel (M3)
- sites list/detail/patch/merge, reports, sales-reps CRUD/approve, groups, config (dropdown options)
- `GET /admin/export/excel` คอลัมน์ตามชีทเดิม (docs/04), `POST /admin/import/excel` + `cmd/import-excel`
- presigned URL สำหรับรูปเต็ม

### B9 — Analytics + Scheduler (M4)
- summary ต่อเซลล์/พื้นที่/ช่วงเวลา, lost reasons, trend
- cron 07:30 คำนวณ due/overdue → cache; สรุปรายสัปดาห์ push เข้ากลุ่ม (เปิด/ปิดได้)

### B10 — Hardening (M5)
- arch-lint import rules, test coverage domain ≥ 80%, rate limit `/liff/*`, request size, graceful shutdown worker, backup script, log rotation

## 6. Testing Strategy

| ระดับ | อะไร | เครื่องมือ |
|---|---|---|
| Unit (pure) | sitecode, thaidate, phone, flex, reportparser, haversine | `testing` + table-driven |
| Service | SiteService ฯลฯ กับ mock repo/ports | `testify/mock` หรือ hand-written fakes |
| Repository | GORM กับ Postgres จริง | `testcontainers-go` หรือ compose test DB |
| Handler | HTTP status/format | `app.Test()` ของ Fiber |
| E2E | กลุ่มทดสอบจริง + LIFF บนมือถือ | checklist ใน 02 |
