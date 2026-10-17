import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { sendFlexToChat } from '@/lib/liff-helpers'
import { addDays } from '@/lib/thai-date'
import { PhotoPicker } from '../components/PhotoPicker'
import { GPSButton } from '../components/GPSButton'
import { FollowUpDateChips } from '../components/FollowUpDateChips'
import { DuplicateDialog } from '../components/DuplicateDialog'
import { useOptions, useUploadPhotos, useCreateSite, useCheckDuplicate } from '../hooks'
import type { DuplicateMatch } from '../types'

const DRAFT_KEY = 'liff-new-report-draft'

interface FormData {
  lat: number | null
  lng: number | null
  accuracy: number | null
  tambon: string
  amphoe: string
  photos: { file: File; preview: string }[]
  phone: string
  customerName: string
  contractorName: string
  contactType: string
  decisionMaker: string
  stage: string
  detail: string
  nextFollowUpDate: string
  expectedOrder: string
}

const defaultForm: FormData = {
  lat: null, lng: null, accuracy: null,
  tambon: '', amphoe: '',
  photos: [],
  phone: '', customerName: '', contractorName: '',
  contactType: '', decisionMaker: '',
  stage: '', detail: '',
  nextFollowUpDate: addDays(7),
  expectedOrder: '',
}

/** L5 — รายงานงานใหม่ */
export function NewReportPage() {
  const navigate = useNavigate()
  const { data: options } = useOptions()
  const uploadMutation = useUploadPhotos()
  const createMutation = useCreateSite()
  const dupCheck = useCheckDuplicate()

  const [form, setForm] = useState<FormData>(() => {
    // โหลดร่างจาก localStorage
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...defaultForm, ...parsed, photos: [] } // photos ไม่เก็บใน draft
      }
    } catch { /* ignore */ }
    return defaultForm
  })

  const [submitting, setSubmitting] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([])
  const [phoneWarning, setPhoneWarning] = useState<DuplicateMatch | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)

  // ตรวจซ้ำเบอร์เมื่อครบ 10 หลัก
  const digits = form.phone.replace(/\D/g, '')
  useEffect(() => {
    if (digits.length === 10) {
      dupCheck.mutateAsync({ phone: digits }).then((res) => {
        if (res.hasDuplicate && res.matches.length > 0) {
          setPhoneWarning(res.matches[0])
        } else {
          setPhoneWarning(null)
        }
      }).catch(() => {})
    } else {
      setPhoneWarning(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

  // Autosave draft
  useEffect(() => {
    const timer = setTimeout(() => {
      const { photos, ...rest } = form
      localStorage.setItem(DRAFT_KEY, JSON.stringify(rest))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
    }, 1000)
    return () => clearTimeout(timer)
  }, [form])

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  // คำนวณสิ่งที่ยังขาด
  const missing: string[] = []
  if (!form.lat) missing.push('ตำแหน่ง')
  if (form.photos.length === 0) missing.push('รูป')
  if (!form.phone && !form.customerName) missing.push('เบอร์หรือชื่อ')
  if (!form.nextFollowUpDate) missing.push('วันนัดตาม')

  const canSubmit = missing.length === 0

  async function handleSubmit(forceNew = false) {
    if (!canSubmit && !forceNew) return
    setSubmitting(true)

    try {
      // 1. ตรวจซ้ำ (ถ้ายังไม่ force)
      if (!forceNew && digits.length === 10) {
        const dupResult = await dupCheck.mutateAsync({ phone: digits, lat: form.lat, lng: form.lng })
        if (dupResult.hasDuplicate) {
          setDuplicateMatches(dupResult.matches)
          setShowDuplicate(true)
          setSubmitting(false)
          return
        }
      }

      // 2. อัปโหลดรูป
      let photoIds: string[] = []
      if (form.photos.length > 0) {
        const uploadResult = await uploadMutation.mutateAsync(form.photos.map((p) => p.file))
        photoIds = uploadResult.files.map((f) => f.id)
      }

      // 3. สร้างงานใหม่
      const result = await createMutation.mutateAsync({
        phone: digits,
        customerName: form.customerName,
        customerType: form.contactType,
        contractorName: form.contractorName,
        decisionMaker: form.decisionMaker,
        stage: form.stage,
        detail: form.detail,
        lat: form.lat,
        lng: form.lng,
        address: `${form.tambon} ${form.amphoe}`.trim(),
        expectedOrderDate: form.expectedOrder,
        nextFollowUpDate: form.nextFollowUpDate,
        photoIds,
        forceNew,
      })

      // 4. ส่ง Flex Card
      if (result.flexMessage) {
        const sent = await sendFlexToChat(result.flexMessage)
        if (sent) toast.success('ส่งการ์ดเข้ากลุ่มแล้ว')
      }

      // 5. ลบ draft แล้วไปหน้าสำเร็จ
      localStorage.removeItem(DRAFT_KEY)
      navigate(`/success?code=${result.site.siteCode}&name=${encodeURIComponent(result.site.customerName)}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  // ขั้นตอนหน้างาน (จาก config หรือค่าตัวอย่าง)
  const stages = options?.stages || ['เทฐาน', 'ตั้งเสา', 'ขึ้นโครง', 'รอมุง', 'วางแปลน', 'อื่นๆ']
  const decisionMakers = options?.decisionMakers || ['เจ้าของบ้าน', 'ช่าง', 'อื่นๆ']
  const contactTypes = ['เจ้าของ', 'ช่าง', 'ผู้รับเหมา']

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1" aria-label="กลับ">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-bold flex-1">รายงานงานใหม่</h1>
        {draftSaved && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="size-3" /> ร่างบันทึกแล้ว
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-36">
        {/* ===== ส่วนที่ 1: หน้างาน ===== */}
        <section className="space-y-3">
          <h2 className="text-base font-bold">หน้างาน</h2>

          <GPSButton
            lat={form.lat}
            lng={form.lng}
            onLocation={(la, ln, acc) => {
              update('lat', la)
              update('lng', ln)
              update('accuracy', acc ?? null)
            }}
          />

          {form.lat && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 mt-0.5 shrink-0" />
              <div>
                <p>
                  {form.tambon && `ต.${form.tambon} `}
                  {form.amphoe && `อ.${form.amphoe}`}
                  {!form.tambon && !form.amphoe && `${form.lat.toFixed(5)}, ${form.lng?.toFixed(5)}`}
                </p>
                {form.accuracy && (
                  <p className="text-xs">ความแม่นยำ ±{Math.round(form.accuracy)} ม.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="tambon" className="text-sm">ตำบล</Label>
              <Input
                id="tambon"
                value={form.tambon}
                onChange={(e) => update('tambon', e.target.value)}
                placeholder="ในเมือง"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="amphoe" className="text-sm">อำเภอ</Label>
              <Input
                id="amphoe"
                value={form.amphoe}
                onChange={(e) => update('amphoe', e.target.value)}
                placeholder="เมือง"
                className="h-12 text-base"
              />
            </div>
          </div>
        </section>

        {/* ===== ส่วนที่ 2: รูปหน้างาน ===== */}
        <section className="space-y-3">
          <h2 className="text-base font-bold">รูปหน้างาน (1–3)</h2>
          <PhotoPicker
            photos={form.photos}
            onChange={(photos) => update('photos', photos)}
          />
        </section>

        {/* ===== ส่วนที่ 3: ผู้ติดต่อ ===== */}
        <section className="space-y-3">
          <h2 className="text-base font-bold">ผู้ติดต่อ</h2>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm">เบอร์โทร *</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="h-12 text-base num"
            />
            {phoneWarning && (
              <div className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <div>
                  <p>เบอร์นี้มีงาน <span className="font-bold num">#{phoneWarning.siteCode}</span></p>
                  <p>ของ{phoneWarning.ownerName}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customerName" className="text-sm">ชื่อลูกค้า</Label>
            <Input
              id="customerName"
              value={form.customerName}
              onChange={(e) => update('customerName', e.target.value)}
              placeholder="ชื่อลูกค้า / ชื่อโครงการ"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contractorName" className="text-sm">ชื่อช่าง</Label>
            <Input
              id="contractorName"
              value={form.contractorName}
              onChange={(e) => update('contractorName', e.target.value)}
              placeholder="ชื่อช่าง"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">ผู้ติดต่อคือ</Label>
            <ChipGroup
              options={contactTypes}
              value={form.contactType}
              onChange={(v) => update('contactType', v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">ผู้มีอำนาจตัดสินใจ</Label>
            <ChipGroup
              options={decisionMakers}
              value={form.decisionMaker}
              onChange={(v) => update('decisionMaker', v)}
            />
          </div>
        </section>

        {/* ===== ส่วนที่ 4: รายละเอียดหน้างาน ===== */}
        <section className="space-y-3">
          <h2 className="text-base font-bold">รายละเอียดหน้างาน</h2>

          <div className="space-y-1.5">
            <Label className="text-sm">ขั้นตอนตอนนี้</Label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {stages.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  selected={form.stage === s}
                  onClick={() => update('stage', form.stage === s ? '' : s)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="detail" className="text-sm">รายละเอียด</Label>
            <Textarea
              id="detail"
              value={form.detail}
              onChange={(e) => update('detail', e.target.value)}
              placeholder="เช่น ช่างให้เข้ามาวัดหน้างาน..."
              rows={4}
              className="text-base"
            />
          </div>
        </section>

        {/* ===== ส่วนที่ 5: นัดหมาย ===== */}
        <section className="space-y-3">
          <h2 className="text-base font-bold">นัดหมาย</h2>

          <div className="space-y-1.5">
            <Label className="text-sm">ตามต่อ *</Label>
            <FollowUpDateChips
              value={form.nextFollowUpDate}
              onChange={(d) => update('nextFollowUpDate', d)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">คาดว่าจะสั่งของ</Label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {['ไม่ทราบ', 'ภายใน 2 สัปดาห์', 'ภายในเดือน'].map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={form.expectedOrder === opt}
                  onClick={() => update('expectedOrder', form.expectedOrder === opt ? '' : opt)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ===== Sticky Action Bar ===== */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {missing.length > 0 && (
          <p className="text-xs text-muted-foreground mb-2">
            ขาด: {missing.join(', ')}
          </p>
        )}
        <Button
          onClick={() => handleSubmit(false)}
          disabled={submitting || !canSubmit}
          size="xl"
          className="w-full"
        >
          {submitting ? 'กำลังบันทึก...' : 'บันทึกและส่งเข้ากลุ่ม'}
        </Button>
      </div>

      {/* Duplicate Dialog */}
      {showDuplicate && (
        <DuplicateDialog
          matches={duplicateMatches}
          onForceNew={() => {
            setShowDuplicate(false)
            handleSubmit(true)
          }}
          onCancel={() => setShowDuplicate(false)}
        />
      )}
    </div>
  )
}

/** Chip button สำหรับเลือกค่าเดียว */
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold border transition-colors ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-foreground border-input hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )
}

/** กลุ่ม Chip เลือกได้ 1 */
function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <Chip
          key={opt}
          label={opt}
          selected={value === opt}
          onClick={() => onChange(value === opt ? '' : opt)}
        />
      ))}
    </div>
  )
}
