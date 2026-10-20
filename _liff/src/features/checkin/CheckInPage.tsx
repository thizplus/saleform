import { useState, useRef } from 'react'
import { Camera, Car, Gauge, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { reportNewService } from '@/features/report-new/service'
import { useOptions } from '@/features/report-new/hooks'
import { sendChatMessages } from '@/lib/liff-helpers'
import { useCheckInStatus, useCheckIn } from './hooks'

interface CheckInPageProps {
  onDone: () => void
}

export function CheckInPage({ onDone }: CheckInPageProps) {
  const { data: status, isLoading } = useCheckInStatus()
  const { data: options } = useOptions()
  const checkInMutation = useCheckIn()

  const [plate, setPlate] = useState('')
  const [mileage, setMileage] = useState('')
  const [selfie, setSelfie] = useState<{ file: File; preview: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)


  // ถ้าเช็คอินแล้ว → ข้ามไปเลย
  if (!isLoading && status?.checkedIn) {
    onDone()
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-muted-foreground">กำลังตรวจสอบ...</p>
      </div>
    )
  }

  function handleSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelfie({ file, preview: URL.createObjectURL(file) })
  }

  const canSubmit = plate.trim() && mileage.trim() && selfie && !submitting

  async function handleSubmit() {
    if (!canSubmit || !selfie) return
    setSubmitting(true)

    try {
      // อัปโหลดเซลฟี่
      let selfieKey = ''
      const uploadResult = await reportNewService.uploadPhotos([selfie.file])
      if (uploadResult.files.length > 0) {
        selfieKey = uploadResult.files[0].id
      }

      const result = await checkInMutation.mutateAsync({
        licensePlate: plate.trim(),
        mileage: parseInt(mileage, 10),
        selfieKey,
      })

      // ส่งข้อมูลเช็คอินเข้ากลุ่ม LINE
      if (result.chatMessages?.length) {
        await sendChatMessages(result.chatMessages)
      }

      toast.success('เช็คอินสำเร็จ!')
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เช็คอินไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="size-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">เช็คอินก่อนเริ่มงาน</h1>
          <p className="text-sm text-muted-foreground">
            กรอกข้อมูลรถและเลขไมล์ พร้อมถ่ายเซลฟี่
          </p>
        </div>

        <div className="space-y-4">
          {/* ทะเบียนรถ */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Car className="size-4" /> ทะเบียนรถ
            </Label>
            <Select value={plate} onValueChange={setPlate}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="เลือกทะเบียนรถ" />
              </SelectTrigger>
              <SelectContent>
                {(options?.vehiclePlates || []).map((p) => (
                  <SelectItem key={p} value={p} className="text-base">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* เลขไมล์ */}
          <div className="space-y-1.5">
            <Label htmlFor="mileage" className="flex items-center gap-1.5">
              <Gauge className="size-4" /> เลขไมล์
            </Label>
            <Input
              id="mileage"
              type="text"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value.replace(/\D/g, ''))}
              placeholder={status?.lastMileage ? `ล่าสุด: ${status.lastMileage.toLocaleString()}` : 'เลขไมล์วันนี้'}
              className="h-12 text-base num"
            />
            {status?.lastMileage ? (
              <p className="text-xs text-muted-foreground">
                ไมล์ล่าสุด: <span className="num font-medium">{status.lastMileage.toLocaleString()}</span>
              </p>
            ) : null}
          </div>

          {/* เซลฟี่ */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Camera className="size-4" /> รูปเซลฟี่
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleSelfie}
              className="hidden"
            />
            {selfie ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-primary"
              >
                <img src={selfie.preview} alt="" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-input flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50"
              >
                <Camera className="size-10" />
                <span className="text-sm">กดถ่ายเซลฟี่</span>
              </button>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="xl"
          className="w-full"
        >
          {submitting ? 'กำลังบันทึก...' : 'เช็คอิน'}
        </Button>
      </div>
    </div>
  )
}
