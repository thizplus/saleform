# 05 — จำลองบน Docker Desktop + Cloudflare Tunnel + R2

> **แยกหน้าที่ให้ชัด:**
> - **Cloudflare Tunnel** = เปิดโดเมน HTTPS จริง (เช่น `lineapi.yourdomain.com`) ให้ LINE ยิง webhook เข้าเครื่อง local ได้ — LINE บังคับ webhook เป็น HTTPS
> - **Cloudflare R2** = ที่เก็บรูปหน้างาน (S3-compatible) — ไม่ได้ใช้เปิดโดเมนรับ webhook

ใช้วิธีเดียวกับ `_FOOD_DELIVERY/____system_docs/15_LOCAL_DEV_CLOUDFLARE_TUNNEL.md`

## 1. Architecture (local)

```
LINE Platform
    │ HTTPS POST /webhook/line
    ▼
Cloudflare (lineapi.yourdomain.com)
    │ Tunnel
    ▼
Docker Desktop
 ├── linedata_cloudflared    → http://api:9100
 ├── linedata_api            (Go Fiber :9100)  ──► Cloudflare R2 (bucket: line-sales-media)
 ├── linedata_postgres       (:5432 internal)
 ├── linedata_redis          (:6379 internal)
 └── linedata_admin          (Vite :9101)  ← linedata-admin.yourdomain.com  (เฟส 2)
```

## 2. docker-compose.yml (โครง)

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4-alpine     # หรือ postgres:16-alpine ถ้าไม่ใช้ PostGIS
    container_name: linedata_postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      TZ: Asia/Bangkok
    volumes: [pgdata:/var/lib/postgresql/data]
    ports: ["127.0.0.1:5433:5432"]           # 5433 กันชนกับ deli2you_postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s

  redis:
    image: redis:7-alpine
    container_name: linedata_redis
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--appendonly", "yes"]
    volumes: [redisdata:/data]
    ports: ["127.0.0.1:6380:6379"]

  api:
    build: ./_gofiber
    container_name: linedata_api
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_started }
    ports: ["127.0.0.1:9100:9100"]

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: linedata_cloudflared
    command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}
    depends_on: [api]

volumes:
  pgdata:
  redisdata:
```

> พอร์ตทั้งหมดตั้งไม่ให้ชนกับ stack `deli2you_*` ที่อาจรันอยู่บนเครื่องเดียวกัน

## 3. .env

```bash
APP_PORT=9100
APP_ENV=development
TZ=Asia/Bangkok

DB_USER=postgres
DB_PASSWORD=localdev123
DB_NAME=db_line_sales
DB_HOST=postgres
DB_PORT=5432

REDIS_ADDR=redis:6379
REDIS_PASSWORD=localdev123

JWT_SECRET=<32+ chars>

# LINE Messaging API (จาก LINE Developers Console)
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_REPLY_MODE=always        # always | on_problem | off

# Cloudflare R2
S3_BUCKET=line-sales-media
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
S3_REGION=auto

# Cloudflare Tunnel
CF_TUNNEL_TOKEN=

# Business config
BUNDLE_WINDOW_MIN=10
BUNDLE_LOOKBACK_MIN=5
SITE_GEO_RADIUS_M=150

# Optional LLM
LLM_PROVIDER=none             # none | claude | gemini
CLAUDE_API_KEY=
```

## 4. Cloudflare Tunnel

1. Cloudflare Dashboard → **Zero Trust → Networks → Tunnels → Create tunnel** (cloudflared)
2. คัดลอก **token** ใส่ `CF_TUNNEL_TOKEN`
3. **Public Hostname:** `lineapi.yourdomain.com` → Service `http://api:9100` (ชื่อ service ใน compose)
4. `docker compose up -d` → ทดสอบ `curl https://lineapi.yourdomain.com/health`

> ถ้ามี tunnel ของ deli2you อยู่แล้ว จะเพิ่ม public hostname ใน tunnel เดิมก็ได้ แต่ต้องชี้ไป `host.docker.internal:9100` แทน (คนละ compose network)

## 5. Cloudflare R2

1. R2 → Create bucket `line-sales-media` (private)
2. Manage R2 API Tokens → Object Read & Write เฉพาะ bucket นี้ → ได้ Access Key / Secret
3. Key รูป: `media/{yyyy}/{mm}/{groupId}/{messageId}.jpg`
4. dashboard เปิดรูปผ่าน `GET /api/v1/admin/media/:id` → presigned URL (อายุ 10–30 นาที) — ไม่เปิด bucket public เพราะเป็นข้อมูลลูกค้า

## 6. ตั้งค่า LINE ให้ชี้มาที่ Tunnel

LINE Developers Console → Channel (Messaging API) →
- Webhook URL: `https://lineapi.yourdomain.com/webhook/line` → กด **Verify** (ต้องได้ 200)
- **Use webhook: ON**
- **Webhook redelivery: ON**
- **Allow bot to join group chats: ON**

LINE Official Account Manager → การตอบกลับ (Response settings) →
- **ปิด** ข้อความตอบกลับอัตโนมัติ (auto-reply) และข้อความทักทาย — กันข้อความเด้งเข้ากลุ่มเซลล์
- Webhook: เปิด

## 7. ลำดับทดสอบ

1. สร้าง **กลุ่มทดสอบ** (มือถือ 2–3 เครื่อง) → เชิญ OA → ดู `join` event ใน `line_events`
2. ส่งข้อความตัวอย่างจากรูป 01/02 (คัดลอกจริง) + รูป + location → ตรวจ report/site/R2
3. ทดสอบ: follow-up ด้วย "ตอบกลับ", รหัสงาน, เบอร์ซ้ำ, location ใกล้กันคนละเบอร์, unsend, edit, ส่งรูปก่อน text, 2 คนส่งพร้อมกัน
4. ปิด API ชั่วคราว → ส่งข้อความ → เปิดใหม่ → ตรวจว่า redelivery เข้ามาและไม่ซ้ำ
5. ผ่านแล้วค่อยเชิญ OA เข้ากลุ่มจริง

> ข้อควรระวัง: ตอน local ถ้าเครื่องปิด/หลับ webhook จะล้ม (redelivery ช่วยได้ระยะหนึ่ง แต่ไม่การันตี) — ใช้งานจริงควรย้ายขึ้น VPS/เซิร์ฟเวอร์ที่เปิด 24 ชม.
