import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Gauge, Phone, Receipt, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendChatMessages } from '@/lib/liff-helpers'
import { useCheckInStatus, useEveningSummary } from './hooks'

export function EveningSummaryPage() {
  const navigate = useNavigate()
  const { data: status } = useCheckInStatus()
  const summaryMutation = useEveningSummary()

  const [mileage, setMileage] = useState('')
  const [callCount, setCallCount] = useState('')
  const [billCount, setBillCount] = useState('')
  const [oldAmount, setOldAmount] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = mileage.trim() && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)

    try {
      const result = await summaryMutation.mutateAsync({
        mileage: parseInt(mileage, 10),
        callCount: parseInt(callCount || '0', 10),
        billCount: parseInt(billCount || '0', 10),
        oldCustomerAmount: parseInt(oldAmount || '0', 10),
        newCustomerAmount: parseInt(newAmount || '0', 10),
      })

      // ส่งสรุปเข้ากลุ่ม LINE
      if (result.chatMessages?.length) {
        await sendChatMessages(result.chatMessages as unknown[])
      }

      toast.success('บันทึกสรุปงานประจำวันสำเร็จ!')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ไม่สามารถบันทึกได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background border-b px-4 h-12 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1" aria-label="กลับ">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-bold flex-1">สรุปงานประจำวัน</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* เลขไมล์ */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Gauge className="size-4" /> เลขไมล์ตอนเย็น *
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={mileage}
            onChange={(e) => setMileage(e.target.value.replace(/\D/g, ''))}
            placeholder={status?.today?.mileage ? `ไมล์เช้า: ${status.today.mileage.toLocaleString()}` : 'เลขไมล์'}
            className="h-12 text-base num"
          />
          {status?.today?.mileage ? (
            <p className="text-xs text-muted-foreground">
              ไมล์เช้า: <span className="num font-medium">{status.today.mileage.toLocaleString()}</span>
              {mileage && parseInt(mileage) > status.today.mileage && (
                <> · วิ่งวันนี้ <span className="num font-bold text-primary">{(parseInt(mileage) - status.today.mileage).toLocaleString()}</span> กม.</>
              )}
            </p>
          ) : null}
        </div>

        {/* โทรติดตามกี่ราย */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Phone className="size-4" /> โทรติดตามลูกค้ากี่ราย
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={callCount}
            onChange={(e) => setCallCount(e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className="h-12 text-base num"
          />
        </div>

        {/* เปิดบิลกี่บิล */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Receipt className="size-4" /> เปิดบิลกี่บิล
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={billCount}
            onChange={(e) => setBillCount(e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className="h-12 text-base num"
          />
        </div>

        {/* ยอดบิล */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Banknote className="size-4" /> ยอดบิล ลค.เก่า (บาท)
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={oldAmount}
            onChange={(e) => setOldAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className="h-12 text-base num"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Banknote className="size-4" /> ยอดบิล ลค.ใหม่ (บาท)
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className="h-12 text-base num"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Button onClick={handleSubmit} disabled={!canSubmit} size="xl" className="w-full">
          {submitting ? 'กำลังบันทึก...' : 'บันทึกและส่งเข้ากลุ่ม'}
        </Button>
      </div>
    </div>
  )
}
