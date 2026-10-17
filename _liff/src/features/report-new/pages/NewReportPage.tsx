import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { sendFlexToChat } from '@/lib/liff-helpers'
import { addDays } from '@/lib/thai-date'
import { PhotoPicker } from '../components/PhotoPicker'
import { GPSButton } from '../components/GPSButton'
import { FollowUpDateChips } from '../components/FollowUpDateChips'
import { DuplicateDialog } from '../components/DuplicateDialog'
import { useOptions, useUploadPhotos, useCreateSite, useCheckDuplicate } from '../hooks'
import type { DuplicateMatch } from '../types'

export function NewReportPage() {
  const navigate = useNavigate()
  const { data: options } = useOptions()
  const uploadMutation = useUploadPhotos()
  const createMutation = useCreateSite()
  const dupCheck = useCheckDuplicate()

  // Form state
  const [phone, setPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerType, setCustomerType] = useState('')
  const [contractorName, setContractorName] = useState('')
  const [decisionMaker, setDecisionMaker] = useState('')
  const [stage, setStage] = useState('')
  const [detail, setDetail] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [address, setAddress] = useState('')
  const [nextFollowUpDate, setNextFollowUpDate] = useState(addDays(7))
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])

  // Duplicate state
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([])

  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(forceNew = false) {
    if (!customerName.trim()) {
      toast.error('กรุณากรอกชื่อลูกค้า')
      return
    }
    if (!phone.trim()) {
      toast.error('กรุณากรอกเบอร์โทร')
      return
    }

    setSubmitting(true)

    try {
      // 1. Check duplicate (unless forcing)
      if (!forceNew) {
        const dupResult = await dupCheck.mutateAsync({ phone, lat, lng })
        if (dupResult.hasDuplicate) {
          setDuplicateMatches(dupResult.matches)
          setShowDuplicate(true)
          setSubmitting(false)
          return
        }
      }

      // 2. Upload photos
      let photoIds: string[] = []
      if (photos.length > 0) {
        const uploadResult = await uploadMutation.mutateAsync(photos.map((p) => p.file))
        photoIds = uploadResult.files.map((f) => f.id)
      }

      // 3. Create site
      const result = await createMutation.mutateAsync({
        phone,
        customerName,
        customerType,
        contractorName,
        decisionMaker,
        stage,
        detail,
        lat,
        lng,
        address,
        expectedOrderDate: '',
        nextFollowUpDate,
        photoIds,
        forceNew,
      })

      // 4. Send Flex Card to group
      if (result.flexMessage) {
        const sent = await sendFlexToChat(result.flexMessage)
        if (sent) {
          toast.success('ส่งการ์ดเข้ากลุ่มแล้ว')
        }
      }

      // 5. Navigate to success
      navigate(`/success?code=${result.site.siteCode}&name=${encodeURIComponent(result.site.customerName)}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-lg">
          &larr;
        </button>
        <h1 className="font-semibold">งานใหม่</h1>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* GPS */}
        <Card>
          <CardContent className="p-3">
            <Label className="text-sm font-medium mb-2 block">ตำแหน่งหน้างาน</Label>
            <GPSButton lat={lat} lng={lng} onLocation={(la, ln) => { setLat(la); setLng(ln) }} />
          </CardContent>
        </Card>

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="phone">เบอร์โทร *</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Customer Name */}
        <div className="space-y-1">
          <Label htmlFor="customerName">ชื่อลูกค้า *</Label>
          <Input
            id="customerName"
            placeholder="ชื่อลูกค้า / ชื่อโครงการ"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        {/* Customer Type */}
        <div className="space-y-1">
          <Label>ประเภทลูกค้า</Label>
          <div className="flex gap-2">
            {(options?.customerTypes || ['ใหม่', 'เก่า']).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCustomerType(t)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  customerType === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Contractor */}
        <div className="space-y-1">
          <Label htmlFor="contractor">ผู้รับเหมา</Label>
          <Input
            id="contractor"
            placeholder="ชื่อผู้รับเหมา"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
          />
        </div>

        {/* Decision Maker */}
        <div className="space-y-1">
          <Label>ผู้มีอำนาจตัดสินใจ</Label>
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

        {/* Stage */}
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

        {/* Detail */}
        <div className="space-y-1">
          <Label htmlFor="detail">รายละเอียด</Label>
          <Textarea
            id="detail"
            placeholder="รายละเอียดงาน..."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
          />
        </div>

        {/* Address */}
        <div className="space-y-1">
          <Label htmlFor="address">ที่อยู่ / อำเภอ</Label>
          <Input
            id="address"
            placeholder="ที่อยู่หรือพื้นที่"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Follow-up Date */}
        <div className="space-y-1">
          <Label>นัดติดตาม</Label>
          <FollowUpDateChips value={nextFollowUpDate} onChange={setNextFollowUpDate} />
          <Input
            type="date"
            value={nextFollowUpDate}
            onChange={(e) => setNextFollowUpDate(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Photos */}
        <div className="space-y-1">
          <Label>รูปถ่าย (สูงสุด 3 รูป)</Label>
          <PhotoPicker photos={photos} onChange={setPhotos} />
        </div>
      </div>

      {/* Submit button - fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <Button
          onClick={() => handleSubmit(false)}
          disabled={submitting || !customerName.trim() || !phone.trim()}
          className="w-full"
          size="lg"
        >
          {submitting ? 'กำลังบันทึก...' : 'บันทึกงานใหม่'}
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
