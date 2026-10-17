import { useSearchParams, useNavigate } from 'react-router-dom'
import { CircleCheck, Copy, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { closeLiff } from '@/lib/liff-helpers'

/** L8 — ส่งสำเร็จ */
export function SuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const code = params.get('code') || ''
  const name = params.get('name') || ''
  const sent = params.get('sent') !== 'false' // ส่งเข้ากลุ่มได้ไหม

  async function handleCopy() {
    const text = `งานใหม่ #${code} ${name}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success('คัดลอกแล้ว')
    } catch {
      toast.error('คัดลอกไม่ได้ กรุณาคัดลอกเอง')
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {sent ? (
          <>
            <CircleCheck className="size-16 mx-auto text-success" />
            <h1 className="text-xl font-bold">ส่งเข้ากลุ่มแล้ว</h1>
          </>
        ) : (
          <>
            <AlertTriangle className="size-16 mx-auto text-warning" />
            <h1 className="text-xl font-bold">บันทึกแล้ว</h1>
            <p className="text-sm text-muted-foreground">
              ส่งการ์ดเข้ากลุ่มไม่ได้ เพราะไม่ได้เปิดจากกลุ่ม
            </p>
          </>
        )}

        <p className="text-base font-bold num">#{code}</p>
        <p className="text-sm text-muted-foreground">{name}</p>

        {/* TODO: FlexPreview — แสดงตัวอย่างการ์ดที่ขึ้นในกลุ่ม */}

        <div className="space-y-2 pt-4">
          <Button
            onClick={() => closeLiff()}
            size="xl"
            className="w-full"
          >
            กลับไปที่กลุ่ม
          </Button>
          <Button
            onClick={() => navigate('/new')}
            variant="outline"
            size="xl"
            className="w-full"
          >
            รายงานงานถัดไป
          </Button>
          {!sent && (
            <Button
              onClick={handleCopy}
              variant="ghost"
              className="w-full gap-2"
            >
              <Copy className="size-4" />
              คัดลอกข้อความ
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
