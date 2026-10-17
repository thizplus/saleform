# 03 — `_admin` Review

ตอนนี้มี: Login, รายการหน้างาน (ค้นหา + แบ่งหน้า), จัดการเซลล์ (เปิด/ปิด), ตัวเลือก dropdown, layout + sidebar

## P0
| # | ปัญหา | แก้ |
|---|---|---|
| 1 | `tsc -b` TS5101 `baseUrl` → build ไม่ผ่าน | เหมือน `_liff` |
| 2 | `VITE_API_URL=http://localhost:9100` | ใช้ `https://lineapi.puekk.com/api/v1` เมื่อเปิดผ่าน `admin-line.puekk.com` |
| 3 | ฝั่ง backend: token เซลล์เข้า admin API ได้ | แก้ที่ backend (01 P0-1) |

## สิ่งที่ยังขาดเทียบกับ requirement (รูป 04) และแผน

| ลำดับ | Feature | สถานะ | หมายเหตุ |
|---|---|---|---|
| A2 | **หน้ารายละเอียดหน้างาน** — timeline รายงาน, รูป, แผนที่, แก้ไขสถานะ | ❌ | `siteService.getByCode/updateSite` มีแล้ว แต่ไม่มีหน้า |
| A2 | ตัวกรอง สถานะ / เซลล์ / อำเภอ / ช่วงวัน ในรายการหน้างาน | ⚠️ มีแค่ค้นหา | backend รองรับ `status`,`repId`,`amphoe` แล้ว |
| A3 | **อนุมัติเซลล์ใหม่ (pending)** | ❌ | จำเป็นหลังแก้ backend P0-2 |
| A3 | ตั้งชื่อเล่น / พื้นที่รับผิดชอบของเซลล์ | ⚠️ | API รองรับ แต่หน้าไม่มีฟอร์มแก้ |
| A3 | จัดการผู้ใช้แอดมิน / viewer, เปลี่ยนรหัสผ่าน | ❌ | ตอนนี้มีแต่ admin ที่ seed ไว้ |
| A4 | **Export Excel ตามคอลัมน์ชีทเดิม** | ❌ | backend ยังไม่มี endpoint |
| A4 | Import Excel เดิม | ❌ | |
| A6 | **Dashboard / KPI** — จำนวนวิ่งงาน, จบได้/จบที่อื่น/ติดตาม + %, แยกเซลล์, แยกพื้นที่, สาเหตุจบที่อื่น, รายวัน/เดือน/ปี | ❌ | หัวใจของ requirement — backend ยังไม่มี `/admin/analytics/*` |
| A6 | รายการงานครบกำหนด/เลยกำหนดของทุกคน | ❌ | ใช้ `tab=due_today/overdue` ได้เลย |
| A5 | คิวรอตรวจ | ไม่จำเป็นถ้าไม่ใช้ OA/webhook | |

## P1 — คุณภาพโค้ด
- `api-client.ts` ไม่มี `ApiError` / แปลง error message เหมือน `_vite`
- 401 → `window.location.href='/login'` แต่ไม่ล้าง zustand persist (`admin-auth`) → `ProtectedRoute` ยังเห็น `isAuthenticated=true` → วนกลับมาหน้าเดิม; เรียก `clearAuth()` ก่อน
- token เก็บซ้ำ 2 ที่ (เหมือน LIFF)
- ไม่มีการเช็กสิทธิ์ `viewer` ฝั่ง UI (ซ่อนปุ่มแก้ไข)
- dependencies ไม่มี `react-hook-form`/`zod`/`date-fns`/ไลบรารีกราฟ — เพิ่มเมื่อทำ A2/A6 (`recharts` หรือที่ใช้ใน deli2you)

## Backend endpoints ที่ต้องเพิ่มเพื่อ admin
```
GET  /admin/analytics/summary     ?period&from&to&repId&amphoe
GET  /admin/analytics/by-rep
GET  /admin/analytics/by-area
GET  /admin/analytics/lost-reasons
GET  /admin/export/excel          ?from&to&repId
POST /admin/import/excel
GET  /admin/media/:id             → presigned URL รูปเต็ม
POST /admin/users  PATCH /admin/users/:id  POST /admin/auth/change-password
```
นิยาม KPI อยู่ใน `docs/04_REPORTS_KPI.md`
