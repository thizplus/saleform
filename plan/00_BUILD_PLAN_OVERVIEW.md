# 00 — แผนการสร้างระบบ (Overview)

> แผนนี้ **อัปเดตแนวทางจาก `docs/`** — เปลี่ยนเป็น **LIFF เป็นช่องทางหลัก** (ข้อมูลเป็นฟิลด์ 100%) และ **webhook อ่านข้อความเป็นช่องทางสำรอง** สำหรับเซลล์ที่ยังพิมพ์แบบเดิม

## 1. ภาพรวมระบบ

```
กลุ่ม LINE ธรรมดา "UP เซลล์ทีม"
 ├─ ประกาศกลุ่ม: 📋 รายงานหน้างาน → https://liff.line.me/{liffId}
 ├─ LINE OA (bot) เป็นสมาชิกกลุ่ม → webhook เก็บทุกข้อความ (raw)
 │
 │ เซลล์กดลิงก์ → LIFF (Vite React TS) เด้งทับห้องกลุ่ม
 │   ├─ ① POST API → บันทึก Site / Report / รูป (R2)
 │   └─ ② liff.sendMessages(flex) → การ์ดสรุปขึ้นในกลุ่ม "ในชื่อเซลล์" (ฟรี)
 ▼
Go Fiber API (Clean Architecture) ── PostgreSQL / Redis / Cloudflare R2
 ▲
 └─ Admin Dashboard (Vite React TS) — หน้างาน, คิวรอตรวจ, KPI, Export Excel
```

## 2. โครงสร้าง Repository

```
___LINE_DATA/
├── _gofiber/              # Backend API (Go Fiber, Clean Architecture)
├── _liff/                 # LIFF สำหรับเซลล์ (Vite + React + TS)
├── _admin/                # Admin dashboard (Vite + React + TS) — เฟส 2
├── docker/                # cloudflared config, init SQL
├── docker-compose.yml
├── .env.example
├── docs/                  # การวิเคราะห์ (เดิม)
├── plan/                  # แผนนี้
└── requirement/
```

แยก `_liff` กับ `_admin` เป็นคนละแอป เพราะ: LIFF ต้อง init LIFF SDK + เน้นมือถือ/เบา ส่วน admin เป็น desktop + กราฟ/ตาราง หนัก — แต่ใช้ convention เดียวกับ `_FOOD_DELIVERY/_vite` (features/, lib/api-client.ts, shadcn, React Query)

## 3. เอกสารในโฟลเดอร์นี้

| ไฟล์ | เนื้อหา |
|---|---|
| `01_BACKEND_GOFIBER_PLAN.md` | กฎ Clean Architecture, โครงโฟลเดอร์, models, ขั้นตอนสร้าง B0–B10 |
| `02_LIFF_VITE_PLAN.md` | โครง LIFF, หน้าจอ, ฟอร์ม, sendMessages, ขั้นตอนสร้าง L0–L7 |
| `03_API_CONTRACT.md` | สัญญา API ระหว่าง LIFF/Admin ↔ Backend (request/response) |
| `04_ADMIN_VITE_PLAN.md` | Admin dashboard (เฟส 2) |

## 4. Milestones

| Milestone | ขอบเขต | Backend | LIFF / Admin | ประมาณ |
|---|---|---|---|---|
| **M1 — Foundation** | โปรเจกต์รันบน Docker + Tunnel, webhook เก็บ raw ครบ, OA เข้ากลุ่มทดสอบได้ | B0–B3 | L0 (LIFF hello + sendMessages test) | 2–3 วัน |
| **M2 — LIFF MVP** | เซลล์รายงานงานใหม่ + follow-up ผ่าน LIFF, รูปลง R2, การ์ดขึ้นกลุ่ม, งานของฉัน/ต้องตามวันนี้ | B4–B6 | L1–L6 | 4–6 วัน |
| **M3 — Admin & Excel** | dashboard หน้างาน/รายงาน, จัดการเซลล์, export/import Excel ตามชีทเดิม | B8 | Admin A1–A4 | 4–5 วัน |
| **M4 — Text fallback + KPI** | parser ข้อความที่พิมพ์ในกลุ่ม + คิวรอตรวจ, KPI/กราฟ, scheduler แจ้งเตือน | B7, B9 | Admin A5–A6 | 4–5 วัน |
| **M5 — Production** | ย้ายขึ้น VPS, backup, monitoring, tests | B10 | build/deploy | 1–2 วัน |

**ส่งให้ลูกค้าทดลองได้ตั้งแต่จบ M2** (เซลล์ใช้งานจริงได้ + export Excel ชั่วคราวผ่าน endpoint)

## 5. การตัดสินใจหลัก (Key Decisions)

1. **LIFF-first, webhook-fallback** — ข้อมูลหลักมาจากฟอร์ม, webhook เก็บ raw ทุกข้อความไว้เสมอ
2. **Site ≠ Report** — หน้างาน 1 ที่มีหลายครั้งรายงาน (งานใหม่ + follow-up)
3. **รหัสงาน `YYMMDD-NN` (พ.ศ.)** — ตรงกับคอลัมน์ NO. ใน Excel เดิม
4. **Auth LIFF ด้วย ID Token** → backend verify กับ LINE → ออก JWT ของเราเอง; อนุญาตเฉพาะคนที่เป็นสมาชิกกลุ่มเซลล์ที่ลงทะเบียน
5. **LINE Login channel (LIFF) + Messaging API channel อยู่ Provider เดียวกัน** → `userId` ตรงกันทั้ง LIFF และ webhook
6. **Backend สร้าง Flex Message** แล้วส่งให้ LIFF ไป `sendMessages` → หน้าตาการ์ดคุมที่เดียว
7. **รูปใน Flex ต้องเป็น URL public HTTPS ถาวร** → ใช้ R2 public custom domain เฉพาะ prefix `thumb/` (key สุ่มเดาไม่ได้) ส่วนรูปเต็มเป็น private + presigned
8. **เวลาเก็บ UTC** แสดงผล Asia/Bangkok + ปี พ.ศ.
9. **Clean Architecture แบบเข้มกว่า deli2you** — handler เรียกได้แค่ service, ไม่มี repository ใน handler (ดู 01)

## 6. สิ่งที่ต้องคอนเฟิร์มก่อนเริ่ม M2

- [ ] ฟิลด์ในฟอร์ม + ตัวเลือก dropdown (ขั้นตอนงาน, ประเภทลูกค้า, สาเหตุจบที่อื่น, คู่แข่ง)
- [ ] ฟิลด์บังคับขั้นต่ำ (เสนอ: หน้างาน, เบอร์ หรือ ชื่อ อย่างน้อย 1, ตำแหน่ง, รูป ≥1, ตามต่อ)
- [ ] หน้าตาการ์ดที่ขึ้นในกลุ่ม (มีรูปหรือไม่)
- [ ] ชื่อ OA / โดเมน (`api.xxx`, `liff.xxx`, `admin.xxx`, `img.xxx`)

## 7. Definition of Done (ต่อ milestone)

- โค้ดผ่าน `go vet`, `golangci-lint`, `go test ./...` / `tsc -b`, `eslint`
- Unit test: domain logic (site code, thaidate, phone, parser, matching)
- ทดสอบจริงในกลุ่มทดสอบบนมือถือ Android + iOS
- อัปเดตเอกสาร `docs/` / `plan/` ตามที่เปลี่ยน
