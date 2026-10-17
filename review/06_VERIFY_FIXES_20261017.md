# 06 — ตรวจผลการแก้ 13 จุด (17 ต.ค. 2569 เย็น)

ตรวจจากโค้ดจริงในโฟลเดอร์ ไม่ได้อ้างอิงจากสรุปของเครื่องมือที่แก้

## ผล build
| โปรเจกต์ | ผล |
|---|---|
| `_gofiber` | ✅ `go build` + `go vet` ผ่าน |
| `_liff` | ❌ `tsc -b` exit 2 — TS5101 `baseUrl` ยังอยู่ใน `tsconfig.app.json` (ถ้ารันแค่ `vite build` จะผ่านเพราะ Vite ไม่ type-check แต่ `npm run build` = `tsc -b && vite build` ไม่ผ่าน) |
| `_admin` | ❌ เหมือนกัน |

## ตรวจทีละข้อ
| # | ที่อ้างว่าแก้ | ผลตรวจ | หมายเหตุ |
|---|---|---|---|
| 1 | Role middleware strict | ✅ | sales → `/liff/*` เท่านั้น, viewer GET เท่านั้น — ยังควรเพิ่ม `jwt.WithValidMethods([]string{"HS256"})` |
| 2 | เซลล์ใหม่ = pending | ⚠️ บางส่วน | backend ✅ แต่ **LIFF ยังไม่มีหน้า "รออนุมัติ"** → เซลล์เห็นแค่ "เข้าสู่ระบบไม่สำเร็จ"; เซลล์ที่ถูกสร้างเป็น `active` ไปก่อนหน้านี้ยัง active อยู่ใน DB |
| 3 | IdempotencyKey → `*string` + index | ⚠️ | โค้ดถูก แต่ **AutoMigrate ไม่ลบ unique index เดิม** (ชื่อ `idx_site_reports_idempotency_key` เหมือนกัน → GORM ข้าม) — ถ้า DB เคยรันแล้วต้อง drop เอง (ดูด้านล่าง) |
| 4 | Contact.Phone เลิก unique | ⚠️ | เหมือนข้อ 3 — index `idx_contacts_phone` เดิมยังเป็น UNIQUE ใน DB |
| 5 | NextCode `RETURNING` | ✅ | atomic แล้ว (ยังเรียกนอก transaction → อาจมีเลขข้ามได้ ไม่ร้ายแรง) |
| 6 | Recover middleware ตัวแรก | ✅ | แต่ `defaultErrorHandler` ใน `main.go` ยังคืน `err.Error()` ให้ client |
| 7 | CORS เพิ่ม `liff.puekk.com` | ✅ | |
| 8 | Vite `allowedHosts` | ✅ | ทั้ง 2 แอป (ยังไม่มี `hmr.clientPort: 443` → hot reload ผ่าน tunnel อาจไม่ทำงาน ไม่กระทบการใช้งาน) |
| 9 | รูปคืน URL | ⚠️ บางส่วน | `FullURL` ใช้ได้ แต่ **ไม่เคยสร้างไฟล์ thumb จริง** → `thumbUrl` ชี้ไฟล์ที่ไม่มี (404) และ LIFF ใช้ `thumbUrl \|\| fullUrl` → รูปยังแตกเพราะ thumbUrl ไม่ว่าง; แก้เร็ว: ให้ `ThumbURL` = URL รูปเต็มไปก่อน จนกว่าจะทำ resize จริง |
| 10 | SeedAdmin เฉพาะ development | ✅ บางส่วน | ย้ายไป DI แล้ว แต่ `.env` เป็น `APP_ENV=development` และ `SETUP_TUNNEL.md` ยังเขียนรหัส `admin1234` → ถ้าเปิด tunnel สาธารณะใครก็ login admin ได้ด้วยรหัสนี้ เปลี่ยนรหัสทันทีหลัง login ครั้งแรก |
| 11 | VITE_API_URL = localhost "tunnel จัดการ routing" | ❌ **เข้าใจผิด** | โค้ด LIFF รันใน **มือถือ** → `localhost` คือมือถือเอง ไม่ใช่เครื่องคุณ tunnel ช่วยไม่ได้ ต้องเป็น `https://lineapi.puekk.com/api/v1` (ใช้ localhost ได้เฉพาะตอนเปิดบน browser เครื่องเดียวกัน) |
| 12 | DueToday ใช้ total | ✅ | |
| 13 | R2 key ย้ายออกจาก `.env.example` | ❌ **ไม่ได้แก้** | `.env.example` ยังมี Access Key + Secret จริง → ลบค่าออก และ **ต้อง rotate token ที่ Cloudflare** เพราะถือว่าหลุดแล้ว |

## สิ่งที่สร้างเพิ่มแต่ยังไม่ได้ใช้
- `domain/services/rep_service.go`, `group_service.go`, `options_service.go` + DTO — มีแค่ interface **ไม่มี implementation** และ handler ยังใช้ repository ตรงเหมือนเดิม (Clean Architecture ข้อนี้ยังไม่เสร็จ)

## คำสั่งล้าง unique index เดิม (ถ้า DB เคยรันมาแล้ว)
```sql
DROP INDEX IF EXISTS idx_contacts_phone;
DROP INDEX IF EXISTS idx_site_reports_idempotency_key;
-- แล้ว restart api ให้ AutoMigrate สร้าง index ธรรมดาใหม่
-- ตรวจ: SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('contacts','site_reports');
```
หรือถ้ายังไม่มีข้อมูลจริง: `docker compose down -v` แล้วขึ้นใหม่

## ยังค้างจากรีวิวรอบแรก (P0/P1 ที่ยังไม่แตะ)
- TS5101 → build frontend ไม่ผ่าน
- อำเภอ/ตำบล, วันคาดการณ์สั่งของ
- Idempotency-Key ยังไม่ถูกส่ง/ตั้งค่า
- `today` แบบ UTC, `acos` clamp, phone `+66`, ownership รูป, validate upload
- Admin: Dashboard/KPI, หน้ารายละเอียด, Export Excel
