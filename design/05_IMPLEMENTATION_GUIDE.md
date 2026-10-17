# 05 — แนวทางลงมือทำ (shadcn/ui + Tailwind v4)

## 1. ตั้งค่าร่วม (ทั้ง `_liff` และ `_admin`)
```bash
npm uninstall @fontsource-variable/geist next-themes
npm i @fontsource-variable/inter
# วาง LINE Seed .woff2 ที่ public/fonts/ (ดู 01_DESIGN_SYSTEM.md)
```
- แทนที่ `src/index.css` ด้วยชุด CSS variables ใน `01_DESIGN_SYSTEM.md` ข้อ 5
- `components.json`: `"baseColor": "neutral"`, `"cssVariables": true`
- แก้ TS5101: ลบ `"baseUrl"` ใน `tsconfig.app.json` (คง `paths`)

## 2. Components ที่ใช้

### LIFF
```bash
npx shadcn@latest add button input textarea label badge card tabs toggle-group \
  drawer sheet skeleton sonner separator avatar calendar popover progress alert
```
| UI | shadcn | หมายเหตุ |
|---|---|---|
| ปุ่มหลักล่างจอ | `Button size="lg"` + `h-12 w-full` | wrapper `StickyActionBar` (padding `env(safe-area-inset-bottom)`) |
| แท็บ ต้องตาม/เลยกำหนด | `Tabs` | |
| chips (ขั้นตอน, ตามต่อ, สาเหตุ) | `ToggleGroup type="single"` | สร้าง variant `chip`: rounded-full, h-10, selected = ดำ |
| สถานะ 4 ช่อง (L9) | `ToggleGroup` แบบ segmented | สีเมื่อเลือกตามสถานะ |
| ชีทงานซ้ำ | `Drawer` (vaul) | |
| ป้ายสถานะ | `Badge` + variant ใหม่ `success/warning/danger/today/neutral` | |
| แจ้งข้อมูลซ้ำใต้ช่อง | `Alert` variant warning (สร้างเพิ่ม) | |
| วันที่ | `Popover` + `Calendar` (locale `th`, แสดง พ.ศ.) | |
| อัปโหลด | `Progress` | |

**Components ของเราเอง (`src/components/shared/`)**
`SiteCard` · `StatusBadge` · `WeekStrip` · `PhotoSlots` · `LocationField` · `PhoneField` (ตรวจซ้ำ) · `DateChips` · `StickyActionBar` · `Timeline` · `FlexPreview` · `EmptyState`

### Admin
```bash
npx shadcn@latest add sidebar breadcrumb button input select badge card tabs table \
  dropdown-menu dialog sheet skeleton sonner separator avatar calendar popover \
  chart tooltip toggle-group command checkbox alert-dialog
npx shadcn@latest add sidebar-07     # block: sidebar ยุบเหลือไอคอน
```
| UI | shadcn | หมายเหตุ |
|---|---|---|
| Layout | block `sidebar-07` | ปรับเมนูตาม 03 |
| ตารางหน้างาน | `Table` + `@tanstack/react-table` | ตามตัวอย่าง "data-table" ของ shadcn |
| ตัวกรองช่วงเวลา | `Popover` + `Calendar mode="range"` + preset | เก็บใน URL search params |
| ตัวกรองหลายค่า | `Command` ใน `Popover` (faceted filter ของตัวอย่าง data-table) | |
| กราฟ | `Chart` (Recharts) | config สีจาก `--success/--danger/#737373` |
| แก้ไขเซลล์/หน้างาน | `Sheet` ด้านขวา | |
| ยืนยันปิดบัญชี | `AlertDialog` | |

**Components ของเราเอง**
`StatRow` · `OutcomeBar` (แถบ stacked ในตาราง) · `DateRangeFilter` · `RepCell` · `ActivityHeatmap` · `Timeline` (ใช้ร่วมกับ LIFF) · `ExportDialog`

## 3. โครงโฟลเดอร์ที่แนะนำ (ตาม convention `_vite` ของ deli2you)
```
_liff/src/
  components/ui/          # shadcn
  components/shared/      # SiteCard, StatusBadge, WeekStrip, ...
  features/
    auth/                 # bootstrap auth, register, pending
    home/                 # L4
    report-new/           # L5, L6
    site/                 # L7, L9
    success/              # L8
    my-stats/             # L10
  lib/ (api-client, liff, format-th.ts, phone.ts, draft.ts)

_admin/src/
  components/layout/      # AppSidebar, SiteHeader, DateRangeFilter
  components/shared/      # StatRow, OutcomeBar, StatusBadge, Timeline
  features/
    dashboard/  reports/  sites/  followups/  reps/  options/  users/  export/
```

## 4. ลำดับการทำ (แนะนำ)
| ลำดับ | งาน | ผลลัพธ์ |
|---|---|---|
| 1 | Design tokens + ฟอนต์ + Badge/Button variants ทั้ง 2 แอป | หน้าตาเปลี่ยนทั้งระบบทันที |
| 2 | LIFF L4 (WeekStrip, SiteCard) + L7 | เซลล์เห็นงานชัด |
| 3 | LIFF L5 ใหม่ (ตำแหน่ง/รูปก่อน, ตรวจซ้ำทันที, chips, sticky) + L6 + L8 | ฟอร์มเร็วขึ้น ข้อมูลครบ |
| 4 | LIFF L9 + Flex card ใหม่ | |
| 5 | Admin layout `sidebar-07` + A4/A5 + A7 (อนุมัติ) | แอดมินใช้งานจริงได้ |
| 6 | Backend analytics API (04) | |
| 7 | Admin A1 + A2 + A3 + A6 | รายงานประสิทธิภาพ |
| 8 | A8 / A9 / A10 Export + LIFF L1–L3, L10 | ครบ |

## 5. Checklist คุณภาพก่อนส่งลูกค้า
- [ ] ทดสอบ LIFF บน Android + iPhone จริง กลางแจ้ง (ความสว่างจอสูง)
- [ ] input ทุกช่อง font-size ≥ 16px (iOS ไม่ซูม)
- [ ] ปุ่มล่างจอไม่ถูกแถบ home ของ iPhone บัง (`safe-area-inset-bottom`)
- [ ] ไม่มีข้อความไทยใช้น้ำหนัก 500/600
- [ ] สถานะทุกจุดมีไอคอน+ข้อความ
- [ ] ตาราง admin ใช้ `tabular-nums`
- [ ] ทุกกราฟมีมุมมองตาราง
- [ ] ข้อความ error บอกวิธีแก้
