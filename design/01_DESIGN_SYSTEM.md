# 01 — Design System

## 1. ฟอนต์

| บทบาท | ฟอนต์ | ใช้กับ |
|---|---|---|
| ภาษาไทย (ทั้งหมด) | **LINE Seed Sans TH** | ข้อความไทยทุกที่ — เข้ากับ LINE ที่เซลล์ใช้ทุกวัน |
| ตัวเลข / ภาษาอังกฤษ | **Inter** | ตัวเลข, รหัสงาน, เบอร์โทร, วันที่, ตาราง (ใช้ `font-variant-numeric: tabular-nums` ให้ตัวเลขตรงคอลัมน์) |

**ลำดับ font-family:** `"Inter", "LINE Seed Sans TH", system-ui, sans-serif`
Inter ไม่มีอักษรไทย → เบราว์เซอร์จะใช้ LINE Seed กับตัวไทยอัตโนมัติ ส่วนตัวเลข/อังกฤษได้ Inter (คมกว่า ตัวเลขกว้างเท่ากัน)

**น้ำหนักที่มีจริงของ LINE Seed Sans TH:** Thin 100 · Regular 400 · Bold 700 · ExtraBold 800 · Heavy 900 — **ไม่มี 500/600**
→ ห้ามใช้ `font-medium`/`font-semibold` กับข้อความไทย (เบราว์เซอร์จะปลอมน้ำหนัก) ใช้ 400 / 700 / 900 เท่านั้น

**ติดตั้ง (self-host):**
1. ดาวน์โหลดจากเว็บทางการ LINE Seed (seed.line.me) → แปลงเป็น `.woff2` (เช่น ด้วย `fonttools`/`woff2_compress`) วางที่ `public/fonts/`
2. Inter: `npm i @fontsource-variable/inter`
```css
@font-face { font-family: "LINE Seed Sans TH"; src: url("/fonts/LINESeedSansTH_Rg.woff2") format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "LINE Seed Sans TH"; src: url("/fonts/LINESeedSansTH_Bd.woff2") format("woff2"); font-weight: 700; font-display: swap; }
@font-face { font-family: "LINE Seed Sans TH"; src: url("/fonts/LINESeedSansTH_He.woff2") format("woff2"); font-weight: 900; font-display: swap; }
```
(ตอนนี้โปรเจกต์ใช้ `@fontsource-variable/geist` → เปลี่ยนเป็น Inter และลบ Geist)

## 2. ขนาดตัวอักษร (ภาษาไทยต้องการ line-height มากกว่าอังกฤษ)

| Token | LIFF | Admin | น้ำหนัก | line-height | ใช้กับ |
|---|---|---|---|---|---|
| `display` | 56px | 40px | 900 | 1.0 | ตัวเลขฮีโร่ (ต้องตามวันนี้ / KPI หลัก) — ใช้ที่เดียวต่อหน้า |
| `title` | 22px | 24px | 700 | 1.35 | หัวหน้าจอ |
| `heading` | 18px | 18px | 700 | 1.4 | หัวข้อส่วน / ชื่อลูกค้าในการ์ด |
| `body` | 16px | 14px | 400 | 1.6 | เนื้อหา, input (LIFF ห้ามต่ำกว่า 16px — iOS จะซูมเมื่อโฟกัส) |
| `small` | 14px | 13px | 400 | 1.5 | ข้อมูลรอง |
| `caption` | 12px | 12px | 400 | 1.4 | เวลา, หมายเหตุใต้ช่อง |

หลีกเลี่ยงตัวพิมพ์ใหญ่ทั้งหมด (ALL CAPS) กับป้ายกำกับ และไม่ใส่ป้ายเล็กเหนือทุกหัวข้อ

## 3. สี (Theme ขาว-ดำ)

### Neutral (shadcn base: `neutral`)
| Token | Hex | ใช้กับ |
|---|---|---|
| `background` | `#FFFFFF` | พื้นหลังหลัก |
| `surface` / `muted` | `#F5F5F5` | พื้นหลังส่วน, แถวตาราง hover, chip ไม่เลือก |
| `border` | `#E5E5E5` | เส้นขอบ |
| `muted-foreground` | `#737373` | ข้อความรอง |
| `foreground` / `primary` | `#0A0A0A` | ข้อความหลัก, ปุ่มหลัก (ดำ) |
| `primary-foreground` | `#FFFFFF` | ตัวอักษรบนปุ่มดำ |

### สถานะ (ใช้เฉพาะความหมายนี้ ห้ามใช้ตกแต่ง)
| Token | Solid | Soft bg | Text on soft | ความหมาย |
|---|---|---|---|---|
| `success` | `#16A34A` | `#DCFCE7` | `#15803D` | จบได้ / บันทึกสำเร็จ |
| `warning` | `#D97706` | `#FEF3C7` | `#B45309` | เลยกำหนดตาม / ข้อมูลไม่ครบ / อาจซ้ำ |
| `danger` | `#DC2626` | `#FEE2E2` | `#B91C1C` | จบที่อื่น / ลบ / error |
| `neutral-status` | `#737373` | `#F5F5F5` | `#404040` | ตามต่อ (ยังไม่ถึงกำหนด) / ยกเลิก |

ทุกสถานะแสดงพร้อม **ไอคอน + ข้อความ** (เช่น ✓ จบได้, ✕ จบที่อื่น, ⏰ เลย 3 วัน) ไม่พึ่งสีอย่างเดียว

### กราฟ (Admin)
- ผลลัพธ์งาน (stacked bar): จบได้ `#16A34A` · ตามต่อ `#737373` · จบที่อื่น `#DC2626` เรียงลำดับนี้เสมอ (เทาคั่นกลางแดง-เขียว ช่วยคนตาบอดสีแดง-เขียว) + ช่องว่าง 2px ระหว่างส่วน + ตัวเลขกำกับ + มีมุมมองตาราง
- แนวโน้ม (line): เส้นดำ 2px เส้นเดียว, เส้นเปรียบเทียบ (ค่าเฉลี่ยทีม) เทาประ
- ไม่ใช้กราฟวงกลม, ไม่ใช้ 2 แกน y

## 4. ระยะห่าง / ขนาด / มุม

| Token | ค่า | หมายเหตุ |
|---|---|---|
| ระยะขอบจอ LIFF | 16px | |
| ระยะห่างพื้นฐาน | 4px grid (4 / 8 / 12 / 16 / 24 / 32) | |
| ความสูงปุ่ม LIFF | **48px** (หลัก) / 40px (รอง) | ใช้งานหน้างาน มือเปื้อน |
| ความสูง input LIFF | 48px, ตัวอักษร 16px | |
| ความสูงปุ่ม Admin | 36px (default shadcn) | |
| มุมโค้ง | การ์ด/ชีท 12px · ปุ่ม/input 10px · badge 999px | ใช้ `--radius: 0.625rem` ของ shadcn |
| เงา | ใช้เฉพาะ bottom bar / sheet / dropdown ที่ลอยเหนือเนื้อหา | การ์ดทั่วไปใช้เส้นขอบ ไม่ใช้เงา |

## 5. CSS variables สำหรับ shadcn (Tailwind v4) — `src/index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --radius: 0.625rem;
  --background: #ffffff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --popover: #ffffff;
  --popover-foreground: #0a0a0a;
  --primary: #0a0a0a;
  --primary-foreground: #ffffff;
  --secondary: #f5f5f5;
  --secondary-foreground: #0a0a0a;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --accent: #f5f5f5;
  --accent-foreground: #0a0a0a;
  --destructive: #dc2626;
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #0a0a0a;

  /* status (เพิ่มเอง) */
  --success: #16a34a;   --success-soft: #dcfce7;  --success-ink: #15803d;
  --warning: #d97706;   --warning-soft: #fef3c7;  --warning-ink: #b45309;
  --danger:  #dc2626;   --danger-soft:  #fee2e2;  --danger-ink:  #b91c1c;

  /* sidebar (admin) */
  --sidebar: #fafafa;
  --sidebar-foreground: #0a0a0a;
  --sidebar-primary: #0a0a0a;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f0f0f0;
  --sidebar-accent-foreground: #0a0a0a;
  --sidebar-border: #e5e5e5;
  --sidebar-ring: #0a0a0a;
}

@theme inline {
  --font-sans: "Inter", "LINE Seed Sans TH", system-ui, sans-serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-success-ink: var(--success-ink);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-warning-ink: var(--warning-ink);
  --color-danger: var(--danger);
  --color-danger-soft: var(--danger-soft);
  --color-danger-ink: var(--danger-ink);
  /* ...ที่เหลือตาม template shadcn */
}

body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
.num { font-family: "Inter", sans-serif; font-variant-numeric: tabular-nums; }
```
Dark mode: ไม่ทำในเฟสนี้ (LIFF ใช้กลางแดด, admin ใช้ในออฟฟิศ) — ตัด `next-themes` ออกได้

## 6. ไอคอน
`lucide-react` ขนาด 20px (LIFF) / 16px (Admin), stroke 2
| ความหมาย | ไอคอน |
|---|---|
| ตำแหน่ง | `MapPin` · นำทาง `Navigation` |
| โทร | `Phone` |
| รูป | `Camera` / `ImagePlus` |
| ตามต่อ / วันที่ | `CalendarClock` |
| เลยกำหนด | `AlarmClock` |
| จบได้ | `CircleCheck` · จบที่อื่น `CircleX` · ยกเลิก `Ban` |
| อาจซ้ำ | `CopyCheck` |
| ส่งเข้ากลุ่ม | `Send` |

## 7. รูปแบบข้อมูลที่แสดง
| ข้อมูล | รูปแบบ | ตัวอย่าง |
|---|---|---|
| รหัสงาน | Inter 700 tabular, มี `#` นำหน้า | `#691017-03` |
| เบอร์โทร | `0XX-XXX-XXXX` | `089-716-5403` |
| วันที่ (ในแอป) | วัน เดือนย่อ ปี พ.ศ. 2 หลัก | `20 ต.ค. 69` |
| วันที่สัมพัทธ์ | ใช้คู่กับวันที่จริง | `พรุ่งนี้`, `อีก 3 วัน`, `เลย 2 วัน` |
| เวลา | 24 ชม. | `10:44` |
| % | ทศนิยม 0 ตำแหน่ง + จำนวนจริงในวงเล็บ | `38% (12/32)` |

## 8. ภาษา / ข้อความในระบบ
- ใช้คำที่ทีมใช้จริง: **หน้างาน, ช่าง, ตามต่อ, จบได้, จบที่อื่น, ผู้ตัดสินใจ** (ไม่ใช้ "site", "lead")
- ปุ่มบอกสิ่งที่เกิดขึ้นจริง: "บันทึกและส่งเข้ากลุ่ม" ไม่ใช่ "ตกลง" — และข้อความยืนยันใช้คำเดียวกัน "ส่งเข้ากลุ่มแล้ว"
- Error บอกว่าเกิดอะไรและทำอะไรต่อ: "อัปโหลดรูปไม่สำเร็จ 1 รูป — แตะเพื่อลองใหม่" ไม่ใช่ "เกิดข้อผิดพลาด"
- หน้าว่างชวนให้ทำ: "ไม่มีงานต้องตามวันนี้ — รายงานงานใหม่"

## 9. Accessibility ขั้นต่ำ
- คอนทราสต์ข้อความ ≥ 4.5:1 (ข้อความเทาใช้ `#737373` บนขาว = 4.7:1 ผ่าน)
- จุดแตะ ≥ 44×44px (LIFF ใช้ 48)
- focus ring ดำ 2px มองเห็นได้ (admin ใช้คีย์บอร์ด)
- `prefers-reduced-motion` ปิดแอนิเมชันชีท/ทรานซิชัน
