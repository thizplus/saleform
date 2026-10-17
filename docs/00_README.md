# UP Steel Sales Report Bot — สรุปการวิเคราะห์ (17 ต.ค. 2569)

ระบบเก็บรายงานการวิ่งงานของเซลล์จาก **กลุ่ม LINE ปกติ** โดยเชิญ **LINE OA (bot)** เข้ากลุ่ม แล้วรับข้อความผ่าน **Webhook** มาประมวลผลด้วย **Go Fiber (Clean Architecture)**

---

## คำตอบสั้น ๆ

| คำถาม | คำตอบ |
|---|---|
| เชิญ LINE OA เข้ากลุ่มธรรมดา แล้วเก็บข้อมูลด้วย webhook ได้ไหม | **ได้ และเป็นวิธีที่ถูกต้อง** — ต้องเปิด *Allow bot to join group chats* ใน LINE Developers Console, bot จะได้ webhook ทุกข้อความในกลุ่ม (text / image / location / unsend / edit) พร้อม `groupId` + `userId` ของคนส่ง |
| OA Free ใช้ได้ไหม (คำถามน้าอร) | **ใช้ได้** — การรับ webhook และ *reply message* ไม่นับโควต้า แต่ **แนะนำเปิด OA ใหม่แยก** (ฟรีเหมือนกัน) ไม่ใช้ตัวที่คุยกับลูกค้า ดูเหตุผลใน `01_FEASIBILITY_LINE_OA.md` |
| ข้อมูลจะเก็บได้ถูกต้องไหม | ข้อความ *ดิบ* เก็บได้ครบ 100% ส่วนที่เสี่ยงคือ **การแยกฟิลด์ (parse)** และ **การจับคู่ว่าเป็นงานใหม่หรือ follow-up** → แก้ด้วย 3 ชั้น: template มาตรฐาน + bot ตอบยืนยันพร้อม "รหัสงาน" + คิว "รอตรวจ" ให้แอดมิน |
| Follow-up จะผูกกับงานเดิมยังไง | ลำดับความแม่น: ① กด **"ตอบกลับ" (quote)** ข้อความเดิม ② ใส่ **รหัสงาน** ③ เบอร์โทร ④ ระยะห่างโลเคชั่น ≤ ~150 ม. → ถ้าไม่ชัวร์ เข้าคิวรอตรวจ |
| แจ้งเตือนวันที่ต้องตาม | ทำได้ แต่ **push เข้ากลุ่มนับโควต้าตามจำนวนสมาชิก** (กลุ่ม 16 คน = 16 ข้อความ/ครั้ง, Free มี 300/เดือน) → ใช้ dashboard + reply ฟรี หรืออัปเป็น Basic |
| จำลองบน Docker Desktop | ได้ — ใช้ **Cloudflare Tunnel** เปิดโดเมน HTTPS ให้ LINE ยิง webhook เข้าเครื่อง, ใช้ **Cloudflare R2** เก็บรูป (R2 เป็น storage ไม่ได้ทำหน้าที่เปิดโดเมน) |

---

## เอกสารในโฟลเดอร์นี้

| ไฟล์ | เนื้อหา |
|---|---|
| `01_FEASIBILITY_LINE_OA.md` | ความเป็นไปได้, ข้อจำกัด LINE, OA Free vs เปิดใหม่, ค่าใช้จ่าย |
| `02_DATA_CAPTURE_PARSING_MATCHING.md` | **หัวใจของระบบ** — วิเคราะห์ข้อความจริงของเซลล์, การรวมข้อความเป็น 1 รายงาน, parse, แยกงานใหม่/follow-up, กันข้อมูลซ้ำ, template ที่เสนอ |
| `03_BACKEND_GOFIBER_STRUCTURE.md` | โครงสร้างโปรเจกต์ Go Fiber ตามแบบ `_FOOD_DELIVERY`, models, endpoints, flow |
| `04_REPORTS_KPI.md` | รายงาน/KPI ตามความต้องการ (รูป 04), export Excel ให้ตรงชีทเดิม |
| `05_LOCAL_DEV_DOCKER_TUNNEL.md` | docker-compose + Cloudflare Tunnel + R2 สำหรับจำลอง |
| `06_CHECKLIST_TO_PREPARE.md` | สิ่งที่ต้องเตรียม + คำถามที่ต้องถามน้าอร + แผนแบ่งเฟส |

---

## ภาพรวม Flow

```
เซลล์พิมพ์ในกลุ่ม LINE (เหมือนเดิม)
        │  text / รูป 1-3 รูป / แชร์โลเคชั่น
        ▼
LINE Platform ──webhook (HTTPS POST)──► Cloudflare ──Tunnel──► Go Fiber API (Docker)
                                                                  │
                         1. verify X-Line-Signature               │
                         2. บันทึก raw event (กันซ้ำด้วย webhookEventId)
                         3. ตอบ 200 ทันที                           │
                                                                  ▼
                                                        Worker (Redis queue)
                         ├─ ดาวน์โหลดรูป → R2
                         ├─ รวมข้อความ text+รูป+location เป็น 1 "รายงาน"
                         ├─ parse ฟิลด์ (rule-based + LLM fallback ถ้าต้องการ)
                         ├─ จับคู่: งานใหม่ / follow-up ของหน้างานเดิม
                         ├─ ไม่ชัวร์ → คิว "รอตรวจ"
                         └─ reply ยืนยันในกลุ่ม: "✅ บันทึก #691017-03 ..." (ฟรี)
                                                                  ▼
                                   PostgreSQL ──► Admin Dashboard / Export Excel / KPI
```

**หลักสำคัญ:** เก็บ *raw event ทุกตัว* ไว้เสมอ แล้วค่อย parse — ถ้าวันหลังปรับ parser ให้ฉลาดขึ้น สามารถ re-parse ข้อมูลย้อนหลังได้ทั้งหมด ไม่มีข้อมูลหาย

---

## แหล่งอ้างอิง

- LINE — Group chats: https://developers.line.biz/en/docs/messaging-api/group-chats/
- LINE — Receive messages (webhook, redelivery, unsend, edit): https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- LINE — Get user IDs (member IDs เฉพาะ verified/premium): https://developers.line.biz/en/docs/messaging-api/getting-user-ids/
- LINE — Messaging API pricing (reply ฟรี, push เข้ากลุ่มนับตามจำนวนคน): https://developers.line.biz/en/docs/messaging-api/pricing/
- ราคาแพ็กเกจ LINE OA ไทย: https://yespress.io/line-company-thailand
