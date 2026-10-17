# Review — `_gofiber` / `_liff` / `_admin` (17 ต.ค. 2569)

## ภาพรวม

โครงทั้ง 3 ตัว **มาถูกทางและตรงตามแผน**: backend แยกชั้น domain / application / infrastructure / interfaces, มี TxManager ผ่าน context, LIFF มี flow ครบ (ตรวจซ้ำ → อัปโหลดรูป → สร้างงาน → `sendMessages` → หน้า success), admin มี login / รายการหน้างาน / เซลล์ / ตัวเลือก

แต่ **ยังไม่พร้อมให้เซลล์ใช้จริง** — มีบั๊กที่ทำให้บันทึกงานที่ 2 ไม่ได้, มีช่องโหว่ให้คนนอกเข้าถึงข้อมูลลูกค้า, และรูป/การเรียก API จากมือถือยังไม่ทำงาน

## ผลการตรวจอัตโนมัติ

| โปรเจกต์ | คำสั่ง | ผล |
|---|---|---|
| `_gofiber` | `go build ./...` + `go vet ./...` (Go 1.24) | ✅ ผ่าน (ทดสอบใน workspace ของผม — เครื่องคุณไม่มี Go ติดตั้งใน shell ที่ผมใช้) |
| `_liff` | `tsc -b` | ❌ exit 2 — `TS5101: Option 'baseUrl' is deprecated` (TypeScript 6) → **`npm run build` ไม่ผ่าน** |
| `_admin` | `tsc -b` | ❌ เหมือนกัน |
| ทั้งหมด | unit test | ไม่มี test เลย |

## ต้องแก้ก่อนทดสอบกับเซลล์จริง (P0)

| # | ปัญหา | ที่ไหน | ผลกระทบ |
|---|---|---|---|
| 1 | **คีย์ R2 จริงอยู่ใน `.env.example`** และโปรเจกต์ยังไม่มี git | `_gofiber/.env.example` | ถ้าไฟล์หลุด ใครก็อ่าน/เขียน/ลบ bucket ได้ → **rotate R2 API token ทันที** แล้วเปลี่ยนเป็นค่าว่าง |
| 2 | **token ของเซลล์เรียก API admin ได้** | `middleware/auth.go` | เซลล์คนไหนก็แก้หน้างาน/เปิดปิดบัญชีคนอื่นได้ |
| 3 | **ใครมี LINE ก็เข้า LIFF ได้ทันที** (สร้างเป็น `active`) | `auth_service.go` `LIFFAuth` | คนนอกที่ได้ลิงก์ เห็นชื่อ+เบอร์ลูกค้าทั้งหมด |
| 4 | **`SiteReport.IdempotencyKey` เป็น unique แต่ไม่เคยถูกตั้งค่า** → ทุกแถวเป็น `''` | `models/site_report.go` | **สร้างรายงานได้แค่ 1 รายการทั้งระบบ** รายการที่ 2 ชน unique |
| 5 | **`Contact.Phone` เป็น unique** | `models/contact.go` | ช่างคนเดียวมีหลายหน้างานไม่ได้ / กด "เป็นหน้างานใหม่" (forceNew) แล้ว error |
| 6 | เลขรหัสงาน `NextCode` ไม่ atomic (upsert แล้วค่อย SELECT) | `site_code_counter_repo.go` | 2 คนกดพร้อมกันได้รหัสซ้ำ → สร้างงานล้ม |
| 7 | **LIFF บนมือถือเรียก API ไม่ได้** — `VITE_API_URL=http://localhost:9100` และ CORS ไม่มี origin ของ LIFF (`https://liff.puekk.com`) | `_liff/.env`, `_gofiber/.env` | ฟอร์มใช้ไม่ได้เลยบนมือถือ |
| 8 | **รูปไม่แสดง** — API คืน storage key (`thumbs/xxx.jpg`) แทน URL และไม่เคยสร้าง thumbnail จริง | `site_service.go` `GetByCode`, `upload_service.go` | หน้ารายละเอียดรูปแตกทั้งหมด |
| 9 | ไม่มี `recover` middleware | `cmd/api/main.go` | panic ครั้งเดียว server ล่ม |
| 10 | `tsc` TS5101 | `tsconfig.app.json` ทั้ง 2 แอป | build production ไม่ได้ |

## ควรแก้ก่อนเปิดใช้จริง (P1) — สรุป

- **อำเภอ/ตำบลไม่เคยถูกบันทึก** → รายงานแยกตามพื้นที่ (ความต้องการข้อ 3 ในรูป 04) ทำไม่ได้
- **วันคาดการณ์สั่งของ** ฟอร์มส่ง `''` ตายตัว (ความต้องการในรูป 04)
- นับ "ต้องตามวันนี้" ผิด (ได้สูงสุด 1) และใช้วันแบบ UTC (ผิดช่วง 00:00–07:00)
- ตรวจซ้ำด้วยตำแหน่งอาจ error เงียบ ๆ เมื่อพิกัดตรงกันเป๊ะ (`acos` > 1)
- ไม่มี Idempotency-Key → กดซ้ำ/เน็ตหลุดได้งานซ้ำ
- Error ทุกชนิดตอบ 400 พร้อมข้อความภายใน, ไม่มี domain errors
- Clean Architecture ยังรั่วหลายจุด (handler ใช้ repository, service import infrastructure, SeedAdmin รหัส `admin1234` อยู่ใน handler)
- Admin ยังขาด: Dashboard/KPI, หน้ารายละเอียดงาน (รูป/timeline), Export Excel, อนุมัติเซลล์ใหม่, สิทธิ์ viewer

รายละเอียดทุกข้อ + วิธีแก้อยู่ในไฟล์ถัดไป

| ไฟล์ | เนื้อหา |
|---|---|
| `01_GOFIBER_REVIEW.md` | backend ทั้งหมด |
| `02_LIFF_REVIEW.md` | LIFF |
| `03_ADMIN_REVIEW.md` | Admin + สิ่งที่ยังขาดตาม requirement |
| `04_INFRA_SECURITY.md` | secrets, git, docker, tunnel, CORS, deploy |
| `05_FIX_ORDER.md` | ลำดับการแก้แนะนำ (checklist) |

## ข้อตัดสินใจที่ควรทำก่อนแก้
- **จะใช้ OA/webhook ต่อไหม** — ถ้าไม่ใช้ (LIFF อย่างเดียว) ลบ `webhook_service`, `line_event`, `line_group`, `review_item`, `bundle` ออกได้ทั้งชุด ลดโค้ดที่ต้องดูแล; แต่ต้องเปลี่ยนการยืนยันตัวเซลล์เป็น **แอดมินอนุมัติ** (ข้อ P0-3)
