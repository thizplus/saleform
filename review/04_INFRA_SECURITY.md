# 04 — Infra / Security Review

## P0
### 1. Secrets
- `_gofiber/.env.example` มี **R2 Account ID + Access Key + Secret จริง** → ไฟล์ `.example` มีไว้แชร์/commit
  1. Cloudflare → R2 → Manage API Tokens → **ลบ token นี้ แล้วออกใหม่** (ถือว่าหลุดแล้ว)
  2. ใส่ค่าใหม่ใน `.env` เท่านั้น, `.env.example` ให้เป็นค่าว่าง
- `LINE_LOGIN_CHANNEL_ID`, `VITE_LIFF_ID` ไม่ใช่ความลับ ใส่ใน example ได้
- `SETUP_TUNNEL.md` เขียนรหัส admin `admin@puekk.com / admin1234` → ลบออก และเปลี่ยนรหัสหลัง seed

### 2. ยังไม่มี git
- `___LINE_DATA` ไม่เป็น git repo → ไม่มีประวัติ ย้อนกลับไม่ได้
- `git init` ที่ root + `.gitignore` root:
  ```
  .env
  **/.env
  !**/.env.example
  node_modules/
  dist/
  logs/
  *.exe
  Gemini_Generated_Image_*.jpg
  ```
- ⚠️ `.gitignore` ของ `_liff`/`_admin` (template Vite) **ไม่ ignore `.env`** — ตอนนี้ไม่มีความลับในนั้น แต่ควรเพิ่มกันพลาด

### 3. CORS / URL ระหว่าง 3 แอป
| แอป | เปิดที่ | ต้องเรียก API ที่ | ต้องอยู่ใน `CORS_ORIGINS` |
|---|---|---|---|
| LIFF | `https://liff.puekk.com` (endpoint ของ LIFF) | `https://lineapi.puekk.com/api/v1` | `https://liff.puekk.com` |
| Admin | `https://admin-line.puekk.com` | `https://lineapi.puekk.com/api/v1` | `https://admin-line.puekk.com` |
- `https://liff.line.me` ไม่ใช่ origin ของหน้า LIFF (เป็นแค่ลิงก์ที่ redirect) — ใส่ไว้ไม่มีผล
- Vite dev ผ่าน tunnel ต้องตั้ง `server.allowedHosts: ['liff.puekk.com']` (และ `admin-line.puekk.com`) และ HMR `clientPort: 443` — ตรวจ `vite.config.ts` ของทั้ง 2 แอป

## P1 — docker-compose
| จุด | ปัญหา | แก้ |
|---|---|---|
| postgres `ports: "5432:5432"` | เปิดทุก interface + ชนกับ `deli2you_postgres` ถ้ารันพร้อมกัน | `"127.0.0.1:5433:5432"` |
| redis `ports: "6379:6379"` ไม่มีรหัส | เปิดทุก interface | `127.0.0.1:6380:6379` + `--requirepass` (หรือถอด Redis ถ้ายังไม่ใช้) |
| api | ไม่มี `restart`, `healthcheck` | `restart: unless-stopped` + healthcheck `/health` |
| migrate | api AutoMigrate เองทุกครั้ง | service `migrate` รัน `/bin/migrate` ก่อน api (`depends_on: condition: service_completed_successfully`) |
| ไม่มี `container_name`/project name | ชื่อ container ชนกับ project อื่นได้ | `name: line-sales` บนสุดของ compose |
| LIFF/Admin dev รันนอก docker ผ่าน `host.docker.internal` | OK สำหรับ dev | production: build static → nginx container (`Dockerfile` + `nginx.conf` แบบ `_vite`) |
| Postgres backup | ไม่มี | cron `pg_dump` รายวัน → R2 (bucket แยก) |

## P1 — Security อื่น ๆ
- `JWT_SECRET` ต้องสุ่ม ≥ 32 ตัว (`openssl rand -hex 32`), ห้ามใช้ค่า default
- Admin login: rate limit + lockout หลายครั้งผิด
- Logs: gorm Info log พิมพ์ SQL พร้อมเบอร์โทรลูกค้า → ลดเป็น Warn
- ข้อมูลส่วนบุคคล (ชื่อ/เบอร์ลูกค้า) → แจ้งทีมขายว่าระบบเก็บข้อมูล, จำกัดสิทธิ์ viewer
- รูปหน้างานใน bucket public (`r2.dev`) → ดู 01 P0-6

## สิ่งที่ต้องเตรียมเพิ่ม (Production)
- โดเมนจริง 3 ตัว (API / LIFF / Admin) + 1 สำหรับรูป (`img.`) ถ้าแยก public bucket
- เปลี่ยน LIFF Endpoint URL จาก dev server เป็น build static
- VPS หรือเครื่องที่เปิด 24 ชม. (เครื่อง dev ปิด = ระบบใช้ไม่ได้)
