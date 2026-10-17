import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, CircleCheck, CircleX, CalendarClock, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { sendChatMessages } from '@/lib/liff-helpers'
import { addDays } from '@/lib/thai-date'
import { PhotoPicker } from '@/features/report-new/components/PhotoPicker'
import { FollowUpDateChips } from '@/features/report-new/components/FollowUpDateChips'
import { useOptions, useUploadPhotos } from '@/features/report-new/hooks'
import { useSiteDetail } from '@/features/sites/hooks'
import { followUpService } from '@/features/sites/components/followUpService'

type FollowUpStatus = 'following' | 'won' | 'lost' | 'cancelled'

const STATUS_OPTIONS: { value: FollowUpStatus; label: string; icon: typeof CircleCheck; activeClass: string }[] = [
  { value: 'following', label: 'ตามต่อ', icon: CalendarClock, activeClass: 'bg-primary text-primary-foreground border-primary' },
  { value: 'won', label: 'จบได้', icon: CircleCheck, activeClass: 'bg-success text-white border-success' },
  { value: 'lost', label: 'จบที่อื่น', icon: CircleX, activeClass: 'bg-danger text-white border-danger' },
  { value: 'cancelled', label: 'ยกเลิก', icon: Ban, activeClass: 'bg-muted-foreground text-white border-muted-foreground' },
]

/** L9 — อัปเดตงาน (Follow-up) — หน้าเต็ม */
export function UpdateSitePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: site } = useSiteDetail(code || '')
  const { data: options } = useOptions()
  const uploadMutation = useUploadPhotos()

  // รับข้อมูลจาก L-04 (DuplicateDialog → "อัปเดตงานนี้แทน")
  const prefill = (location.state as { prefillNote?: string; prefillPhotos?: { file: File; preview: string }[] }) || {}

  const [status, setStatus] = useState<FollowUpStatus>('following')
  const [note, setNote] = useState(prefill.prefillNote || '')
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>(prefill.prefillPhotos || [])
  const [nextFollowUpDate, setNextFollowUpDate] = useState(addDays(7))
  const [stage, setStage] = useState('')
  const [wonValue, setWonValue] = useState('')
  const [lostReason, setLostReason] = useState('')
  const [competitor, setCompetitor] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const stages = options?.stages || ['เริ่มก่อสร้าง', 'กำลังสร้าง', 'ใกล้เสร็จ', 'รอตัดสินใจ', 'เสนอราคาแล้ว', 'อื่นๆ']
  const lostReasons = options?.lostReasons || ['ราคา', 'ช่างมีร้านประจำ', 'ส่งช้า', 'ของไม่พร้อม', 'อื่นๆ']
  const competitors = options?.competitors || ['กระทิง', 'เหล็กสยาม', 'อื่นๆ']

  const canSubmit = note.trim().length > 0
    && (status !== 'following' || nextFollowUpDate)
    && (status !== 'lost' || lostReason)

  async function handleSubmit() {
    if (!canSubmit || !code) return
    setSubmitting(true)

    try {
      // อัปโหลดรูป
      let photoIds: string[] = []
      if (photos.length > 0) {
        const uploadResult = await uploadMutation.mutateAsync(photos.map((p) => p.file))
        photoIds = uploadResult.files.map((f) => f.id)
      }

      // สร้าง follow-up
      const result = await followUpService.createFollowUp(code, {
        note,
        status,
        nextFollowUpDate: status === 'following' ? nextFollowUpDate : undefined,
        lostReason: status === 'lost' ? lostReason : '',
        competitor: status === 'lost' ? competitor : '',
        stage,
        decisionMaker: '',
        photoIds,
      })

      // ส่งข้อความเข้ากลุ่ม
      let sent = false
      if (result.chatMessages?.length) {
        sent = await sendChatMessages(result.chatMessages)
        if (sent) toast.success('ส่งเข้ากลุ่มแล้ว')
      }

      navigate(`/success?code=${code}&name=${encodeURIComponent(site?.customerName || '')}&sent=${sent}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1" aria-label="กลับ">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">อัปเดต <span className="num">#{code}</span></h1>
            {site && <p className="text-sm text-muted-foreground">{site.customerName}</p>}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-32">
        {/* Segmented status */}
        <section className="space-y-2">
          <Label className="text-sm font-bold">ผลการติดตาม *</Label>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-muted">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isActive = status === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    isActive ? opt.activeClass : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* ความคืบหน้า */}
        <section className="space-y-2">
          <Label htmlFor="note" className="text-sm font-bold">ความคืบหน้า *</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="สิ่งที่พบ / สิ่งที่คุยกับลูกค้า..."
            rows={4}
            className="text-base"
          />
        </section>

        {/* รูปเพิ่มเติม */}
        <section className="space-y-2">
          <Label className="text-sm font-bold">รูปเพิ่มเติม</Label>
          <PhotoPicker photos={photos} onChange={setPhotos} />
        </section>

        {/* ── ฟิลด์ตามสถานะ ── */}

        {/* ตามต่อ */}
        {status === 'following' && (
          <>
            <section className="space-y-2">
              <Label className="text-sm font-bold">ขั้นตอนตอนนี้</Label>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                {stages.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(stage === s ? '' : s)}
                    className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold border transition-colors ${
                      stage === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-input hover:bg-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <Label className="text-sm font-bold">ตามต่อครั้งถัดไป *</Label>
              <FollowUpDateChips value={nextFollowUpDate} onChange={setNextFollowUpDate} />
            </section>
          </>
        )}

        {/* จบได้ */}
        {status === 'won' && (
          <section className="space-y-2">
            <Label htmlFor="wonValue" className="text-sm font-bold">มูลค่าโดยประมาณ (บาท)</Label>
            <input
              id="wonValue"
              type="text"
              inputMode="numeric"
              value={wonValue}
              onChange={(e) => setWonValue(e.target.value)}
              placeholder="เช่น 50000"
              className="w-full h-12 rounded-lg border border-input bg-background px-3 text-base num"
            />
          </section>
        )}

        {/* จบที่อื่น */}
        {status === 'lost' && (
          <>
            <section className="space-y-2">
              <Label className="text-sm font-bold">สาเหตุ *</Label>
              <div className="flex gap-2 flex-wrap">
                {lostReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setLostReason(lostReason === r ? '' : r)}
                    className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold border transition-colors ${
                      lostReason === r
                        ? 'bg-danger text-white border-danger'
                        : 'bg-background text-foreground border-input hover:bg-muted'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <Label className="text-sm font-bold">จบที่ร้าน</Label>
              <div className="flex gap-2 flex-wrap">
                {competitors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCompetitor(competitor === c ? '' : c)}
                    className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold border transition-colors ${
                      competitor === c
                        ? 'bg-danger text-white border-danger'
                        : 'bg-background text-foreground border-input hover:bg-muted'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
          size="xl"
          className="w-full"
        >
          {submitting ? 'กำลังบันทึก...' : 'บันทึกและส่งเข้ากลุ่ม'}
        </Button>
      </div>
    </div>
  )
}
