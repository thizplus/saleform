import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CircleCheck, Copy, AlertTriangle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { closeLiff } from '@/lib/liff-helpers'
import { sendChatMessages } from '@/lib/liff-helpers'

/** L8 — ส่งสำเร็จ */
export function SuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const code = params.get('code') || ''
  const name = params.get('name') || ''
  const [sent, setSent] = useState(params.get('sent') !== 'false')
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    const raw = sessionStorage.getItem('pendingChatMessages')
    if (!raw) {
      toast.error('ไม่พบข้อความที่จะส่ง')
      return
    }
    setRetrying(true)
    try {
      const messages = JSON.parse(raw) as unknown[]
      const ok = await sendChatMessages(messages)
      if (ok) {
        setSent(true)
        sessionStorage.removeItem('pendingChatMessages')
        toast.success('ส่งเข้ากลุ่มแล้ว')
      } else {
        toast.error('ส่งไม่ได้ — ต้องเปิดจากกลุ่ม LINE')
      }
    } catch {
      toast.error('ส่งไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setRetrying(false)
    }
  }

  async function handleCopy() {
    const text = `งานใหม่ #${code} ${name}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success('คัดลอกแล้ว')
    } catch {
      toast.error('คัดลอกไม่ได้ กรุณาคัดลอกเอง')
    }
  }

  const hasPending = !sent && !!sessionStorage.getItem('pendingChatMessages')

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

        <div className="space-y-2 pt-4">
          {hasPending && (
            <Button
              onClick={handleRetry}
              disabled={retrying}
              size="xl"
              className="w-full gap-2"
            >
              <Send className="size-4" />
              {retrying ? 'กำลังส่ง...' : 'ส่งเข้ากลุ่มอีกครั้ง'}
            </Button>
          )}
          <Button
            onClick={() => closeLiff()}
            size="xl"
            variant={hasPending ? 'outline' : 'default'}
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
