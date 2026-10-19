import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { getLiffContext, sendChatMessages } from '@/lib/liff-helpers'
import { addDays } from '@/lib/thai-date'
import { PhotoPicker } from '../components/PhotoPicker'
import { GPSButton } from '../components/GPSButton'
import { FollowUpDateChips } from '../components/FollowUpDateChips'
import { DuplicateDialog } from '../components/DuplicateDialog'
import { UploadProgressSheet, type UploadStep } from '../components/UploadProgressSheet'
import { useOptions, useCreateSite, useCheckDuplicate } from '../hooks'
import { reportNewService } from '../service'
import { ContactListEditor } from '../components/ContactListEditor'
import type { DuplicateMatch, ContactInput } from '../types'

const DRAFT_KEY = 'liff-new-report-draft'
const QUICK_PRODUCTS = ['เหล็กเส้น', 'เหล็กกล่อง', 'H-beam', 'เหล็กตัวซี', 'ไวร์เมช', 'เมทัลชีท']

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
  contacts: ContactInput[]
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
  contacts: [{ name: '', phone: '', contactType: '', authority: '' }],
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
  const [noContact, setNoContact] = useState(false)
  const [kbOpen, setKbOpen] = useState(false)
  const [gpsDups, setGpsDups] = useState<DuplicateMatch[]>([])
  const [gpsDupsDismissed, setGpsDupsDismissed] = useState(false)
  const idempotencyKeyRef = useRef(crypto.randomUUID())

  // ซ่อน bottom bar เมื่อแป้นพิมพ์เปิด
  useEffect(() => {
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'file'].includes(el.type))
    const onIn = (e: FocusEvent) => { if (typing(e.target)) setKbOpen(true) }
    let t: ReturnType<typeof setTimeout>
    const onOut = () => { clearTimeout(t); t = setTimeout(() => setKbOpen(typing(document.activeElement)), 120) }
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => { clearTimeout(t); document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut) }
  }, [])

  // ตรวจซ้ำ GPS ทันทีที่ได้ตำแหน่ง
  useEffect(() => {
    if (!form.lat || !form.lng) return
    setGpsDupsDismissed(false)
    dupCheck.mutateAsync({ lat: form.lat, lng: form.lng }).then((res) => {
      setGpsDups(res.hasDuplicate ? res.matches : [])
    }).catch(() => setGpsDups([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.lat, form.lng])

  // ตรวจซ้ำเบอร์เมื่อครบ 10 หลัก (ใช้เบอร์จาก contact แรก)
  const digits = (form.contacts[0]?.phone?.replace(/\D/g, '') || form.phone.replace(/\D/g, ''))
  useEffect(() => {
    if (digits.length === 10) {
      dupCheck.mutateAsync({ phone: digits, customerName: form.customerName }).then((res) => {
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
  const primaryPhone = form.contacts[0]?.phone?.replace(/\D/g, '') || ''
  const hasAnyContact = form.contacts.some((c) => c.name.trim() || c.phone.trim())
  const contactOk = noContact || hasAnyContact || !!form.customerName.trim() || !!form.contractorName.trim()
  const missing: string[] = []
  if (!form.lat) missing.push('ตำแหน่ง')
  if (form.photos.length === 0) missing.push('รูป')
  if (!contactOk) missing.push('ผู้ติดต่อ')
  if (!form.nextFollowUpDate) missing.push('วันนัดตาม')
  const canSubmit = missing.length === 0

  async function handleSubmit(forceNew = false) {
    if (!canSubmit && !forceNew) return
    setSubmitting(true)

    try {
      if (!forceNew) {
        const dupResult = await dupCheck.mutateAsync({ phone: digits, lat: form.lat, lng: form.lng, customerName: form.customerName })
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

      // ดึง groupId จาก LIFF context
      const liffCtx = getLiffContext()
      const groupId = liffCtx?.groupId || liffCtx?.roomId || ''
      console.log('[LIFF Context]', JSON.stringify(liffCtx))
      console.log('[groupId sent]', groupId)

      // กรอง contacts ที่มีข้อมูลจริง
      const validContacts = form.contacts.filter((c) => c.name.trim() || c.phone.trim())

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
        contacts: validContacts,
        forceNew,
        idempotencyKey: idempotencyKeyRef.current,
        groupId,
      })

      // ส่งเข้ากลุ่มผ่าน liff.sendMessages() (ฟรี ไม่เสียโควต้า)
      let sent = false
      if (result.chatMessages?.length) {
        sent = await sendChatMessages(result.chatMessages)
      }
      if (sent) toast.success('ส่งเข้ากลุ่มแล้ว')

      // เก็บ chatMessages ไว้ให้ retry ได้ถ้าส่งไม่สำเร็จ
      if (!sent && result.chatMessages?.length) {
        sessionStorage.setItem('pendingChatMessages', JSON.stringify(result.chatMessages))
      } else {
        sessionStorage.removeItem('pendingChatMessages')
      }

      setUploadSteps((prev) => prev.map((s) =>
        s.label === 'บันทึกข้อมูล' || s.label === 'ส่งเข้ากลุ่ม' ? { ...s, status: 'done' } : s
      ))

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

          {/* Inline GPS duplicate warning */}
          {gpsDups.length > 0 && !gpsDupsDismissed && (
            <GpsDuplicateCard
              matches={gpsDups}
              pendingNote={form.detail}
              pendingPhotos={form.photos}
              onDismiss={() => setGpsDupsDismissed(true)}
            />
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

        {/* ===== ข้อมูลหน้างาน ===== */}
        <section className="space-y-3">
          <Label className="text-sm font-bold">ข้อมูลหน้างาน</Label>
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
          <div className="space-y-1">
            <Label htmlFor="amphoe" className="text-xs text-muted-foreground">อำเภอ</Label>
            <Input id="amphoe" value={form.amphoe} onChange={(e) => update('amphoe', e.target.value)} placeholder="อำเภอ" className="h-10 text-base" />
          </div>
        </section>

        {/* ===== ผู้ติดต่อ ===== */}
        <section className="space-y-3">
          <Label className="text-sm font-bold">ผู้ติดต่อ</Label>

          <Chip
            label="ยังไม่เจอใครที่หน้างาน"
            selected={noContact}
            onClick={() => setNoContact((v) => !v)}
          />

          {noContact ? (
            <p className="rounded-xl bg-muted/70 p-3 text-sm text-muted-foreground">
              ระบบใช้ตำแหน่ง GPS ตรวจงานซ้ำแทน ครั้งหน้าที่มาเจอใครค่อยเพิ่มเบอร์ตอนอัปเดตงาน
            </p>
          ) : (
            <ContactListEditor
              contacts={form.contacts}
              onChange={(contacts) => update('contacts', contacts)}
            />
          )}
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
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRODUCTS.map((p) => (
                <button key={p} type="button" onClick={() => update('detail', form.detail ? `${form.detail.trimEnd()} ${p}` : `สนใจ${p}`)}
                  className="h-7 px-2.5 rounded-full bg-muted text-xs active:bg-muted-foreground/20">+ {p}</button>
              ))}
            </div>
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

      {/* Sticky Action Bar — ซ่อนเมื่อแป้นพิมพ์เปิด */}
      <div className={`fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] transition-transform duration-200 ${kbOpen ? 'translate-y-full' : ''}`}>
        {missing.length > 0 ? (
          <p className="text-xs mb-1.5"><span className="text-muted-foreground">ยังขาด</span> <b className="text-warning-ink">{missing.join(' · ')}</b></p>
        ) : (
          <p className="text-xs font-bold text-success-ink mb-1.5">ครบแล้ว พร้อมส่ง</p>
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

/** Inline warning card — แสดงทันทีเมื่อ GPS พบงานใกล้เคียง */
function GpsDuplicateCard({ matches, pendingNote, pendingPhotos, onDismiss }: {
  matches: DuplicateMatch[]
  pendingNote?: string
  pendingPhotos?: { file: File; preview: string }[]
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl border border-warning/40 bg-warning-soft/60 p-3 space-y-2.5">
      <div className="flex items-start gap-2 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-ink" />
        <div>
          <b>อาจเป็นหน้างานเดิม</b>{' '}
          <span className="text-muted-foreground">
            พบงานที่ยังตามอยู่{matches.length > 1 ? ` ${matches.length} งาน` : ''}ใกล้ตรงนี้
          </span>
        </div>
      </div>
      {matches.slice(0, 3).map((m) => (
        <div key={m.siteCode} className="rounded-xl bg-background p-2.5 space-y-2">
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{m.customerName || 'ไม่มีชื่อ'}</p>
            <p className="text-xs text-muted-foreground">
              <span className="num">#{m.siteCode}</span>
              {m.reason === 'nearby' && m.distanceM != null && ` · ห่าง ${m.distanceM} ม.`}
              {m.reason === 'phone' && ' · เบอร์เดียวกัน'}
              {' · '}{m.isMine ? 'งานของฉัน' : `งานของ${m.ownerName}`}
            </p>
          </div>
          {m.isMine ? (
            <Button size="sm" className="w-full" onClick={() => navigate(`/sites/${m.siteCode}/update`, {
              state: { prefillNote: pendingNote || '', prefillPhotos: pendingPhotos || [], fromDuplicate: true },
            })}>
              อัปเดตงานนี้แทน
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/sites/${m.siteCode}`)}>
              ดูงานของ {m.ownerName}
            </Button>
          )}
        </div>
      ))}
      <button type="button" onClick={onDismiss} className="w-full py-1 text-center text-sm font-bold underline underline-offset-4">
        ไม่ใช่ — เป็นหน้างานใหม่
      </button>
    </div>
  )
}
