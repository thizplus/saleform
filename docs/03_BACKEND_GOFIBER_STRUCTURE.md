# 03 — Backend Go Fiber (Clean Architecture) ตามแบบ `_FOOD_DELIVERY`

ใช้โครงเดียวกับ `_FOOD_DELIVERY/_gofiber` (domain / application / infrastructure / interfaces / pkg + DI container + Port/Adapter) ตัดส่วนที่ไม่ใช้ออก และเพิ่มส่วนเฉพาะงาน LINE

## 1. Tech Stack

| Layer | Technology |
|---|---|
| API | Go 1.23+ · Fiber · GORM |
| DB | PostgreSQL 16 (+ PostGIS ถ้าใช้หา ตำบล/ระยะทางด้วย polygon) |
| Cache / Queue / Bundle state | Redis 7 |
| LINE | `github.com/line/line-bot-sdk-go/v8` (messaging_api + webhook) |
| Storage | Cloudflare R2 (S3-compatible, `aws-sdk-go-v2`) |
| Excel | `github.com/xuri/excelize/v2` (import Excel เดิม + export) |
| Scheduler | `robfig/cron/v3` |
| Admin Web | React + Vite + shadcn (แบบ `_vite` เดิม) — เฟสถัดไป |
| Tunnel (dev) | cloudflared |

## 2. โครงสร้างโปรเจกต์

```
_gofiber/
├── cmd/
│   ├── api/main.go                    # Entry: HTTP server + workers + scheduler
│   ├── migrate/                       # DB migrations
│   ├── create-admin/                  # สร้าง admin user
│   ├── import-excel/                  # นำเข้า Excel เดิม (ชีทรูป 03) เป็น Site/Report ตั้งต้น
│   └── reparse/                       # parse raw events ใหม่ทั้งหมดเมื่อปรับ parser
├── domain/
│   ├── models/                        # Entities (ดูข้อ 3)
│   ├── dto/                           # Request/Response
│   ├── services/                      # Service interfaces
│   ├── repositories/                  # Repository interfaces
│   ├── ports/                         # LineMessenger, LineContent, ObjectStorage, Geocoder, LLMExtractor, Clock
│   ├── errors/
│   ├── events/                        # ReportCreated, SiteStatusChanged, ...
│   ├── mappers/
│   └── reportparser/                  # ★ Pure Go — parse text → ParsedReport (ไม่มี dependency, unit test หนัก ๆ)
│       ├── normalize.go
│       ├── fields.go                  # พจนานุกรมคำพ้อง key
│       ├── status.go                  # ตามต่อ / จบได้ / จบที่อื่น / ยกเลิก
│       ├── address.go                 # ตำบล/อำเภอ/จังหวัด จาก address
│       └── parser_test.go             # ใช้ข้อความจริงจากกลุ่มเป็น test case
├── application/serviceimpl/
│   ├── webhook_ingest_service.go      # บันทึก raw + dedupe + enqueue
│   ├── event_processor_service.go     # worker: route event ตามชนิด
│   ├── media_service.go               # ดาวน์โหลด content → R2
│   ├── report_bundler_service.go      # รวม text+รูป+location เป็น 1 รายงาน (Redis state)
│   ├── site_matching_service.go       # งานใหม่ / follow-up / รอตรวจ
│   ├── report_service.go
│   ├── site_service.go                # CRUD, merge, เปลี่ยนสถานะ
│   ├── review_service.go              # คิวรอตรวจ
│   ├── reply_service.go               # สร้างข้อความตอบกลับในกลุ่ม
│   ├── reminder_service.go            # งานครบกำหนด/เลยกำหนด
│   ├── analytics_service.go           # KPI (ดู 04)
│   └── export_service.go              # Excel export / import
├── infrastructure/
│   ├── postgres/                      # GORM repositories
│   ├── redis/                         # bundle state, dedupe, cache
│   ├── queue/                         # Redis Streams / list-based job queue
│   ├── line/                          # Messaging API client, signature verify, content fetch, profile
│   ├── storage/                       # R2 adapter (+ presigned URL)
│   ├── geo/                           # (optional) PostGIS tambon lookup / reverse geocode
│   └── ai/                            # (optional) Claude/Gemini extractor
├── interfaces/api/
│   ├── handlers/
│   │   ├── line_webhook_handler.go
│   │   ├── site_handler.go
│   │   ├── report_handler.go
│   │   ├── review_handler.go
│   │   ├── sales_rep_handler.go
│   │   ├── analytics_handler.go
│   │   ├── export_handler.go
│   │   └── auth_handler.go
│   ├── routes/
│   └── middleware/                    # LineSignature, RequestID, Logger, CORS, Protected, AdminOnly, RateLimiter
├── pkg/
│   ├── config/
│   ├── di/container.go
│   ├── logger/                        # slog + lumberjack
│   ├── scheduler/
│   ├── thaidate/                      # parse/format วันที่ไทย พ.ศ.
│   ├── phone/                         # normalize เบอร์
│   └── geo/                           # haversine
└── migrations/
```

## 3. Domain Models

| Model | Key Fields | หมายเหตุ |
|---|---|---|
| **LineGroup** | ID, GroupID (unique), Name, IsActive, JoinedAt, LeftAt | รองรับหลายกลุ่ม/หลายทีมในอนาคต |
| **SalesRep** | ID, LineUserID (unique), LineDisplayName, Nickname, Area, IsActive | แอดมินผูกชื่อจริง/พื้นที่ |
| **LineEvent** (raw) | ID, WebhookEventID (unique), Type, GroupID, UserID, MessageID, MessageType, QuotedMessageID, Payload (jsonb), EventTime, ProcessStatus, Error | **เก็บทุก event** — แหล่งความจริง |
| **MediaFile** | ID, MessageID, LineEventID, Kind, ImageSetID, ImageSetIndex, ImageSetTotal, R2Key, Status (pending/stored/failed), ReportID? | |
| **Contact** | ID, PhoneNormalized (index), Name, Type (owner/contractor/other), FirstSeenAt | ลูกค้าเก่า/ใหม่ = มี contact นี้มาก่อนไหม |
| **Site** (หน้างาน) | ID, SiteCode (`690825-01`, unique), OwnerRepID, Lat, Lng, Address, Tambon, Amphoe, Province, Status (following/won/lost/cancelled), LostReason, Competitor, DecisionMaker, Stage, ExpectedOrderDate, NextFollowUpDate, FollowUpCount, LastReportedAt, FirstReportedAt, IsCustomerNew, MergedIntoID? | |
| **SiteContact** | SiteID, ContactID, Role | many-to-many (หน้างานเดิมเจอช่างใหม่) |
| **SiteReport** | ID, SiteID?, RepID, Kind (new/follow_up), RawText, Parsed (jsonb), ParseConfidence, MatchMethod (quote/code/phone/geo/manual), TextMessageID, ReportedAt, DeletedAt | 1 ครั้งที่เซลล์รายงาน |
| **ReportBundle** | ID, RepID, GroupID, OpenedAt, ClosedAt, State | ผูก text + media + location |
| **ReviewItem** | ID, Kind (unmatched/geo_conflict/orphan_media/parse_low/other_rep_site), RefIDs (jsonb), Suggestion (jsonb), Status, ResolvedBy, ResolvedAt | คิวรอตรวจ |
| **BotReply** | ID, LineEventID, ReplyText, SentAt, Error | audit |
| **AdminUser** | ID, Email, PasswordHash, Role | login dashboard |
| **AppConfig** | Key, Value | geo radius, bundle window, reply mode, ... |

## 4. Endpoints

### Webhook
```
POST /webhook/line                       # middleware: LineSignature (HMAC-SHA256 ด้วย Channel Secret)
```

### Admin (`/api/v1/admin`, JWT)
```
POST /auth/login
GET  /sites                ?status&rep&amphoe&from&to&q     # รายการหน้างาน
GET  /sites/:id                                          # รายละเอียด + timeline reports + รูป + แผนที่
PATCH /sites/:id                                         # แก้สถานะ/ฟิลด์
POST /sites/:id/merge      {into_site_id}
GET  /reports              ?rep&from&to
PATCH /reports/:id/site    {site_id}                     # ย้าย report ไป site อื่น
GET  /followups/due        ?date&rep                     # ครบกำหนด / เลยกำหนด
GET  /review-queue
POST /review-queue/:id/resolve {action: link|create|ignore, site_id?}
GET  /sales-reps           PUT /sales-reps/:id
GET  /groups
GET  /analytics/summary    ?period=day|month|year&from&to&rep&area
GET  /analytics/lost-reasons
GET  /analytics/by-area
GET  /export/excel         ?from&to&rep                  # รูปแบบคอลัมน์ตาม Excel เดิม
POST /import/excel
POST /maintenance/reparse  ?from&to
GET  /media/:id                                          # redirect → presigned R2 URL
GET  /health
```

## 5. Flow การประมวลผล 1 webhook

```
POST /webhook/line
 ├─ LineSignature middleware  (ไม่ผ่าน → 401)
 ├─ WebhookIngestService.Ingest(events)
 │    ├─ INSERT line_events ... ON CONFLICT (webhook_event_id) DO NOTHING
 │    └─ queue.Push(event_id)
 └─ 200 OK   (< 100ms)

Worker: EventProcessor
 ├─ message/image|video  → MediaService.Fetch → R2 → Bundler.Attach
 ├─ message/location     → Bundler.Attach (lat/lng/address)
 ├─ message/text
 │    ├─ เป็นรายงาน? (มี key หน้างาน/ติดตาม หรือ quote รายงานเดิม)
 │    │    ├─ reportparser.Parse(text)
 │    │    ├─ Bundler.Open(report)
 │    │    ├─ SiteMatching.Match(parsed, quote, code, phone)   # geo จับคู่ซ้ำอีกรอบเมื่อ location มา
 │    │    ├─ save Site/Report (transaction)
 │    │    └─ ReplyService.Reply(replyToken, result)            # ถ้าเปิด reply mode
 │    └─ ไม่ใช่ → จบ (เก็บ raw แล้ว)
 ├─ unsend  → soft delete report / media
 ├─ edit    → re-parse report เดิม
 ├─ join/leave/memberJoined/memberLeft → LineGroup / SalesRep
 └─ ensure SalesRep: ถ้า userId ใหม่ → GetGroupMemberProfile → สร้าง SalesRep (รอแอดมินตั้งชื่อ)

Bundler.Close (timeout 10 นาที)
 └─ ถ้ามี location → SiteMatching.ReMatchByGeo → อาจย้าย/สร้าง ReviewItem
```

## 6. Port Interfaces (ตัวอย่าง)

```go
// domain/ports/line.go
type LineMessenger interface {
    Reply(ctx context.Context, replyToken string, msgs []OutMessage) error
    Push(ctx context.Context, to string, msgs []OutMessage) error
    GetGroupMemberProfile(ctx context.Context, groupID, userID string) (*LineProfile, error)
    GetGroupSummary(ctx context.Context, groupID string) (*GroupSummary, error)
}

type LineContentFetcher interface {
    Fetch(ctx context.Context, messageID string) (io.ReadCloser, string /*contentType*/, error)
}

// domain/ports/storage.go
type ObjectStorage interface {
    Put(ctx context.Context, key string, r io.Reader, contentType string) error
    PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error)
}

// domain/ports/extractor.go  (optional)
type ReportExtractor interface {
    Extract(ctx context.Context, text string) (*reportparser.ParsedReport, error)
}
```

## 7. Key Architectural Decisions

1. **Raw first, parse later** — `line_events` คือแหล่งความจริง ทุกอย่างอื่น rebuild ได้ (`cmd/reparse`)
2. **Site ≠ Report** — หน้างาน 1 ที่มีหลายครั้งรายงาน (เหมือน Order ≠ Delivery ในระบบเดิม)
3. **Idempotency** — unique `webhook_event_id`, hash ข้อความซ้ำ
4. **ตอบ webhook เร็ว** — งานหนักไป worker
5. **Port/Adapter** — LINE, R2, LLM อยู่หลัง interface → test ด้วย mock ได้ และเปลี่ยน storage ได้
6. **Parser เป็น pure package** — เขียน test จากข้อความจริงในกลุ่ม ป้องกัน regression
7. **Human-in-the-loop** — ไม่เดาเมื่อไม่ชัวร์ → ReviewItem
8. **เวลาเก็บเป็น UTC** แสดงผลเป็น Asia/Bangkok + ปี พ.ศ.
