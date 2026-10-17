import { useState } from 'react'
import liff from '@line/liff'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { authService } from '../service'

interface RegisterPageProps {
  onSuccess: () => void
}

/** L1 — ลงทะเบียนครั้งเดียว */
export function RegisterPage({ onSuccess }: RegisterPageProps) {
  const setAuth = useAuthStore((s) => s.setAuth)

  // ข้อมูล LINE profile
  const displayName = liff.getDecodedIDToken?.()?.name || ''
  const pictureUrl = liff.getDecodedIDToken?.()?.picture || ''

  const [nickname, setNickname] = useState(displayName)
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // TODO: เปลี่ยนเป็น multi-select อำเภอจาก config (ตอนนี้ใส่ text ก่อน)
  const [areaText, setAreaText] = useState('')

  async function handleSubmit() {
    if (!nickname.trim()) {
      toast.error('กรุณากรอกชื่อเล่น')
      return
    }

    setSubmitting(true)
    try {
      const idToken = liff.getIDToken()
      if (!idToken) {
        toast.error('ไม่พบ ID token กรุณาปิดแล้วเปิดใหม่')
        return
      }

      const areas = areaText.trim()
        ? areaText.split(',').map((a) => a.trim()).filter(Boolean)
        : []

      const data = await authService.register({
        idToken,
        nickname: nickname.trim(),
        areas,
        phone: phone.replace(/\D/g, ''),
      })

      if (data.token) {
        setAuth(data.token, data.profile)
      }
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Profile header */}
        <div className="text-center space-y-2">
          {pictureUrl && (
            <img src={pictureUrl} alt="" className="size-16 rounded-full mx-auto" />
          )}
          <p className="text-lg font-bold">สวัสดี {displayName || 'คุณ'}</p>
          <p className="text-sm text-muted-foreground">
            ลงทะเบียนครั้งเดียวเพื่อเริ่มส่งรายงาน
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">ชื่อเล่นในทีม *</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น บอม"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="area">พื้นที่ที่ดูแล</Label>
            <Input
              id="area"
              value={areaText}
              onChange={(e) => setAreaText(e.target.value)}
              placeholder="เช่น อ.เมือง, อ.โนนสูง"
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground">คั่นด้วยเครื่องหมาย ,</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">เบอร์โทรของคุณ</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="h-12 text-base"
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !nickname.trim()}
          size="xl"
          className="w-full"
        >
          {submitting ? 'กำลังส่ง...' : 'ส่งให้แอดมินอนุมัติ'}
        </Button>
      </div>
    </div>
  )
}
