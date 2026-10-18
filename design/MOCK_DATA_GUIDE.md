# Mock Data Guide -- ข้อมูลจำลองสำหรับทดสอบระบบ

เป้าหมาย: สร้างข้อมูลจำลองย้อนหลัง 2 เดือน เซลล์ 5 คน งาน 200-300 หน้างาน เพื่อทดสอบ Dashboard, Reports, Charts ทุกหน้า

---

## 1. ลำดับการสร้างข้อมูล (ต้องทำตามลำดับ เพราะมี foreign key)

```
1. sales_reps        (เซลล์ 5 คน)
2. sites             (หน้างาน 200-300 รายการ)
3. site_reports      (รายงาน 400-600 รายการ)
4. contacts          (เบอร์โทร 200-300 รายการ)
5. media_files       (รูปภาพ -- optional ถ้าไม่ต้องการทดสอบรูป)
```

---

## 2. ตาราง sales_reps (เซลล์ 5 คน)

| Column | Type | ค่าตัวอย่าง | หมายเหตุ |
|--------|------|------------|----------|
| id | UUID | gen_random_uuid() | primary key |
| line_user_id | string | `Uxxxxxxxxx01` ถึง `Uxxxxxxxxx05` | ค่าสมมุติได้ ไม่ต้องเป็น LINE จริง |
| display_name | string | `สมชาย`, `สมหญิง`, `ธนพล`, `วิภา`, `กิตติ` | ชื่อจริงภาษาไทย |
| picture_url | string | `https://via.placeholder.com/150` | URL รูป placeholder |
| nickname | string | `ชาย`, `หญิง`, `พล`, `ภา`, `กิต` | ชื่อเล่นสั้นๆ |
| area | string | `โคราช`, `บุรีรัมย์`, `ชัยภูมิ`, `นครราชสีมา`, `สุรินทร์` | พื้นที่รับผิดชอบ |
| status | string | `active` | ทุกคนเป็น active |
| created_at | timestamp | ย้อนหลัง 3 เดือน | วันที่ลงทะเบียน |

**ตัวอย่าง SQL:**
```sql
INSERT INTO sales_reps (id, line_user_id, display_name, picture_url, nickname, area, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'U0000000000000000000000000000001', 'สมชาย ใจดี', '', 'ชาย', 'โคราช', 'active', NOW() - INTERVAL '90 days', NOW()),
  (gen_random_uuid(), 'U0000000000000000000000000000002', 'สมหญิง รักงาน', '', 'หญิง', 'บุรีรัมย์', 'active', NOW() - INTERVAL '90 days', NOW()),
  (gen_random_uuid(), 'U0000000000000000000000000000003', 'ธนพล เก่งมาก', '', 'พล', 'ชัยภูมิ', 'active', NOW() - INTERVAL '90 days', NOW()),
  (gen_random_uuid(), 'U0000000000000000000000000000004', 'วิภา สู้งาน', '', 'ภา', 'นครราชสีมา', 'active', NOW() - INTERVAL '90 days', NOW()),
  (gen_random_uuid(), 'U0000000000000000000000000000005', 'กิตติ ไม่ท้อ', '', 'กิต', 'สุรินทร์', 'active', NOW() - INTERVAL '90 days', NOW());
```

---

## 3. ตาราง sites (หน้างาน 200-300 รายการ)

| Column | Type | ค่าที่ต้องใส่ | ตัวเลือก/หมายเหตุ |
|--------|------|--------------|-------------------|
| id | UUID | gen_random_uuid() | |
| site_code | string UNIQUE | `YYMMDD-NN` | เช่น `690901-01`, `690901-02`, ... `691018-50` (YY=ปีพุทธ 2 หลัก, MMDD=เดือนวัน, NN=ลำดับ) |
| customer_name | string | ชื่อคนไทย | เช่น `นายสมศักดิ์`, `ป้าแดง`, `ลุงทอง`, `คุณวิไล` |
| customer_type | string | `ใหม่` หรือ `เก่า` | สัดส่วน 70% ใหม่ / 30% เก่า |
| contractor_name | string | ชื่อช่าง | เช่น `ช่างโจ้`, `ช่างแมน`, `ช่างสมบัติ`, ว่างได้ |
| decision_maker | string | | เลือกจาก: `เจ้าของ`, `ผู้รับเหมา`, `วิศวกร`, `สถาปนิก`, `อื่นๆ` |
| phone | string | `08xxxxxxxx` | เบอร์มือถือ 10 หลัก ห้ามซ้ำ |
| latitude | float (nullable) | `14.5` ถึง `15.5` | พิกัดในเขตอีสาน (nullable 20% ได้) |
| longitude | float (nullable) | `101.5` ถึง `103.5` | |
| address | string | ที่อยู่สั้นๆ | เช่น `หมู่ 5 ต.ในเมือง`, `ซ.สุขสวัสดิ์ 12` |
| amphoe | string | ชื่ออำเภอ | **สำคัญ** ใช้ใน reports -- เลือกจาก: `เมืองนครราชสีมา`, `ปากช่อง`, `สีคิ้ว`, `ด่านขุนทด`, `โนนสูง`, `พิมาย`, `บัวใหญ่`, `ครบุรี`, `โชคชัย`, `สูงเนิน` |
| tambon | string | ชื่อตำบล | เช่น `ในเมือง`, `หนองจะบก`, `จอหอ` (ว่างได้) |
| province | string | `นครราชสีมา` | จังหวัดเดียวก็พอ |
| stage | string | | เลือกจาก: `เริ่มก่อสร้าง`, `กำลังสร้าง`, `ใกล้เสร็จ`, `รอตัดสินใจ`, `เสนอราคาแล้ว`, `อื่นๆ` |
| status | string | | **กระจายตามสัดส่วนนี้:** `following` 55%, `won` 25%, `lost` 15%, `cancelled` 5% |
| lost_reason | string | | ถ้า status=`lost` ต้องใส่ เลือกจาก: `ราคาสูง`, `ส่งช้า`, `ใช้คู่แข่ง`, `เปลี่ยนใจ`, `อื่นๆ` |
| competitor | string | | ถ้า status=`lost` ควรใส่ เช่น `SCG`, `TPI`, `CPAC`, `ร้านวัสดุท้องถิ่น`, `ช่างเหล็กข้างบ้าน` |
| expected_order_date | timestamp (nullable) | | สำหรับงาน following: วันที่คาดว่าจะสั่ง (อนาคต 1-60 วัน) |
| next_follow_up_date | timestamp (nullable) | | **สำคัญมาก** สำหรับงาน following: กระจาย 3 กลุ่ม: 1) เลยกำหนดแล้ว (30%) 2) วันนี้ (10%) 3) อนาคต (60%) |
| owner_rep_id | UUID FK | | **ต้อง** ชี้ไป sales_reps.id กระจายเท่าๆ กัน 5 คน (40-60 งาน/คน) |
| group_id | string | ว่าง | ไม่ต้องใส่ |
| report_count | int | 1-5 | จำนวน reports ของงานนี้ (ต้องตรงกับ site_reports ที่สร้าง) |
| last_report_at | timestamp (nullable) | | วันที่รายงานล่าสุด |
| created_at | timestamp | | กระจายย้อนหลัง 60 วัน (บางวันมาก บางวันน้อย เหมือนจริง) |

### ข้อควรระวัง:
- **site_code** ต้อง unique และตรง format `YYMMDD-NN` (YY = ปีพุทธศักราช 2 หลัก เช่น ค.ศ. 2026 = พ.ศ. 2569 → `69`)
- **status=won/lost** ควรมี `created_at` เก่ากว่า following (งานที่จบแล้ว)
- **status=following** ที่ `next_follow_up_date` < วันนี้ = เลยกำหนด (แสดงในหน้าต้องติดตาม)
- **amphoe** ต้องใส่เพื่อให้ Reports > พื้นที่ มีข้อมูล

---

## 4. ตาราง site_reports (รายงาน 400-600 รายการ)

แต่ละ site ต้องมีอย่างน้อย 1 report (report แรก = `new`) ถ้า report_count > 1 ก็สร้าง follow_up เพิ่ม

| Column | Type | ค่าที่ต้องใส่ | หมายเหตุ |
|--------|------|--------------|----------|
| id | UUID | gen_random_uuid() | |
| site_id | UUID FK | | **ต้อง** ชี้ไป sites.id |
| rep_id | UUID FK | | **ต้อง** ชี้ไป sales_reps.id (คนที่รายงาน อาจไม่ใช่เจ้าของ) |
| report_type | string | `new` หรือ `follow_up` | report แรกของแต่ละ site = `new` ที่เหลือ = `follow_up` |
| note | text | | ข้อความภาษาไทยสั้นๆ เช่น `สอบถามราคาเหล็ก`, `ลูกค้าสนใจ รอใบเสนอราคา`, `ไปตามงาน ลูกค้ายังไม่ตัดสินใจ`, `ปิดการขายได้แล้ว` |
| stage | string | | เลือกจาก: `เริ่มก่อสร้าง`, `กำลังสร้าง`, `ใกล้เสร็จ`, `รอตัดสินใจ`, `เสนอราคาแล้ว` |
| status | string | | สถานะ ณ ตอนรายงาน: `following`, `won`, `lost`, `cancelled` (report สุดท้ายต้องตรงกับ site.status) |
| lost_reason | string | | ใส่เฉพาะ report ที่ status=`lost` |
| competitor | string | | ใส่เฉพาะ report ที่ status=`lost` |
| decision_maker | string | | เหมือน site |
| next_follow_up_date | timestamp (nullable) | | วันนัดครั้งถัดไป (ต้องตรงกับ site.next_follow_up_date ของ report ล่าสุด) |
| report_date | timestamp | | **สำคัญ** วันที่รายงาน กระจายย้อนหลัง 60 วัน ใช้คำนวณ KPI ทั้งหมด -- ต้องเรียงตามเวลา (report แรก = วันสร้าง site) |
| source | string | `liff` | |
| created_at | timestamp | = report_date | |

### ตัวอย่าง Timeline ของ 1 site:
```
Site: 690920-05 (สมศักดิ์, following)
  Report 1: report_type=new,  report_date=2026-09-20, stage=เริ่มก่อสร้าง, status=following, note="ไปเจอลูกค้าครั้งแรก สนใจเหล็ก"
  Report 2: report_type=follow_up, report_date=2026-10-01, stage=กำลังสร้าง, status=following, note="ติดตามครั้งที่ 2 ส่งใบเสนอราคา"
  Report 3: report_type=follow_up, report_date=2026-10-15, stage=รอตัดสินใจ, status=following, note="ลูกค้ากำลังเทียบราคา"
```

```
Site: 690915-03 (ป้าแดง, won)
  Report 1: report_type=new,  report_date=2026-09-15, stage=กำลังสร้าง, status=following, note="ลูกค้าต้องการเหล็กเส้น"
  Report 2: report_type=follow_up, report_date=2026-09-25, stage=เสนอราคาแล้ว, status=won, note="ปิดการขายได้ ลูกค้าสั่งเหล็ก 5 ตัน"
```

```
Site: 690910-07 (ลุงทอง, lost)
  Report 1: report_type=new,  report_date=2026-09-10, stage=เริ่มก่อสร้าง, status=following, note="ลูกค้าถามราคา"
  Report 2: report_type=follow_up, report_date=2026-09-28, stage=รอตัดสินใจ, status=lost, lost_reason="ราคาสูง", competitor="SCG", note="ลูกค้าเลือกซื้อที่อื่น ราคาถูกกว่า"
```

---

## 5. ตาราง contacts (เบอร์โทร)

ทุก site ต้องมี 1 contact (เบอร์หลัก)

| Column | Type | ค่า | หมายเหตุ |
|--------|------|-----|----------|
| id | UUID | gen_random_uuid() | |
| phone | string | เบอร์เดียวกับ sites.phone | |
| site_id | UUID FK | ชี้ไป sites.id | |
| is_primary | bool | `true` | |

```sql
-- สร้างอัตโนมัติจาก sites
INSERT INTO contacts (id, phone, site_id, is_primary, created_at, updated_at)
SELECT gen_random_uuid(), phone, id, true, created_at, created_at
FROM sites;
```

---

## 6. สัดส่วนที่แนะนำ (สำคัญมาก เพื่อให้ Dashboard/Reports สวย)

### สัดส่วน status ต่อเซลล์ (จาก 250 งาน):

| เซลล์ | following | won | lost | cancelled | รวม | Win Rate |
|--------|-----------|-----|------|-----------|-----|----------|
| ชาย | 30 | 15 | 5 | 0 | 50 | 75% |
| หญิง | 28 | 12 | 8 | 2 | 50 | 60% |
| พล | 25 | 8 | 12 | 5 | 50 | 40% |
| ภา | 32 | 10 | 6 | 2 | 50 | 63% |
| กิต | 22 | 18 | 7 | 3 | 50 | 72% |
| **รวม** | **137** | **63** | **38** | **12** | **250** | **62%** |

### สัดส่วน report ต่อเซลล์:
- งาน following: เฉลี่ย 2-3 reports
- งาน won: เฉลี่ย 2-4 reports
- งาน lost: เฉลี่ย 1-2 reports
- งาน cancelled: 1 report

### กระจาย report_date ตามวัน:
- จันทร์-ศุกร์: 5-15 reports/วัน
- เสาร์: 2-5 reports/วัน
- อาทิตย์: 0-2 reports/วัน
- ให้มีบางวันไม่มีเลย (เซลล์บางคนหยุด)

### กระจาย amphoe:
| อำเภอ | จำนวนงาน |
|--------|---------|
| เมืองนครราชสีมา | 60 |
| ปากช่อง | 40 |
| สีคิ้ว | 30 |
| ด่านขุนทด | 25 |
| โนนสูง | 20 |
| พิมาย | 20 |
| บัวใหญ่ | 20 |
| ครบุรี | 15 |
| โชคชัย | 10 |
| สูงเนิน | 10 |

### กระจาย next_follow_up_date (เฉพาะ following):
- เลยกำหนด 1-14 วัน: 30 งาน (แสดงในหน้า "เลยกำหนด")
- วันนี้: 8-12 งาน (แสดงในหน้า "วันนี้")
- พรุ่งนี้-7 วัน: 40 งาน
- 8-30 วัน: 50 งาน
- ไม่มีนัด (null): 9 งาน

### สาเหตุจบที่อื่น (38 งาน lost):
| สาเหตุ | จำนวน |
|--------|-------|
| ราคาสูง | 14 |
| ใช้คู่แข่ง | 10 |
| ส่งช้า | 6 |
| เปลี่ยนใจ | 5 |
| อื่นๆ | 3 |

### คู่แข่ง (ใส่ใน lost ที่มี competitor):
| คู่แข่ง | จำนวน |
|---------|-------|
| SCG | 8 |
| TPI | 5 |
| CPAC | 4 |
| ร้านวัสดุท้องถิ่น | 6 |
| ช่างเหล็กข้างบ้าน | 3 |

---

## 7. ตาราง admin_users (มีอยู่แล้ว)

admin seed สร้างให้แล้ว: `admin@puekk.com` / `admin1234`

ถ้าต้องการเพิ่มผู้ดู:
```sql
INSERT INTO admin_users (id, email, password_hash, display_name, role, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'viewer@puekk.com', '$2a$10$...', 'ผู้ดูรายงาน', 'viewer', true, NOW(), NOW());
```
(ต้อง hash password ด้วย bcrypt ก่อน หรือสร้างผ่านหน้า admin `/users`)

---

## 8. ไม่ต้องสร้าง (สร้างอัตโนมัติ / ไม่จำเป็นสำหรับ mock)

| ตาราง | เหตุผล |
|-------|--------|
| media_files | รูปต้อง upload จริงผ่าน R2 -- mock ไม่ต้องมีรูปก็ได้ |
| line_events | สร้างจาก webhook จริงเท่านั้น |
| line_groups | สร้างจาก webhook จริงเท่านั้น |
| site_code_counters | backend สร้างอัตโนมัติตอน create site |
| app_configs | ใช้ค่า default ได้ หรือตั้งผ่านหน้า admin `/options` |
| review_items | ยังไม่ใช้ |

---

## 9. ตรวจสอบว่าข้อมูลถูกต้อง

หลังสร้าง mock data แล้ว ลองรัน query เหล่านี้:

```sql
-- นับงานทั้งหมด (ควรได้ 250)
SELECT count(*) FROM sites WHERE deleted_at IS NULL;

-- นับแยกสถานะ
SELECT status, count(*) FROM sites WHERE deleted_at IS NULL GROUP BY status ORDER BY count DESC;

-- นับแยกเซลล์
SELECT sr.nickname, count(s.id) as sites
FROM sites s JOIN sales_reps sr ON s.owner_rep_id = sr.id
WHERE s.deleted_at IS NULL
GROUP BY sr.nickname ORDER BY sites DESC;

-- นับ reports ทั้งหมด (ควรได้ 400-600)
SELECT count(*) FROM site_reports WHERE deleted_at IS NULL;

-- นับ reports แยก type
SELECT report_type, count(*) FROM site_reports WHERE deleted_at IS NULL GROUP BY report_type;

-- เช็คเลยกำหนด (ควรได้ ~30)
SELECT count(*) FROM sites
WHERE status = 'following' AND next_follow_up_date < CURRENT_DATE AND deleted_at IS NULL;

-- เช็ค lost reasons
SELECT lost_reason, count(*) FROM sites
WHERE status = 'lost' AND lost_reason != '' AND deleted_at IS NULL
GROUP BY lost_reason ORDER BY count DESC;

-- เช็ค amphoe
SELECT amphoe, count(*) FROM sites
WHERE deleted_at IS NULL AND amphoe != ''
GROUP BY amphoe ORDER BY count DESC;

-- เช็คว่า report_count ตรงกับจำนวน reports จริง
SELECT s.site_code, s.report_count, count(sr.id) as actual
FROM sites s LEFT JOIN site_reports sr ON sr.site_id = s.id AND sr.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.site_code, s.report_count
HAVING s.report_count != count(sr.id);
-- ถ้า query นี้ได้ผลลัพธ์ = มีข้อมูลไม่ตรง ต้องแก้
```

---

## 10. Quick Start -- Script สร้างอัตโนมัติ

ถ้าต้องการให้ Claude สร้าง SQL script ทั้งหมดให้ บอกได้เลย จะ generate ไฟล์ `seed_mock_data.sql` ที่รันครั้งเดียวได้ข้อมูลครบ
