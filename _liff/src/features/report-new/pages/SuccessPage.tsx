import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { closeLiff } from '@/lib/liff-helpers'

export function SuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const code = params.get('code') || ''
  const name = params.get('name') || ''

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-5xl">✓</div>
          <h2 className="text-lg font-semibold text-primary">บันทึกสำเร็จ</h2>
          <p className="text-sm text-muted-foreground">
            #{code} {name}
          </p>
          <p className="text-xs text-muted-foreground">การ์ดถูกส่งเข้ากลุ่มแล้ว</p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              หน้าหลัก
            </Button>
            <Button onClick={() => closeLiff()} className="flex-1">
              ปิด
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
