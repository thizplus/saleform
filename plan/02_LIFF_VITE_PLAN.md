# 02 — LIFF (Vite + React + TypeScript) — แผนการสร้าง

## 1. Stack (ตาม `_FOOD_DELIVERY/_vite`)

| ส่วน | ใช้ |
|---|---|
| Build | Vite 7 + React 19 + TypeScript 5.8 |
| UI | Tailwind v4 + shadcn/ui (radix) + lucide-react + sonner |
| Data | @tanstack/react-query + axios (`lib/api-client.ts` format เดียวกับ admin เดิม) |
| Form | react-hook-form + zod |
| State | zustand (auth, draft) |
| Router | react-router-dom v7 |
| LINE | `@line/liff` (+ `@line/liff-mock` ตอน dev บน desktop) |
| อื่น ๆ | `browser-image-compression` (ย่อรูปก่อนอัป), `date-fns` (+ แปลง พ.ศ.), `vconsole`/`eruda` (debug บนมือถือ เฉพาะ dev) |

## 2. LINE Developers Console

- สร้าง **LINE Login channel** ใต้ **Provider เดียวกับ OA** (สำคัญ: userId จะตรงกัน)
- เพิ่ม LIFF app:
  - Size: **Tall** (หรือ Full) — ฟอร์มยาว + กล้อง
  - Endpoint URL: `https://liff.<domain>/`
  - Scopes: `openid`, `profile`, **`chat_message.write`**
  - Add friend option (bot link): **Off** หรือ Normal (ไม่บังคับแอด OA)
- ได้ `LIFF_ID` + `LINE_LOGIN_CHANNEL_ID` (backend ใช้ verify ID token)

## 3. โครงโฟลเดอร์

```
_liff/
├── index.html
├── vite.config.ts            # alias @, server.allowedHosts: ['liff.<domain>']
├── src/
│   ├── main.tsx              # init LIFF ก่อน render
│   ├── App.tsx
│   ├── constants/            # api-routes.ts, app-config.ts, enums.ts (status, customer type ...)
│   ├── lib/
│   │   ├── api-client.ts     # axios + JWT interceptor + ApiError (copy pattern เดิม)
│   │   ├── liff.ts           # initLiff(), isInGroupChat(), sendCard(flex), closeOrBack()
│   │   ├── image.ts          # compress → File
│   │   └── thai-date.ts
│   ├── stores/auth-store.ts  # token, rep profile
│   ├── components/ui/        # shadcn
│   ├── components/shared/    # PhotoPicker, LocationButton, DateQuickPicker, StatusBadge, EmptyState
│   ├── features/
│   │   ├── auth/             # hooks: useLiffAuth (idToken → /liff/auth)
│   │   ├── sites/            # pages: MySitesPage, SiteDetailPage ; service.ts ; hooks.ts ; types.ts
│   │   ├── report-new/       # pages: NewReportPage ; components: DuplicateWarning ; schema.ts (zod)
│   │   └── report-followup/  # pages: FollowUpPage ; schema.ts
│   └── routes/index.tsx
└── Dockerfile + nginx.conf   # production static
```

## 4. Flow เปิดแอป

```
เซลล์กดลิงก์ในประกาศกลุ่ม → liff.init({ liffId })
  ├─ !liff.isLoggedIn() → liff.login()        (ในแอป LINE จะ login อัตโนมัติ)
  ├─ ctx = liff.getContext()  → ctx.type === 'group' ? canSendToChat = true
  ├─ idToken = liff.getIDToken() → POST /liff/auth → JWT (เก็บใน memory + sessionStorage)
  │     403 → หน้า "บัญชีนี้ยังไม่อยู่ในกลุ่มเซลล์ / รออนุมัติ"
  └─ route ตาม path (รองรับ deep link https://liff.line.me/{id}/sites/690825-01)
```

## 5. หน้าจอ

### 5.1 งานของฉัน (`/`)
- แท็บ: **ต้องตามวันนี้** (badge จำนวน) · **เลยกำหนด** · **ติดตามอยู่** · **ทั้งหมด**
- ค้นหา: ชื่อ / เบอร์ / รหัสงาน / อำเภอ
- การ์ดงาน: รหัส, ชื่อลูกค้า/ช่าง, อำเภอ, สถานะ, วันตามต่อ, ปุ่ม "อัปเดต"
- ปุ่มลอย **+ รายงานงานใหม่**

### 5.2 รายงานงานใหม่ (`/new`)
| ฟิลด์ | ชนิด | บังคับ |
|---|---|---|
| ตำแหน่งหน้างาน | ปุ่ม "ใช้ตำแหน่งปัจจุบัน" (`navigator.geolocation`) + แสดงที่อยู่ | ✅ |
| เบอร์โทร | tel, normalize | ✅ (หรือชื่อ) |
| → ตรวจซ้ำ | on blur เบอร์ / ได้ตำแหน่ง → `GET /liff/sites/check-duplicate` → ถ้าเจอ: "พบหน้างาน #690825-02 ใกล้/เบอร์ตรง" [ไปอัปเดตงานนี้] [เป็นหน้างานใหม่] | — |
| ชื่อลูกค้า + ประเภท | text + chips (เจ้าของ / ช่าง / ผู้รับเหมา) | |
| ชื่อช่าง | text | |
| ผู้มีอำนาจตัดสินใจ | chips (เจ้าของบ้าน / ช่าง / อื่น ๆ) | |
| ขั้นตอนหน้างาน | select (จาก config) | |
| รายละเอียด | textarea | |
| คาดการณ์วันสั่ง | date | |
| ตามต่อ | chips **+2 วัน / +3 / +7 / +14** + date picker | ✅ |
| รูป | 1–3 รูป, `<input accept="image/*" capture="environment">`, ย่อ ≤ 1600px | ✅ ≥1 |

ปุ่มบันทึก → อัปโหลดรูป → `POST /liff/sites` → ได้ `{site, flexMessage}` → sendCard → หน้า success

### 5.3 รายละเอียดหน้างาน (`/sites/:code`)
- ข้อมูลหลัก, ปุ่มโทร (`tel:`), ปุ่มเปิด Google Maps, แกลเลอรีรูป, **timeline** รายงานทุกครั้ง
- ปุ่ม "อัปเดตงานนี้" (ถ้าเป็นเจ้าของงาน)
- เพื่อนในกลุ่มกดการ์ด → เปิดหน้านี้แบบอ่านอย่างเดียว

### 5.4 อัปเดต / Follow-up (`/sites/:code/follow-up`)
| ฟิลด์ | ชนิด |
|---|---|
| ความคืบหน้า | textarea ✅ |
| สถานะ | ตามต่อ / จบได้ / จบที่อื่น / ยกเลิก ✅ |
| ถ้า **ตามต่อ** | วันตามต่อ ✅ |
| ถ้า **จบที่อื่น** | สาเหตุ (select) ✅ + คู่แข่ง |
| ถ้า **จบได้** | (optional) มูลค่า/หมายเหตุ |
| ขั้นตอน / ผู้ตัดสินใจ | แก้ได้ |
| รูปเพิ่ม | 0–3 |

### 5.5 Success
- ส่งการ์ดเข้ากลุ่มสำเร็จ → "✅ บันทึก #691017-03 และส่งเข้ากลุ่มแล้ว" + ปุ่มปิด (`liff.closeWindow()`)
- ไม่ได้เปิดจากกลุ่ม / ผู้ใช้ไม่อนุญาต scope / sendMessages error → "บันทึกแล้ว แต่ส่งการ์ดเข้ากลุ่มไม่ได้" (ข้อมูลไม่หาย)

## 6. ส่งการ์ดเข้ากลุ่ม

```ts
// lib/liff.ts
export async function sendCard(flex: FlexMessage): Promise<'sent' | 'skipped' | 'failed'> {
  const ctx = liff.getContext()
  if (!liff.isInClient() || !ctx || !['group', 'room', 'utou'].includes(ctx.type)) return 'skipped'
  try {
    await liff.sendMessages([flex])      // ส่งในนามผู้ใช้ → ไม่เสียโควต้า OA
    return 'sent'
  } catch (e) {
    console.warn('sendMessages failed', e) // 403 = ยังไม่อนุญาต chat_message.write
    return 'failed'
  }
}
```
- ส่ง `flexMessage` ที่ backend สร้างมาเท่านั้น (ไม่สร้างฝั่ง LIFF) → หน้าตาการ์ดควบคุมที่เดียว
- Flex ที่ส่งผ่าน `sendMessages` **ไม่ยิง webhook** → backend ไม่ต้องกันซ้ำจาก webhook

## 7. Offline / สัญญาณอ่อน
- autosave ฟอร์มลง `localStorage` (try/catch) ทุก 2 วินาที → เปิดใหม่มีปุ่ม "กู้ร่างล่าสุด"
- รูปที่ย่อแล้วเก็บใน IndexedDB ระหว่างรอส่ง
- ปุ่มบันทึกแสดงสถานะอัปโหลดทีละรูป + retry
- ใส่ `Idempotency-Key` (uuid ต่อร่าง) ทุก POST → กดซ้ำ/เน็ตหลุดไม่สร้างงานซ้ำ (backend middleware แบบ deli2you)

## 8. Dev Setup
- `vite` dev server port 5173 → Cloudflare Tunnel `liff.<domain>` → `http://host.docker.internal:5173` (ต้องตั้ง `server.allowedHosts` และ HMR `clientPort: 443`)
- เปิดบน desktop: ใช้ `@line/liff-mock` (ตั้ง `VITE_LIFF_MOCK=true`)
- บนมือถือ: เปิด vConsole เมื่อ `?debug=1`
- `.env`: `VITE_LIFF_ID`, `VITE_API_URL`, `VITE_LIFF_MOCK`

## 9. ขั้นตอนการสร้าง (LIFF)

| ขั้น | งาน | ผ่านเมื่อ |
|---|---|---|
| **L0** (M1) | scaffold Vite + Tailwind + shadcn, หน้าเดียว: แสดง `getContext().type`, ปุ่ม `sendMessages` text ทดสอบ | ปักลิงก์ในประกาศกลุ่มทดสอบ → ขึ้น `group` + ข้อความขึ้นในชื่อเรา |
| **L1** (M2) | `lib/liff.ts`, `api-client.ts`, auth flow + หน้า 403 | ได้ JWT, คนนอกกลุ่มถูกปฏิเสธ |
| **L2** | งานของฉัน (list + tabs + search) | แสดงข้อมูลจาก API |
| **L3** | ฟอร์มงานใหม่ + GPS + รูป + ตรวจซ้ำ | สร้างงานได้, รูปเข้า R2 |
| **L4** | sendCard + success/fail states | การ์ดขึ้นกลุ่ม, กดการ์ดเปิด deep link ได้ |
| **L5** | รายละเอียดหน้างาน + timeline | |
| **L6** | follow-up + เงื่อนไขสถานะ | สถานะ/วันตามต่อ update ถูก |
| **L7** (M5) | draft/offline, idempotency, ทดสอบ Android+iOS, build Docker/nginx | checklist ข้อ 10 ผ่าน |

## 10. Test Checklist บนมือถือจริง
- [ ] เปิดจากประกาศกลุ่ม / จากข้อความในกลุ่ม / จากแชท 1:1 / จาก browser นอก LINE
- [ ] ปฏิเสธ permission ส่งข้อความ → ยังบันทึกได้
- [ ] ปฏิเสธ GPS → แสดงวิธีเปิด / ให้ปักหมุดเอง
- [ ] ถ่ายรูป 3 รูปจากกล้อง (iOS HEIC → ต้องแปลงเป็น JPEG)
- [ ] เน็ตหลุดตอนอัปโหลด → กู้ร่าง + ส่งซ้ำไม่เกิดงานซ้ำ
- [ ] deep link `/sites/:code` จากการ์ด
- [ ] เซลล์ A เปิดงานของเซลล์ B → อ่านได้อย่างเดียว
