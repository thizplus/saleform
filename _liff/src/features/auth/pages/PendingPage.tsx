import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { authService } from '../service'
import { closeLiff } from '@/lib/liff-helpers'

interface PendingPageProps {
  onApproved: () => void
}

/** L2 — รอแอดมินอนุมัติ */
export function PendingPage({ onApproved }: PendingPageProps) {
  const profile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const [checking, setChecking] = useState(false)

  async function handleCheck() {
    setChecking(true)
    try {
      const data = await authService.refreshProfile()
      updateProfile(data.profile)
      if (data.profile.status === 'active') {
        onApproved()
      }
    } catch {
      // ไม่ต้องทำอะไร
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm space-y-4">
        {profile?.pictureUrl && (
          <img src={profile.pictureUrl} alt="" className="size-16 rounded-full mx-auto" />
        )}

        <Clock className="size-12 mx-auto text-muted-foreground" />

        <h1 className="text-lg font-bold">ส่งข้อมูลแล้ว</h1>
        <p className="text-base text-muted-foreground">รอแอดมินอนุมัติ</p>

        {profile && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>ชื่อเล่น: {profile.nickname}</p>
            {profile.area && <p>พื้นที่: {profile.area}</p>}
          </div>
        )}

        <p className="text-xs text-muted-foreground">แอดมินจะได้รับแจ้งทันที</p>

        <div className="space-y-2 pt-2">
          <Button
            onClick={handleCheck}
            disabled={checking}
            variant="outline"
            size="xl"
            className="w-full"
          >
            {checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะ'}
          </Button>
          <Button
            onClick={() => closeLiff()}
            variant="ghost"
            className="w-full"
          >
            ปิด
          </Button>
        </div>
      </div>
    </div>
  )
}
