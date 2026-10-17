import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SITE_STATUS_LABELS } from '@/constants/enums'
import type { DuplicateMatch } from '../types'

interface DuplicateDialogProps {
  matches: DuplicateMatch[]
  onForceNew: () => void
  onCancel: () => void
}

export function DuplicateDialog({ matches, onForceNew, onCancel }: DuplicateDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-background rounded-t-xl w-full max-w-lg p-4 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom">
        <h3 className="font-semibold text-base">พบงานที่อาจซ้ำ</h3>
        <p className="text-sm text-muted-foreground">
          มีงานที่คล้ายกันในระบบแล้ว ต้องการสร้างใหม่หรือไม่?
        </p>

        <div className="space-y-2">
          {matches.map((m) => (
            <Card key={m.siteCode}>
              <CardContent className="p-3 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{m.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      #{m.siteCode} · {m.phone}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {SITE_STATUS_LABELS[m.status] || m.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  เจ้าของ: {m.ownerName} ·{' '}
                  {m.reason === 'phone' ? 'เบอร์ซ้ำ' : `ใกล้กัน ${m.distanceM}m`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            ยกเลิก
          </Button>
          <Button variant="destructive" onClick={onForceNew} className="flex-1">
            สร้างใหม่
          </Button>
        </div>
      </div>
    </div>
  )
}
