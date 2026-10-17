# 02 — `_liff` Review

Stack: Vite 8, React 19, TS 6, Tailwind 4, shadcn (base-ui), React Query, zustand, `@line/liff` 2.31

## จุดที่ดีแล้ว
- Flow สร้างงานครบ: ตรวจซ้ำ → อัปโหลดรูป → สร้างงาน → `sendFlexToChat` → หน้า success
- `sendFlexToChat` เช็ก `context.type` ก่อนส่ง และไม่ทำให้การบันทึกล้มถ้าส่งไม่ได้
- ย่อรูปก่อนอัป (`image-compress.ts`), ปุ่ม GPS พร้อมข้อความ error ภาษาไทย
- FollowUpSheet บังคับวันตามต่อเมื่อสถานะ "ตามต่อ" และ invalidate query หลังบันทึก
- HomePage แท็บ ต้องตามวันนี้/เลยกำหนด/ทั้งหมด

---

## P0
| # | ปัญหา | ที่ไหน | แก้ |
|---|---|---|---|
| 1 | `tsc -b` error **TS5101 `baseUrl` deprecated** (TS 6) → `npm run build` ไม่ผ่าน | `tsconfig.app.json` | ลบ `"baseUrl": "."` แล้วใช้ `"paths": {"@/*": ["./src/*"]}` อย่างเดียว (TS ≥5 รองรับ) หรือใส่ `"ignoreDeprecations": "6.0"` ชั่วคราว — แก้แล้วรัน `tsc -b` ใหม่ อาจเจอ type error อื่นที่ถูกบังอยู่ |
| 2 | `VITE_API_URL=http://localhost:9100/api/v1` → บนมือถือเรียกไม่ได้ (และเป็น http ใน https = mixed content) | `.env` | dev ผ่าน tunnel ใช้ `https://lineapi.puekk.com/api/v1` |
| 3 | `liff.init` ล้มเหลวแต่แอปยัง render ต่อ | `main.tsx`, `liff-helpers.ts` | ถ้า init fail แสดงหน้า error ("กรุณาเปิดจากลิงก์ในกลุ่ม LINE") ไม่ render แอป |

## P1 — ฟังก์ชัน/UX
| # | ปัญหา | ที่ไหน | แก้ |
|---|---|---|---|
| 1 | **วันคาดการณ์สั่งของ** ส่ง `expectedOrderDate: ''` ตายตัว — ไม่มีช่องกรอก | `NewReportPage.tsx` | เพิ่ม date input (requirement รูป 04) |
| 2 | **ไม่มีอำเภอ/ตำบล** | `NewReportPage.tsx` | dropdown อำเภอ→ตำบล (นครราชสีมา + จังหวัดใกล้เคียงจาก config) หรือรับจาก reverse geocode ของ backend |
| 3 | รูป / ตำแหน่ง ไม่บังคับ | `NewReportPage.tsx` | requirement ระบุ "ภาพ 3 ภาพ + โลเคชั่น" → บังคับ GPS และรูป ≥1 (หรือให้ config) |
| 4 | ไม่มี route `/sites/:code` → deep link จากการ์ดในกลุ่มเปิดไม่ได้ | `AppRoutes.tsx` | เพิ่ม route + รองรับ `liff.state` (LIFF ส่ง path มาเป็น query ตอนเปิดครั้งแรก — `liff.init` จัดการ redirect ให้เมื่อ endpoint path ถูกต้อง) |
| 5 | DuplicateDialog แสดงรายการซ้ำ แต่ **ไม่มีปุ่ม "อัปเดตงานนี้"** ไปที่ follow-up ของงานเดิม | `DuplicateDialog.tsx` | เพิ่มปุ่มเปิด FollowUpSheet ของ siteCode นั้น (ถ้าเป็นเจ้าของ) |
| 6 | `meta: { invalidates }` ใน `useCreateSite` ไม่มีผล (ไม่มี global handler ใน QueryClient) → กลับหน้าแรกแล้วรายการไม่อัปเดต | `report-new/hooks.ts` | `onSuccess: () => queryClient.invalidateQueries({ queryKey: siteKeys.all })` |
| 7 | toast แสดง `err.message` ของ axios ("Request failed with status code 400") | `NewReportPage.tsx`, `FollowUpSheet.tsx` | ดึง `err.response.data.error.message` (ทำ helper ใน `api-client.ts` แบบ `ApiError` ของ `_vite`) |
| 8 | ไม่มี Idempotency-Key → กดซ้ำ/เน็ตหลุดได้งานซ้ำ | `report-new/service.ts` | สร้าง `crypto.randomUUID()` ต่อร่าง ส่ง header |
| 9 | รูปที่เล็กกว่า 1600px **ไม่ถูก re-encode** → PNG/HEIC ขนาดใหญ่ส่งไปตรง ๆ | `image-compress.ts` | encode เป็น JPEG ทุกครั้ง (หรือเมื่อ type ≠ jpeg / size > 1MB) |
| 10 | อัปโหลดรูปบางรูปล้ม → backend ข้ามเงียบ, frontend ไม่รู้ | `NewReportPage.tsx` | เทียบจำนวนที่ได้กับที่ส่ง แจ้งเตือน |
| 11 | ไม่มี draft — เน็ตหลุด/ปิด LIFF ข้อมูลหาย | — | autosave `localStorage` (try/catch) ตามแผน |
| 12 | หน้า `/test` + ปุ่ม "LIFF Test Page" โผล่ในหน้า login ให้เซลล์เห็น | `HomePage.tsx`, `AppRoutes.tsx` | แสดงเฉพาะ `import.meta.env.DEV` |
| 13 | 401 → `window.location.href = '/'` → login ใหม่ → ถ้า token ยังเสียซ้ำอาจวนลูป | `api-client.ts` | เคลียร์ store แล้วเรียก auth ใหม่ครั้งเดียว ไม่ reload ทั้งหน้า |
| 14 | token ถูกเก็บ 2 ที่ (`localStorage.token` + zustand persist) | `stores/auth.ts` | ใช้แหล่งเดียว |
| 15 | สถานะ `pending` (หลังแก้ backend) ยังไม่มีหน้ารองรับ | `HomePage.tsx` | หน้า "รอแอดมินอนุมัติ" แสดงชื่อ LINE ให้แจ้งแอดมิน |
| 16 | ส่งการ์ดไม่สำเร็จไม่มีข้อความบอก | `NewReportPage.tsx` | `toast.warning('บันทึกแล้ว แต่ส่งการ์ดเข้ากลุ่มไม่ได้')` |
| 17 | ยังไม่ได้ใช้ `react-hook-form` + `zod` ที่ติดตั้งไว้ (ใช้ useState หลายตัว + validate มือ) | `NewReportPage.tsx` | ย้ายเป็น schema เดียว ใช้ร่วมกับ follow-up |

## P2
- ลบ dependency ที่ไม่ใช้ (`shadcn` อยู่ใน dependencies ควรเป็น dev/CLI, `next-themes`)
- `dist/` ถูก build ทิ้งไว้ในโฟลเดอร์ (อยู่ใน `.gitignore` แล้ว OK)
- vConsole เมื่อ `?debug=1` สำหรับดีบักบนมือถือ
- ทดสอบตาม checklist ใน `plan/02_LIFF_VITE_PLAN.md` ข้อ 10 (iOS/Android, ปฏิเสธ permission, เปิดนอกกลุ่ม)
