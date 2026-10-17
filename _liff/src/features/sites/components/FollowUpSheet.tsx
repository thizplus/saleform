import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
// sendChatMessages imported dynamically below
import { addDays } from '@/lib/thai-date'
import { PhotoPicker } from '@/features/report-new/components/PhotoPicker'
import { FollowUpDateChips } from '@/features/report-new/components/FollowUpDateChips'
import { useOptions, useUploadPhotos } from '@/features/report-new/hooks'
import { siteKeys } from '../hooks'
import { followUpService } from './followUpService'

interface FollowUpSheetProps {
  siteCode: string
  siteName: string
  currentStage: string
  currentDecisionMaker: string
  onClose: () => void
  onSuccess: () => void
}

export function FollowUpSheet({
  siteCode,
  siteName,
  currentStage,
  currentDecisionMaker,
  onClose,
  onSuccess,
}: FollowUpSheetProps) {
  const queryClient = useQueryClient()
  const { data: options } = useOptions()
  const uploadMutation = useUploadPhotos()

  const [note, setNote] = useState('')
  const [status, setStatus] = useState<string>('following')
  const [nextFollowUpDate, setNextFollowUpDate] = useState(addDays(7))
  const [lostReason, setLostReason] = useState('')
  const [competitor, setCompetitor] = useState('')
  const [stage, setStage] = useState(currentStage)
  const [decisionMaker, setDecisionMaker] = useState(currentDecisionMaker)
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  const statusOptions = [
    { value: 'following', label: 'ยังติดตาม' },
    { value: 'won', label: 'จบได้' },
    { value: 'lost', label: 'จบที่อื่น' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ]

  async function handleSubmit() {
    if (!note.trim()) {
      toast.error('กรุณากรอกรายละเอียด')
      return
    }
    if (status === 'lost' && !lostReason) {
      toast.error('กรุณาเลือกสาเหตุที่จบที่อื่น')
      return
    }
    if (status === 'following' && !nextFollowUpDate) {
      toast.error('กรุณาเลือกวันนัดติดตาม')
      return
    }

    setSubmitting(true)
    try {
      // Upload photos
      let photoIds: string[] = []
      if (photos.length > 0) {
        const uploadResult = await uploadMutation.mutateAsync(photos.map((p) => p.file))
        photoIds = uploadResult.files.map((f) => f.id)
      }

      // Create follow-up
      const result = await followUpService.createFollowUp(siteCode, {
        note,
        status,
        nextFollowUpDate: status === 'following' ? nextFollowUpDate : undefined,
        lostReason: status === 'lost' ? lostReason : '',
        competitor: status === 'lost' ? competitor : '',
        stage,
        decisionMaker,
        photoIds,
      })

      if (result.messageSent) {
        toast.success('ส่งเข้ากลุ่มแล้ว')
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(siteCode) })
      queryClient.invalidateQueries({ queryKey: siteKeys.all })

      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="flex items-center justify-between px-4 pb-2">
          <DrawerTitle className="text-base">
            Follow-up #{siteCode}
          </DrawerTitle>
          <DrawerClose
            className="inline-flex items-center justify-center rounded-lg px-2.5 h-7 text-sm font-medium hover:bg-muted"
          >
            ปิด
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          <p className="text-sm text-muted-foreground">{siteName}</p>

          {/* Note */}
          <div className="space-y-1">
            <Label htmlFor="fu-note">รายละเอียด *</Label>
            <Textarea
              id="fu-note"
              placeholder="ความคืบหน้า / สิ่งที่พบ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>สถานะ</Label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    status === opt.value
                      ? opt.value === 'won'
                        ? 'bg-green-600 text-white border-green-600'
                        : opt.value === 'lost'
                          ? 'bg-red-600 text-white border-red-600'
                          : opt.value === 'cancelled'
                            ? 'bg-gray-500 text-white border-gray-500'
                            : 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-input hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional: Follow-up date */}
          {status === 'following' && (
            <div className="space-y-1">
              <Label>นัดติดตามครั้งถัดไป</Label>
              <FollowUpDateChips value={nextFollowUpDate} onChange={setNextFollowUpDate} />
              <Input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {/* Conditional: Lost reason */}
          {status === 'lost' && (
            <>
              <div className="space-y-1">
                <Label>สาเหตุที่จบที่อื่น *</Label>
                <div className="flex gap-2 flex-wrap">
                  {(options?.lostReasons || ['ราคาสูง', 'ส่งช้า', 'ใช้คู่แข่ง', 'เปลี่ยนใจ', 'อื่นๆ']).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setLostReason(r)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        lostReason === r
                          ? 'bg-destructive text-destructive-foreground border-destructive'
                          : 'bg-background text-foreground border-input hover:bg-muted'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fu-competitor">คู่แข่ง</Label>
                <Input
                  id="fu-competitor"
                  placeholder="ชื่อคู่แข่ง"
                  value={competitor}
                  onChange={(e) => setCompetitor(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Stage (editable) */}
          <div className="space-y-1">
            <Label>ขั้นตอน</Label>
            <div className="flex gap-2 flex-wrap">
              {(options?.stages || ['new', 'quoting', 'negotiating']).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    stage === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-input hover:bg-muted'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Decision Maker (editable) */}
          <div className="space-y-1">
            <Label>ผู้ตัดสินใจ</Label>
            <div className="flex gap-2 flex-wrap">
              {(options?.decisionMakers || ['เจ้าของ', 'ผู้รับเหมา', 'วิศวกร']).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDecisionMaker(d)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    decisionMaker === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-input hover:bg-muted'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-1">
            <Label>รูปเพิ่มเติม</Label>
            <PhotoPicker photos={photos} onChange={setPhotos} />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !note.trim()}
            className="w-full"
            size="lg"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึก Follow-up'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
