import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { closeLiff } from '@/lib/liff-helpers'

/** L3 — บัญชีถูกปิดใช้งาน */
export function InactivePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm space-y-4">
        <ShieldX className="size-12 mx-auto text-muted-foreground" />
        <h1 className="text-lg font-bold">บัญชีถูกปิดใช้งาน</h1>
        <p className="text-sm text-muted-foreground">
          ติดต่อแอดมินของทีมเพื่อขอเปิดใช้งานอีกครั้ง
        </p>
        <Button
          onClick={() => closeLiff()}
          variant="outline"
          size="xl"
          className="w-full"
        >
          ปิด
        </Button>
      </div>
    </div>
  )
}
