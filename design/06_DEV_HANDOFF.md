# 06 — Dev Handoff: งาน Redesign ทั้งหมด (ทำตามลำดับ)

> อ่านคู่กับ `mockup-liff.html`, `mockup-admin.html` และ `01`–`05` ในโฟลเดอร์นี้
> หน้าจอใน mockup = **ข้อกำหนด** (ไม่ใช่แค่แรงบันดาลใจ) ถ้าจะทำต่างจาก mockup ให้ถามก่อน

## กติกาที่ใช้ทุก ticket
- 1 ticket = 1 branch / 1 PR, ชื่อ `redesign/<ticket-id>` เช่น `redesign/L-04`
- PR ต้องแนบ **screenshot มือถือจริง (LIFF)** หรือ **screenshot 1440px (Admin)** เทียบกับ mockup
- `npm run build` (รวม `tsc -b`) และ `go build ./... && go vet ./...` ต้องผ่าน
- ห้าม hardcode สี — ใช้ token จาก `index.css` เท่านั้น (`bg-primary`, `text-success-ink`, ...)
- ข้อความไทยใช้น้ำหนัก 400 / 700 / 900 เท่านั้น (LINE Seed ไม่มี 500/600)
- ตัวเลข / รหัสงาน / เบอร์ / วันที่ ใส่ class `num` (Inter + tabular-nums)
- สถานะต้องมี ไอคอน + ข้อความ เสมอ ใช้ `<StatusBadge>` ตัวเดียวทั้งระบบ

---

## Phase 0 — Foundation (ทำก่อน, ทั้ง 2 แอป) · ~1 วัน

| ID | งาน | ไฟล์ | เสร็จเมื่อ |
|---|---|---|---|
| F-01 | แก้ `tsconfig.app.json` ลบ `baseUrl` (TS5101) | `_liff`, `_admin` | `npm run build` ผ่าน |
| F-02 | ฟอนต์: ลบ `@fontsource-variable/geist`, `next-themes` · ติดตั้ง `@fontsource-variable/inter` · วาง LINE Seed `.woff2` (Rg/Bd/He) ใน `public/fonts/` + `@font-face` | `src/index.css`, `main.tsx`, `package.json` | ข้อความไทยเป็น LINE Seed, ตัวเลขเป็น Inter (เช็กใน DevTools > Computed > font-family) |
| F-03 | Design tokens: แทน `:root` / `@theme` ด้วยชุดใน `01_DESIGN_SYSTEM.md` ข้อ 5 (รวม success/warning/danger) | `src/index.css` | ใช้ `bg-success-soft text-success-ink` ได้ |
| F-04 | Variant ใหม่: `Badge` (today/overdue/future/won/lost/off), `Button size="xl"` (h-12), `ToggleGroup` chip, `Alert` warning/success | `components/ui/*` | หน้า `/dev/kitchen-sink` แสดงทุก variant (เฉพาะ DEV) |
| F-05 | Shared: `StatusBadge`, `formatThaiDate`, `formatRelativeDay` ("พรุ่งนี้", "เลย 2 วัน"), `formatPhone`, `num` class | `lib/format-th.ts`, `components/shared/` | unit test format functions |

---

## Phase 1 — LIFF (ฝั่งเซลล์) · ~4–5 วัน

| ID | หน้า | งาน | เสร็จเมื่อ |
|---|---|---|---|
| L-00 | Auth bootstrap | รวม flow เป็น `useBootstrapAuth` (useRef กันยิงซ้ำ, ไม่ใช้ `liff.login()` ในแอป LINE, ตรวจ ID token หมดอายุ, ไม่ persist `isAuthenticated`) | เปิดครั้งแรก → L1 ทันที, ไม่ติด loop, เปิดซ้ำหลัง 1 ชม. ยังเข้าได้ |
| L-01 | L0 / L1 / L2 / L3 | หน้าโหลด, เปิดนอก LINE, ลงทะเบียน (ชื่อเล่น + เลือกอำเภอ + เบอร์), รออนุมัติ (ปุ่มตรวจสถานะ), บัญชีถูกปิด | ตรง mockup ทั้ง 5 จอ |
| L-02 | L4 หน้าแรก | Hero "วันนี้ต้องตาม" + `WeekStrip` 7 วัน (แตะกรองวัน) + Tabs + ค้นหา + `SiteCard` (ปุ่ม โทร/นำทาง/อัปเดต) + ปุ่มลอย "รายงานงานใหม่" + empty/skeleton/offline | ตัวเลขตรงกับ API, แตะวันใน WeekStrip แล้วรายการกรองตาม |
| L-03 | L5 ฟอร์มงานใหม่ | เรียงใหม่: หน้างาน (GPS + แผนที่ย่อ + ตำบล/อำเภอ dropdown) → รูป 3 ช่อง → ผู้ติดต่อ (เบอร์ตรวจซ้ำทันทีเมื่อครบ 10 หลัก) → รายละเอียด (chips) → นัดหมาย (chips วัน + คาดสั่ง) · `StickyActionBar` แสดง "ขาด: ..." · autosave ร่าง · ใช้ react-hook-form + zod | กรอกครบใน < 60 วินาที (ทดสอบจริง), ร่างไม่หายเมื่อปิดเปิดใหม่ |
| L-04 | L6 ชีทงานซ้ำ | `Drawer` แสดงงานที่ซ้ำ · งานของตัวเอง → "อัปเดตงานนี้แทน" (พาข้อมูลไป L9) · ของคนอื่น → "แจ้งแอดมินว่าซ้ำ" | กด "อัปเดตงานนี้แทน" แล้วข้อความ/รูปที่กรอกไว้ตามไปด้วย |
| L-05 | กำลังบันทึก + L8 | ชีทความคืบหน้าอัปโหลดทีละรูป · สำเร็จ = แสดงตัวอย่างการ์ด + "กลับไปที่กลุ่ม" · ส่งเข้ากลุ่มไม่ได้ = ปุ่มคัดลอกข้อความ · ส่ง `Idempotency-Key` | กดซ้ำ/เน็ตหลุดไม่เกิดงานซ้ำ |
| L-06 | L7 รายละเอียด | แผนที่ย่อ, ปุ่มโทร/นำทาง, key-value, `Timeline` + รูป, ปุ่มอัปเดต (ซ่อนถ้าไม่ใช่เจ้าของ) · route `/sites/:code` รองรับ deep link | เปิดจากการ์ดในกลุ่มแล้วเข้าหน้านี้ตรง |
| L-07 | L9 อัปเดตงาน | หน้าเต็ม (ไม่ใช่ sheet) · segmented 4 สถานะ · ฟิลด์เปลี่ยนตามสถานะ (ตามต่อ → วันนัด; จบได้ → มูลค่า; จบที่อื่น → สาเหตุ + ร้าน chips) | validate ตามสถานะ, ตรง mockup ทั้ง 2 แบบ |
| L-08 | L10 ผลงานของฉัน | 4 ตัวเลข + เทียบทีม + แถบผลลัพธ์ + ตามตรงเวลา | ใช้ API `/liff/me/stats` |
| L-09 | Flex card | backend สร้างใหม่ตาม `02_LIFF_SCREENS.md` (hero รูป, ป้ายสถานะ, ปุ่มดูรายละเอียด → deep link) | ทดสอบใน Flex Simulator + ส่งจริงในกลุ่มทดสอบ |

---

## Phase 2 — Backend เพื่อรองรับ Redesign · ~3 วัน (ทำคู่ขนาน Phase 1 ได้)

| ID | งาน | เสร็จเมื่อ |
|---|---|---|
| B-01 | Schema: `sites.tambon/amphoe/province` (มีแล้ว ให้บันทึกจริง), `sites.closed_at`, `sites.won_value`, `site_reports.due_date_before`, `sales_reps.areas` (array), `sales_reps.phone` | migrate ผ่านบน DB เดิม |
| B-02 | รับ/คืนฟิลด์ใหม่ใน `/liff/sites`, `/liff/sites/:code/follow-ups`, `/liff/auth` (register) | LIFF L1/L5/L9 บันทึกครบ |
| B-03 | `/liff/sites?day=YYYY-MM-DD` + `/liff/me` คืน counts 7 วัน (สำหรับ WeekStrip) — คำนวณวันตาม Asia/Bangkok | ตัวเลขตรงกับ DB ช่วง 00:00–07:00 |
| B-04 | Idempotency-Key middleware (ใช้ `site_reports.idempotency_key`) | POST ซ้ำ key เดิม → คืนผลเดิม 200 |
| B-05 | Analytics API ทั้งชุดตาม `04_REPORTS_KPI.md` ข้อ 3 (SQL GROUP BY) | test ด้วยข้อมูลตัวอย่าง ตัวเลขตรงกับคิดมือ |
| B-06 | `/admin/followups`, `/admin/activity-feed`, `/admin/users` CRUD, `/admin/reps/:id/approve|reject` | Admin A6/A7/A9 ใช้ได้ |
| B-07 | Export Excel (`excelize`) คอลัมน์ตามชีทเดิม + Import | เปิดใน Excel แล้วหน้าตาเหมือนชีทเดิม |
| B-08 | Middleware เช็กสถานะ rep (active) ทุก request `/liff/*` | ปิดบัญชีแล้วเรียก API ไม่ได้ทันที |

---

## Phase 3 — Admin · ~5–6 วัน

| ID | หน้า | งาน | เสร็จเมื่อ |
|---|---|---|---|
| A-00 | Layout | `npx shadcn add sidebar-07` ปรับเมนูตาม mockup + header (breadcrumb, ช่วงเวลา global เก็บใน URL, ปุ่ม Export) + badge จำนวน (ต้องติดตาม, รออนุมัติ) | ยุบ sidebar ได้, ช่วงเวลาคงอยู่เมื่อเปลี่ยนหน้า |
| A-01 | A0 Login | ตาม mockup + error message | |
| A-02 | A1 ภาพรวม | `StatRow` 6 ช่อง (เทียบช่วงก่อน) + line chart วิ่งงาน + ต้องตามวันนี้ + ตารางผลงาน (`OutcomeBar`) + feed | คลิก "เลยกำหนด" → A6, คลิกแถวเซลล์ → A2 รายบุคคล |
| A-03 | A2 รายงาน | 4 แท็บ: ทีม (scoreboard + tfoot รวมทีม), รายบุคคล (stats เทียบทีม + bar รายเดือน + สาเหตุ + heatmap), พื้นที่ (ตาราง + แผนที่ pin), สาเหตุ (2 bar + ตารางงาน) · ทุกกราฟมีปุ่มดูเป็นตาราง | ตัวเลขตรงกับ API B-05 |
| A-04 | A4 หน้างาน | TanStack data-table คอลัมน์ตามชีท Excel + faceted filters + column visibility + pagination + คลิกแถว → A5 | ค้นหา/กรองทำงานฝั่ง server |
| A-05 | A5 รายละเอียด | timeline (รวมรายการที่แอดมินแก้), gallery รูป (presigned), แผนที่, แก้ข้อมูล (Sheet), เปลี่ยนสถานะ + เหตุผล, เปลี่ยนเจ้าของงาน, รวมงานซ้ำ | แก้แล้วมีบันทึกใน timeline |
| A-06 | A6 ต้องติดตาม | แท็บ วันนี้/เลยกำหนด จัดกลุ่มตามเซลล์ + ปุ่มคัดลอกสรุปไปวางในกลุ่ม | |
| A-07 | A7 เซลล์ | แท็บ รออนุมัติ/ใช้งาน/ปิด + อนุมัติ/ปฏิเสธ + แก้ชื่อเล่น/พื้นที่ + ปิดใช้งาน (AlertDialog) | |
| A-08 | A8 ตั้งค่าตัวเลือก | หมวดซ้าย + รายการลากเรียง (`@dnd-kit`) + เพิ่ม/เปลี่ยนชื่อ/ซ่อน + จำนวนครั้งที่ใช้ | ซ่อนแล้วไม่หายจากรายงานย้อนหลัง |
| A-09 | A9 ผู้ใช้ระบบ | ตาราง + เพิ่มผู้ใช้ + บทบาท admin/viewer + รีเซ็ตรหัส · viewer ซ่อนปุ่มแก้ไขทั้งหมด | login viewer แล้วไม่เห็นปุ่มแก้ |
| A-10 | Export dialog | ตาม mockup เรียก B-07 | ไฟล์ดาวน์โหลดได้ |

---

## Phase 4 — QA ก่อนส่งลูกค้า · ~1–2 วัน
- [ ] LIFF บน Android + iPhone จริง, เปิดจากประกาศกลุ่ม, กลางแจ้ง
- [ ] input ทุกช่อง ≥ 16px (iOS ไม่ซูม), ปุ่มล่างไม่ชนแถบ home (`env(safe-area-inset-bottom)`)
- [ ] ปฏิเสธสิทธิ์ GPS / ส่งข้อความ / กล้อง → ทุกกรณีมีข้อความบอกวิธีแก้
- [ ] เน็ตหลุดระหว่างอัปโหลด → ร่างไม่หาย, ส่งซ้ำไม่เกิดงานซ้ำ
- [ ] การ์ด Flex ขึ้นในกลุ่มในชื่อเซลล์ + กดเปิดรายละเอียดได้
- [ ] Admin: คีย์บอร์ดใช้งานได้ (focus ring เห็นชัด), viewer แก้อะไรไม่ได้
- [ ] รายงาน: เทียบตัวเลข 1 เดือนกับการนับมือจาก DB ตรงกัน
- [ ] Export เปิดใน Excel ได้ ภาษาไทยไม่เพี้ยน

---

## ลำดับรวม (แนะนำ ~3 สัปดาห์ 1–2 คน)
```
สัปดาห์ 1:  F-01..05 → L-00, L-01, L-02, L-03        |  B-01..04 (คู่ขนาน)
สัปดาห์ 2:  L-04..09                                  |  B-05..08
สัปดาห์ 3:  A-00..10 → QA → ส่งน้าอรทดลอง
```
**จุดตรวจกับเจ้าของงาน (Notz):** จบ F (ดู kitchen-sink) · จบ L-03 (ลองกรอกฟอร์มจริง) · จบ A-03 (ดูรายงาน)
