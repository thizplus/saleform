import { MessageSquareWarning } from 'lucide-react'

/** เปิดนอกแอป LINE */
export function NotInLinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
      <MessageSquareWarning className="size-12 text-muted-foreground" />
      <h1 className="text-lg font-bold">เปิดจากกลุ่ม LINE</h1>
      <p className="text-sm text-muted-foreground">
        กรุณาเปิดลิงก์นี้จากกลุ่ม LINE ของทีม
      </p>
    </div>
  )
}
