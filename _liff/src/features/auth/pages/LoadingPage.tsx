import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BootstrapStatus } from '../useBootstrapAuth'

interface LoadingPageProps {
  status: BootstrapStatus
  onRetry: () => void
}

/** L0 — กำลังเข้าสู่ระบบ */
export function LoadingPage({ status, onRetry }: LoadingPageProps) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-center space-y-3">
        <h1 className="text-lg font-bold">UP Sales</h1>

        {status === 'slow' ? (
          <>
            <p className="text-sm text-muted-foreground">เชื่อมต่อช้า</p>
            <Button onClick={onRetry} size="xl" className="w-full">
              ลองอีกครั้ง
            </Button>
          </>
        ) : status === 'error' ? (
          <>
            <p className="text-sm text-muted-foreground">เข้าสู่ระบบไม่สำเร็จ</p>
            <Button onClick={onRetry} size="xl" className="w-full">
              ลองอีกครั้ง
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">กำลังเข้าสู่ระบบด้วย LINE</p>
          </>
        )}
      </div>
    </div>
  )
}
