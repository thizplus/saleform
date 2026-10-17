# 04 — Admin Dashboard (Vite + React + TS) — เฟส M3/M4

ใช้ template/convention เดียวกับ `_FOOD_DELIVERY/_vite` เกือบทั้งหมด (features/{name}/{pages,components,hooks.ts,service.ts,types.ts}, `lib/api-client.ts`, shadcn, React Query, react-router, zustand, sidebar layout) → copy โครงแล้วตัด feature ที่ไม่ใช้ออก

## ผู้ใช้
น้าอร / หัวหน้าเซลล์ / แอดมิน (desktop เป็นหลัก แต่ต้องดูบนมือถือได้)

## Features

| ขั้น | Feature | หน้า |
|---|---|---|
| **A1** | auth | Login, ProtectedRoute |
| **A2** | sites | รายการหน้างาน (filter สถานะ/เซลล์/อำเภอ/ช่วงวัน, ค้นหา), รายละเอียด + timeline + รูป + แผนที่, แก้ไข, merge |
| **A3** | sales-reps / groups / options | ผูก LINE user ↔ ชื่อเล่น/พื้นที่, อนุมัติ/ปิดบัญชี, ตั้งกลุ่มเซลล์, จัดการ dropdown (ขั้นตอน, สาเหตุ, คู่แข่ง) |
| **A4** | export / import | ปุ่ม Export Excel (ช่วงวัน/เซลล์), อัปโหลด Excel เดิม + พรีวิวก่อนนำเข้า |
| **A5** | review-queue | รายการข้อความที่พิมพ์ในกลุ่มแต่จับคู่ไม่ได้ → ผูกงานเดิม / สร้างใหม่ / ข้าม |
| **A6** | analytics / dashboard | การ์ด KPI, เปรียบเทียบเซลล์ (stacked bar), แนวโน้ม (line), พื้นที่ (ตาราง/แผนที่ maplibre), สาเหตุจบที่อื่น, งานครบกำหนด/เลยกำหนด |

## หมายเหตุ
- กราฟ: recharts (หรือที่ใช้ใน deli2you analytics)
- แผนที่: `maplibre-gl` (มีใน `_vite` อยู่แล้ว) + pin สีตามสถานะ
- ทุกตารางแสดงวันที่เป็น พ.ศ.
- Deploy: build static → nginx container `admin.<domain>`
