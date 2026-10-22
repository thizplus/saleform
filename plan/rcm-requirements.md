# RCM Requirements (22/11/69)

ลูกค้าขอเพิ่มเติม 2 ส่วนหลัก: **ปรับหน้าเพิ่มงาน** และ **เช็คอินเย็น (สรุปงานประจำวัน)**

---

## 1. ปรับหน้าเพิ่มงานใหม่ (NewReportPage)

### 1.1 เปลี่ยนข้อความ "ขั้นตอน" -> "สถานะงาน"
- แก้ label จาก "ขั้นตอน" เป็น **"สถานะงาน"** ในหน้าเพิ่มงานใหม่

### 1.2 เพิ่ม section "ตัวเลือกงาน" (ใต้สถานะงาน)
- เป็น dropdown/select ดึงค่าจาก **Admin Options** (เหมือน vehiclePlates, stages ฯลฯ)
- ต้องมีตัวเลือก **"อื่นๆ"** ให้ sale พิมพ์ข้อความเองได้ (free text)
- **Backend**: เพิ่ม field ใหม่ใน Options system (key: `jobTypes` หรือชื่อที่เหมาะสม)
- **Admin**: เพิ่มจัดการ options ใน Admin Options page

### 1.3 เปลี่ยนช่อง "หมายเหตุ" -> "สินค้าที่สนใจ"
- แก้ label จาก "หมายเหตุ" เป็น **"สินค้าที่สนใจ"**
- ยังคง quick message buttons เหมือนเดิม

### 1.4 เพิ่มช่อง "รายละเอียดหน้างาน" (ใต้สินค้าที่สนใจ)
- เป็น **textarea** ให้ sale กรอกข้อมูลเอง
- **ไม่ต้องมี** ปุ่ม quick message
- เป็น field ใหม่ใน Report model

---

## 2. เช็คอินเย็น — สรุปงานประจำวัน (Evening Check-in)

### แนวคิด
- ของเดิมมีแค่ **เช็คอินเช้า** (ก่อนเริ่มงาน)
- เพิ่มปุ่ม **"สรุปงานประจำวัน"** — แสดงเฉพาะเมื่อเช็คอินเช้าแล้ว
- เมื่อกดจะเปิด form ให้ sale กรอกข้อมูลสรุป แล้ว **ส่ง LINE message** ไปกลุ่มเหมือนสร้างงานใหม่

### Fields ที่ sale ต้องกรอก
| Field | Type | หมายเหตุ |
|-------|------|----------|
| เลขไมล์ | number | ไมล์รถคันที่ใช้ตอนเช็คอินเช้า |
| โทรติดตามลูกค้ากี่ราย | number | จำนวนราย |
| เปิดบิลกี่บิล | number | จำนวนบิล |
| ยอดบิล ลค.เก่า | number (บาท) | ยอดเงิน |
| ยอดบิล ลค.ใหม่ | number (บาท) | ยอดเงิน |

### Flow
1. Sale เช็คอินเช้าแล้ว -> ปุ่ม "สรุปงานประจำวัน" แสดงขึ้นมา
2. Sale กดปุ่ม -> เปิด form กรอกข้อมูลสรุป
3. Submit -> บันทึก DB + ส่ง LINE message สรุปไปกลุ่ม
4. LINE message format คล้ายเช็คอินเช้า (ข้อความ + ข้อมูลสรุป)

---

## 3. ปรับ Admin Web

- รองรับ field ใหม่ทั้งหมดที่เพิ่มเข้ามา:
  - **ตัวเลือกงาน** (jobTypes) ใน Options management
  - **สินค้าที่สนใจ** + **รายละเอียดหน้างาน** แสดงใน site/report detail
  - **เช็คอินเย็น** แสดงข้อมูลสรุปใน check-in log / dashboard

---

## สรุป Tasks ที่ต้องทำ

### Backend (Go)
- [ ] เพิ่ม field ใน Report model: `jobType`, `jobTypeOther`, `interestedProducts` (rename จาก notes), `jobDetail`
- [ ] เพิ่ม Options: `jobTypes` ใน dropdown_options
- [ ] สร้าง Evening Check-in model/endpoint: `mileage`, `callCount`, `billCount`, `oldCustomerAmount`, `newCustomerAmount`
- [ ] สร้าง LINE message builder สำหรับสรุปงานประจำวัน
- [ ] Migration: alter tables + seed default jobTypes

### LIFF (React)
- [ ] NewReportPage: เปลี่ยน label "ขั้นตอน" -> "สถานะงาน"
- [ ] NewReportPage: เพิ่ม "ตัวเลือกงาน" select + "อื่นๆ" free text
- [ ] NewReportPage: เปลี่ยน "หมายเหตุ" -> "สินค้าที่สนใจ"
- [ ] NewReportPage: เพิ่ม textarea "รายละเอียดหน้างาน"
- [ ] เพิ่มหน้า/form สรุปงานประจำวัน (evening check-in)
- [ ] ปุ่ม "สรุปงานประจำวัน" แสดงเมื่อเช็คอินเช้าแล้ว
- [ ] ส่ง LINE message สรุปงาน

### Admin (React)
- [ ] Options: เพิ่ม jobTypes management
- [ ] Report/Site detail: แสดง field ใหม่
- [ ] Check-in log: แสดงข้อมูลเช็คอินเย็น
- [ ] Dashboard: รองรับข้อมูลสรุปงาน (ถ้าต้องการ KPI เพิ่ม)
