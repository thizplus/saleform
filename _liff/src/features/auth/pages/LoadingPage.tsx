import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logoSrc from '@/assets/logo-saleform.jpg'
import type { BootstrapStatus } from '../useBootstrapAuth'

interface LoadingPageProps {
  status: BootstrapStatus
  onRetry: () => void
}

/** L0 — Splash / กำลังเข้าสู่ระบบ */
export function LoadingPage({ status, onRetry }: LoadingPageProps) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
      <img src={logoSrc} alt="saleform" className="w-36" />

      {status === 'slow' ? (
        <div className="text-center space-y-3 w-full max-w-xs">
          <p className="text-sm text-muted-foreground">เชื่อมต่อช้า</p>
          <Button onClick={onRetry} size="xl" className="w-full">
            ลองอีกครั้ง
          </Button>
        </div>
      ) : status === 'error' ? (
        <div className="text-center space-y-3 w-full max-w-xs">
          <p className="text-sm text-muted-foreground">เข้าสู่ระบบไม่สำเร็จ</p>
          <Button onClick={onRetry} size="xl" className="w-full">
            ลองอีกครั้ง
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-3">
          <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">กำลังเข้าสู่ระบบ...</p>
        </div>
      )}
    </div>
  )
}
