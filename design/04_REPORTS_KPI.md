# 04 — รายงานประสิทธิภาพเซลล์ (KPI)

อ้างอิงความต้องการ (`requirement/04.jpg`):
1. จำนวนการวิ่งงานทั้งหมดของเซลล์
2. จำนวนงานที่จบได้ / จบที่อื่น / ยังติดตามต่อ + %
3. สรุปข้อ 2 แยกตามพื้นที่ของเซลล์
4. สาเหตุของงานที่จบที่อื่น
+ เปรียบเทียบ รายวัน / รายเดือน / รายปี ของเซลล์แต่ละคน, แจ้งเตือนวันที่ต้องเข้าไปติดตาม

## 1. KPI และสูตร

| KPI | สูตร | ตอบคำถาม | requirement |
|---|---|---|---|
| **วิ่งงาน** | COUNT(site_reports) ในช่วงเวลา | ขยันแค่ไหน | ข้อ 1 |
| งานใหม่ | COUNT(site_reports WHERE kind='new') | หางานใหม่ได้เท่าไหร่ | ข้อ 1 |
| ติดตาม | COUNT(site_reports WHERE kind='follow_up') | ดูแลงานเก่าแค่ไหน | ข้อ 1 |
| **จบได้ / จบที่อื่น / ติดตามอยู่** | COUNT(sites) ตาม status (นับตาม owner) | ผลลัพธ์ | ข้อ 2 |
| % ของแต่ละสถานะ | สถานะ ÷ จำนวนหน้างานทั้งหมดของคนนั้น | สัดส่วน | ข้อ 2 |
| **อัตราปิดได้ (Win rate)** | จบได้ ÷ (จบได้ + จบที่อื่น) | เมื่องานจบแล้ว ได้กี่ % — **ตัววัดฝีมือหลัก** | ข้อ 2 |
| ตามตรงเวลา | follow-up ที่ `reported_at::date ≤ นัดเดิม` ÷ follow-up ทั้งหมดที่มีนัด | วินัยการติดตาม | แจ้งเตือน |
| เลยกำหนด | sites WHERE status='following' AND next_follow_up_date < today | งานที่กำลังหลุด | แจ้งเตือน |
| เฉลี่ยวันปิดงาน | AVG(วันที่จบได้ − first_reported_at) | รอบการขาย | — |
| ครั้งติดตามเฉลี่ยก่อนปิด | AVG(follow_up_count) ของงานที่จบได้ | ต้องตามกี่ครั้ง | — |
| ตามพื้นที่ | KPI ข้างบน GROUP BY amphoe (, tambon) | พื้นที่ไหนดี | ข้อ 3 |
| สาเหตุจบที่อื่น | COUNT GROUP BY lost_reason / competitor | แพ้เพราะอะไร แพ้ให้ใคร | ข้อ 4 |

### นิยามที่ต้องยืนยันกับน้าอร (ใส่ในหน้า A8 เป็นค่าตั้งได้)
- งาน "จบได้" นับเข้าเดือนไหน → **เสนอ: เดือนที่จบ** (ไม่ใช่เดือนที่เปิดงาน)
- งานที่ไม่มีอัปเดตเกิน 60 วัน → นับเป็น "ค้าง" แยกจาก "ติดตามอยู่" ไหม
- ถ้าเซลล์ 2 คนแตะหน้างานเดียวกัน → ผลลัพธ์นับให้ **เจ้าของงาน**, การวิ่งงานนับให้ **คนที่รายงาน**

### ไม่ทำ "คะแนนรวม" ตัวเดียว
คะแนนรวมแบบถ่วงน้ำหนักอธิบายยากและถูกตั้งคำถามง่าย → แสดง KPI แยกกันชัด ๆ และเทียบกับค่าเฉลี่ยทีมเป็นข้อความ ("ปิดได้ 45% · ทีม 38%")

## 2. รูปแบบการแสดงผล

| ข้อมูล | รูปแบบ | เหตุผล |
|---|---|---|
| ตัวเลขหลักของช่วงเวลา | แถวตัวเลข (stat row) + เทียบช่วงก่อน | อ่านเร็ว ไม่ต้องเป็นกราฟ |
| ผลลัพธ์ต่อเซลล์ | **แถบ stacked 100% ในแถวตาราง** จบได้/ตามต่อ/จบที่อื่น | เทียบหลายคนได้ในตารางเดียว |
| แนวโน้มตามเวลา | line chart เส้นเดียว (เลือก metric) | ไม่ใช้ 2 แกน |
| เทียบเซลล์ 1 metric | bar แนวนอน เรียงมาก→น้อย | อ่านชื่อไทยยาวได้ |
| สาเหตุ / คู่แข่ง | bar แนวนอน | |
| กิจกรรมรายวันของคนเดียว | heatmap ปฏิทิน (เทา 4 ระดับ) | เห็นวันที่ไม่ได้ออกงาน |
| พื้นที่ | ตาราง + แผนที่ pin | |

**สีกราฟ:** จบได้ `#16A34A` · ตามต่อ `#737373` · จบที่อื่น `#DC2626` (ลำดับคงที่ เทาคั่นกลางแดง-เขียว) · เส้นแนวโน้มดำ · ค่าเฉลี่ยทีมเทาประ
**ทุกกราฟ:** มี legend + ตัวเลขกำกับ, hover tooltip, ปุ่มสลับ "ดูเป็นตาราง", ไม่ใช้ pie/donut

ไลบรารีแนะนำ: **shadcn Charts (Recharts)** — `npx shadcn@latest add chart`

## 3. API ที่ต้องเพิ่ม (backend)

```
GET /api/v1/admin/analytics/summary
    ?from=2026-10-01&to=2026-10-17&repId=&amphoe=
→ { visits, newSites, followUps, won, lost, following, cancelled,
    winRate, onTimeRate, overdue, avgDaysToWin,
    previous: { ...ค่าเดียวกันของช่วงก่อนหน้า } }

GET /api/v1/admin/analytics/by-rep        ?from&to&amphoe
→ [{ repId, nickname, area, pictureUrl, visits, newSites, followUps,
     won, lost, following, winRate, onTimeRate, overdue, avgDaysToWin }]

GET /api/v1/admin/analytics/trend         ?from&to&bucket=day|month|year&metric=visits|won|winRate&repId
→ [{ bucket: "2026-10-01", value: 12, teamAvg: 9.5 }]

GET /api/v1/admin/analytics/by-area       ?from&to&repId&level=amphoe|tambon
→ [{ amphoe, tambon?, visits, won, lost, following, winRate }]

GET /api/v1/admin/analytics/lost-reasons  ?from&to&repId&amphoe
→ { reasons: [{ reason, count }], competitors: [{ name, count }] }

GET /api/v1/admin/analytics/activity      ?repId&from&to       (heatmap)
→ [{ date: "2026-10-17", count: 4 }]

GET /api/v1/admin/followups               ?tab=today|overdue
→ [{ repId, nickname, sites: [{ siteCode, customerName, amphoe, nextFollowUpDate, overdueDays }] }]

GET /api/v1/admin/activity-feed           ?limit=20
GET /api/v1/liff/me/stats                 ?period=week|month|year      (L10)
```
ทุก endpoint คำนวณใน SQL (GROUP BY) ไม่ดึงทั้งตารางมานับใน Go · วันที่ตัดตาม **Asia/Bangkok**

## 4. ข้อมูลที่ต้องมีเพิ่มใน DB เพื่อให้คำนวณได้
| ข้อมูล | ตอนนี้ | ต้องเพิ่ม |
|---|---|---|
| ตำบล/อำเภอ | ไม่ถูกบันทึก | บันทึกจาก LIFF (L5) |
| วันที่จบงาน | ไม่มี | `sites.closed_at` ตั้งตอนสถานะเป็น won/lost |
| นัดเดิมของ follow-up | ไม่มี | `site_reports.due_date_before` (วันนัดก่อนรายงานนี้) เพื่อคำนวณ "ตามตรงเวลา" |
| มูลค่างาน | ไม่มี | `sites.won_value` (ไม่บังคับ) |
| พื้นที่ของเซลล์ | text | `sales_reps.areas` (array อำเภอ) |
