# Cloudflare Tunnel Setup Guide

## ขั้นตอนสร้าง Tunnel

### 1. เข้า Cloudflare Zero Trust Dashboard
- ไปที่ https://one.dash.cloudflare.com
- เลือก Account ที่มี domain puekk.com

### 2. สร้าง Tunnel ใหม่
- Networks > Tunnels > Create a tunnel
- เลือก **Cloudflared**
- ตั้งชื่อ: `line-sales-dev`
- Copy **Tunnel Token** ที่ได้ (ยาวมาก ขึ้นต้นด้วย eyJ...)

### 3. ใส่ Token ใน .env
สร้างไฟล์ `.env` ที่ root (`___LINE_DATA/.env`):
```
TUNNEL_TOKEN=eyJ...token...ที่ copy มา
```

### 4. ตั้ง Public Hostnames (ใน Cloudflare Dashboard)
เพิ่ม 3 routes ใน Tunnel config:

| Public Hostname | Service | หน้าที่ |
|----------------|---------|--------|
| `lineapi.puekk.com` | `http://api:9100` | Backend API + Webhook |
| `liff.puekk.com` | `http://host.docker.internal:5173` | LIFF dev server |
| `admin-line.puekk.com` | `http://host.docker.internal:5174` | Admin dev server |

> **Note**: ใช้ `host.docker.internal` เพราะ Vite dev server รันบนเครื่อง host ไม่ใช่ใน Docker

### 5. รัน
```bash
# Terminal 1: Docker (API + DB + Redis + Tunnel)
cd ___LINE_DATA
docker compose up

# Terminal 2: LIFF dev server
cd _liff
npm run dev

# Terminal 3: Admin dev server
cd _admin
npm run dev
```

### 6. ตั้ง LINE Webhook URL
- ไปที่ LINE Developers Console > Messaging API channel
- Webhook URL: `https://lineapi.puekk.com/webhook/line`
- เปิด Use webhook: ON
- ปิด Auto-reply messages: OFF

### 7. ตั้ง LIFF Endpoint URL
- ไปที่ LINE Developers Console > LINE Login channel (2012062839)
- LIFF tab > แก้ไข LIFF app
- Endpoint URL: `https://liff.puekk.com`

### 8. ทดสอบ
- เปิด https://lineapi.puekk.com/health ต้องได้ `{"success":true,"data":{"status":"ok"}}`
- วางลิงก์ `https://liff.line.me/2012062839-lm9XiKmr` ในกลุ่ม LINE ทดสอบ
- เปิด https://admin-line.puekk.com เข้า login ด้วย admin@puekk.com / admin1234

## สิ่งที่ยังต้องใส่ใน _gofiber/.env
- `LINE_CHANNEL_ID` - จาก Messaging API channel
- `LINE_CHANNEL_SECRET` - จาก Messaging API channel
- `LINE_CHANNEL_ACCESS_TOKEN` - จาก Messaging API channel > Issue
- `JWT_SECRET` - random string เช่น `openssl rand -hex 32`
