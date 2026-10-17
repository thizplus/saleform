# 03 — API Contract (v1)

Base: `https://api.<domain>/api/v1`
Response format เดียวกับ deli2you:

```jsonc
// success
{ "success": true, "data": { ... } }
// paginated
{ "success": true, "data": [ ... ], "meta": { "total": 120, "page": 1, "limit": 20, "totalPages": 6, "hasNext": true, "hasPrev": false } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { "phone": ["required"] } } }
```

วันที่ส่ง/รับเป็น ISO `YYYY-MM-DD` (ค.ศ.) — แปลง พ.ศ. ที่ frontend เท่านั้น

---

## Webhook

| Method | Path | Auth |
|---|---|---|
| POST | `/webhook/line` (ไม่มี `/api/v1`) | `X-Line-Signature` |

---

## LIFF (role `sales`)

### `POST /liff/auth`
```json
// req
{ "idToken": "eyJ..." }
// res
{ "token": "jwt...", "expiresAt": "2026-10-24T07:00:00Z",
  "rep": { "id": "uuid", "displayName": "เซลล์ บอม UP Steel", "nickname": "บอม", "pictureUrl": "https://...", "status": "active" } }
```
Errors: `401 INVALID_ID_TOKEN`, `403 NOT_SALES_MEMBER`, `403 REP_INACTIVE`

### `GET /liff/me` → rep profile + counts `{ dueToday, overdue, following }`

### `GET /liff/options`
```json
{ "customerTypes": ["เจ้าของ","ช่าง","ผู้รับเหมา"],
  "decisionMakers": ["เจ้าของบ้าน","ช่าง","อื่นๆ"],
  "stages": ["เทฐาน","ตั้งเสา","ขึ้นโครง","รอมุงหลังคา","..."],
  "lostReasons": ["ราคาแพงกว่า","ช่างมีร้านประจำ","ของไม่พร้อม","..."],
  "competitors": ["กระทิง","..."] }
```

### `GET /liff/sites?tab=due_today|overdue|following|all&q=&page=&limit=`
```json
[{ "id": "uuid", "siteCode": "690825-02", "customerName": "คุณพี", "contractorName": "กวาง",
   "phone": "0847733405", "amphoe": "สูงเนิน", "tambon": "หนองตะไก้",
   "status": "following", "nextFollowUpDate": "2026-10-20", "followUpCount": 4,
   "lastReportedAt": "2026-10-15T03:21:00Z", "thumbUrl": "https://img.<domain>/thumb/..jpg",
   "isMine": true }]
```

### `GET /liff/sites/check-duplicate?phone=&lat=&lng=`
```json
{ "matches": [
  { "siteCode": "690825-02", "reason": "phone", "distanceM": null, "ownerName": "บอม", "status": "following" },
  { "siteCode": "690901-05", "reason": "nearby", "distanceM": 85, "ownerName": "พัช", "status": "following" } ] }
```

### `GET /liff/sites/:code`
```json
{ "site": { "...ฟิลด์ทั้งหมด": "", "lat": 14.97, "lng": 102.09, "address": "...", "mapsUrl": "https://maps.google.com/?q=14.97,102.09" },
  "reports": [ { "id": "uuid", "kind": "follow_up", "note": "ช่างตั้งโครงเสร็จ...", "statusAfter": "following",
                 "nextFollowUpDate": "2026-10-20", "repName": "บอม", "reportedAt": "...",
                 "photos": [ { "thumbUrl": "...", "url": "presigned..." } ] } ],
  "canEdit": true }
```

### `POST /liff/uploads` (multipart `files[]` ≤ 3)
```json
{ "files": [ { "id": "uuid", "thumbUrl": "https://img.<domain>/thumb/...jpg" } ] }
```

### `POST /liff/sites` — งานใหม่ (header `Idempotency-Key`)
```json
// req
{ "phone": "0897165403", "customerName": "คุณสมชาย", "customerType": "เจ้าของ",
  "contractorName": "แคน", "decisionMaker": "เจ้าของบ้าน", "stage": "ขึ้นโครง",
  "detail": "หน้างานนี้...", "lat": 14.97, "lng": 102.09, "address": "90 ซอย 3 ตำบลในเมือง ...",
  "expectedOrderDate": "2026-10-25", "nextFollowUpDate": "2026-10-20",
  "photoIds": ["uuid","uuid"], "forceNew": false }
// res 201
{ "site": { "siteCode": "691017-03", "...": "" }, "report": { "id": "uuid" },
  "flexMessage": { "type": "flex", "altText": "งานใหม่ #691017-03 ช่างแคน", "contents": { } } }
```
Errors: `409 POSSIBLE_DUPLICATE` (มี `details.matches`, ส่ง `forceNew:true` เพื่อยืนยัน), `422 VALIDATION_ERROR`

### `POST /liff/sites/:code/follow-ups` (header `Idempotency-Key`)
```json
// req
{ "note": "รอเจ้าของบ้านกลับ", "status": "following|won|lost|cancelled",
  "nextFollowUpDate": "2026-10-30", "lostReason": null, "competitor": null,
  "stage": "รอมุงหลังคา", "decisionMaker": null, "photoIds": [] }
// res 201
{ "site": { }, "report": { }, "flexMessage": { } }
```
Errors: `403 NOT_SITE_OWNER`, `422 LOST_REASON_REQUIRED`, `422 NEXT_DATE_REQUIRED`

---

## Admin (role `admin`) — เฟส M3/M4

```
POST   /admin/auth/login
GET    /admin/sites               ?status&repId&amphoe&from&to&q&page&limit
GET    /admin/sites/:code
PATCH  /admin/sites/:code
POST   /admin/sites/:code/merge   { intoSiteCode }
GET    /admin/reports             ?repId&from&to
GET    /admin/sales-reps          PATCH /admin/sales-reps/:id  { nickname, area, status }
GET    /admin/groups              PATCH /admin/groups/:id { isSalesGroup }
GET    /admin/options             PUT /admin/options
GET    /admin/review-queue        POST /admin/review-queue/:id/resolve { action, siteCode? }
GET    /admin/analytics/summary   ?period=day|month|year&from&to&repId&amphoe
GET    /admin/analytics/lost-reasons
GET    /admin/analytics/by-area
GET    /admin/export/excel        ?from&to&repId
POST   /admin/import/excel        multipart
GET    /admin/media/:id           → 302 presigned URL
```
