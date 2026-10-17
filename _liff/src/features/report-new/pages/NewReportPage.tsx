import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { sendChatMessages } from '@/lib/liff-helpers'
import { addDays } from '@/lib/thai-date'
import { PhotoPicker } from '../components/PhotoPicker'
import { GPSButton } from '../components/GPSButton'
import { FollowUpDateChips } from '../components/FollowUpDateChips'
import { DuplicateDialog } from '../components/DuplicateDialog'
import { UploadProgressSheet, type UploadStep } from '../components/UploadProgressSheet'
import { useOptions, useCreateSite, useCheckDuplicate } from '../hooks'
import { reportNewService } from '../service'
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
  const createMutation = useCreateSite()
  const dupCheck = useCheckDuplicate()

  const [form, setForm] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...defaultForm, ...parsed, photos: [] }
      }
    } catch { /* ignore */ }
    return defaultForm
  })

  const [submitting, setSubmitting] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([])
  const [phoneWarning, setPhoneWarning] = useState<DuplicateMatch | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([])
  const [showProgress, setShowProgress] = useState(false)
  const idempotencyKeyRef = useRef(crypto.randomUUID())

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

  // สิ่งที่ยังขาด
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
      if (!forceNew && digits.length === 10) {
        const dupResult = await dupCheck.mutateAsync({ phone: digits, lat: form.lat, lng: form.lng })
        if (dupResult.hasDuplicate) {
          setDuplicateMatches(dupResult.matches)
          setShowDuplicate(true)
          setSubmitting(false)
          return
        }
      }

      let photoIds: string[] = []
      if (form.photos.length > 0) {
        const steps: UploadStep[] = form.photos.map((_, i) => ({
          label: `อัปโหลดรูปที่ ${i + 1}`,
          status: 'pending' as const,
        }))
        steps.push({ label: 'บันทึกข้อมูล', status: 'pending' })
        steps.push({ label: 'ส่งเข้ากลุ่ม', status: 'pending' })
        setUploadSteps(steps)
        setShowProgress(true)

        for (let i = 0; i < form.photos.length; i++) {
          setUploadSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'uploading' } : s))
          try {
            const result = await reportNewService.uploadPhotos([form.photos[i].file])
            photoIds.push(...result.files.map((f) => f.id))
            setUploadSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s))
          } catch {
            setUploadSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'error' } : s))
            throw new Error(`อัปโหลดรูปที่ ${i + 1} ไม่สำเร็จ`)
          }
        }
        setUploadSteps((prev) => prev.map((s, idx) => idx === form.photos.length ? { ...s, status: 'uploading' } : s))
      } else {
        setUploadSteps([
          { label: 'บันทึกข้อมูล', status: 'uploading' },
          { label: 'ส่งเข้ากลุ่ม', status: 'pending' },
        ])
        setShowProgress(true)
      }

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
        address: [form.tambon && `ต.${form.tambon}`, form.amphoe && `อ.${form.amphoe}`].filter(Boolean).join(' '),
        tambon: form.tambon,
        amphoe: form.amphoe,
        expectedOrderDate: form.expectedOrder,
        nextFollowUpDate: form.nextFollowUpDate,
        photoIds,
        forceNew,
        idempotencyKey: idempotencyKeyRef.current,
      })

      setUploadSteps((prev) => prev.map((s) =>
        s.label === 'บันทึกข้อมูล' ? { ...s, status: 'done' } :
        s.label === 'ส่งเข้ากลุ่ม' ? { ...s, status: 'uploading' } : s
      ))

      let sent = false
      if (result.chatMessages?.length) {
        sent = await sendChatMessages(result.chatMessages)
        if (sent) toast.success('ส่งเข้ากลุ่มแล้ว')
      }

      setUploadSteps((prev) => prev.map((s) => s.label === 'ส่งเข้ากลุ่ม' ? { ...s, status: 'done' } : s))

      localStorage.removeItem(DRAFT_KEY)
      setTimeout(() => {
        setShowProgress(false)
        navigate(`/success?code=${result.site.siteCode}&name=${encodeURIComponent(result.site.customerName)}&sent=${sent}`)
      }, 500)
    } catch (err) {
      setShowProgress(false)
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  const stages = options?.stages || ['เริ่มก่อสร้าง', 'กำลังสร้าง', 'ใกล้เสร็จ', 'รอตัดสินใจ', 'เสนอราคาแล้ว', 'อื่นๆ']
  const decisionMakers = options?.decisionMakers || ['เจ้าของบ้าน', 'ช่าง', 'อื่นๆ']
  const contactTypes = ['เจ้าของ', 'ช่าง', 'ผู้รับเหมา']

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 h-12 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1" aria-label="กลับ">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-bold flex-1">รายงานงานใหม่</h1>
        {draftSaved && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="size-3" /> บันทึกร่าง
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-28">
        {/* ===== ตำแหน่ง + รูป ===== */}
        <section className="space-y-3">
          <Label className="text-sm font-bold">ตำแหน่งหน้างาน *</Label>
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
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5 mt-0.5 shrink-0" />
              <span>
                {form.lat.toFixed(5)}, {form.lng?.toFixed(5)}
                {form.accuracy && ` (±${Math.round(form.accuracy)}ม.)`}
              </span>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <Label className="text-sm font-bold">รูปหน้างาน * <span className="font-normal text-muted-foreground">({form.photos.length}/6)</span></Label>
          <PhotoPicker
            photos={form.photos}
            onChange={(photos) => update('photos', photos)}
            max={6}
          />
        </section>

        {/* ===== ผู้ติดต่อ ===== */}
        <section className="space-y-3">
          <Label className="text-sm font-bold">ผู้ติดต่อ</Label>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs text-muted-foreground">เบอร์โทร *</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="h-10 text-base num"
            />
            {phoneWarning && (
              <div className="rounded-lg bg-warning-soft px-3 py-1.5 text-xs text-warning-ink flex items-start gap-2">
                <span className="shrink-0">⚠</span>
                <span>เบอร์นี้มีงาน <span className="font-bold num">#{phoneWarning.siteCode}</span> ของ{phoneWarning.ownerName}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="customerName" className="text-xs text-muted-foreground">ชื่อลูกค้า</Label>
              <Input id="customerName" value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder="ชื่อลูกค้า" className="h-10 text-base" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contractorName" className="text-xs text-muted-foreground">ชื่อช่าง</Label>
              <Input id="contractorName" value={form.contractorName} onChange={(e) => update('contractorName', e.target.value)} placeholder="ชื่อช่าง" className="h-10 text-base" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="amphoe" className="text-xs text-muted-foreground">อำเภอ</Label>
              <Input id="amphoe" value={form.amphoe} onChange={(e) => update('amphoe', e.target.value)} placeholder="อำเภอ" className="h-10 text-base" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ผู้ติดต่อคือ</Label>
              <ChipRow options={contactTypes} value={form.contactType} onChange={(v) => update('contactType', v)} />
            </div>
          </div>
        </section>

        {/* ===== รายละเอียด ===== */}
        <section className="space-y-3">
          <Label className="text-sm font-bold">รายละเอียด</Label>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">ขั้นตอน</Label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
              {stages.map((s) => (
                <Chip key={s} label={s} selected={form.stage === s} onClick={() => update('stage', form.stage === s ? '' : s)} />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="detail" className="text-xs text-muted-foreground">หมายเหตุ</Label>
            <Textarea
              id="detail"
              value={form.detail}
              onChange={(e) => update('detail', e.target.value)}
              placeholder="สิ่งที่พบ / คุยกับลูกค้า..."
              rows={3}
              className="text-base"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">ผู้ตัดสินใจ</Label>
            <ChipRow options={decisionMakers} value={form.decisionMaker} onChange={(v) => update('decisionMaker', v)} />
          </div>
        </section>

        {/* ===== นัดหมาย ===== */}
        <section className="space-y-3">
          <Label className="text-sm font-bold">นัดติดตาม *</Label>
          <FollowUpDateChips
            value={form.nextFollowUpDate}
            onChange={(d) => update('nextFollowUpDate', d)}
          />

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">คาดว่าจะสั่งของ</Label>
            <ChipRow
              options={['ไม่ทราบ', 'ภายใน 2 สัปดาห์', 'ภายในเดือน']}
              value={form.expectedOrder}
              onChange={(v) => update('expectedOrder', v)}
            />
          </div>
        </section>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {missing.length > 0 && (
          <p className="text-xs text-muted-foreground mb-1.5">ขาด: {missing.join(', ')}</p>
        )}
        <Button onClick={() => handleSubmit(false)} disabled={submitting || !canSubmit} size="xl" className="w-full">
          {submitting ? 'กำลังบันทึก...' : 'บันทึกและส่งเข้ากลุ่ม'}
        </Button>
      </div>

      <DuplicateDialog
        open={showDuplicate}
        matches={duplicateMatches}
        pendingNote={form.detail}
        pendingPhotos={form.photos}
        onForceNew={() => { setShowDuplicate(false); handleSubmit(true) }}
        onClose={() => setShowDuplicate(false)}
      />
      <UploadProgressSheet open={showProgress} steps={uploadSteps} />
    </div>
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 h-8 px-3 rounded-full text-sm font-bold border transition-colors ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-foreground border-input hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )
}

function ChipRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <Chip key={opt} label={opt} selected={value === opt} onClick={() => onChange(value === opt ? '' : opt)} />
      ))}
    </div>
  )
}
