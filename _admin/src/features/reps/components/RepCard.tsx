import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, MoreHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { OutcomeBar, RepAvatar } from '@/components/shared'
import { pct, thDate } from '@/lib/fmt'
import type { RepBrief, RepAnalytics } from '@/features/analytics'
import { RepEditDialog } from './RepEditDialog'
import { useUpdateRep } from '../hooks'

interface Props {
  rep: RepBrief
  index: number
  analytics?: RepAnalytics
}

/** การ์ดเซลล์แต่ละคน — แสดงผลต่างกันตาม status */
export function RepCard({ rep, index, analytics }: Props) {
  const navigate = useNavigate()
  const updateRep = useUpdateRep()

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<'approve' | 'edit'>('approve')

  function openApprove() {
    setDialogMode('approve')
    setDialogOpen(true)
  }

  function openEdit() {
    setDialogMode('edit')
    setDialogOpen(true)
  }

  function handleReject() {
    if (!confirm('ปฏิเสธเซลล์คนนี้?')) return
    updateRep.mutate({ id: rep.id, data: { status: 'inactive' } })
  }

  function handleReactivate() {
    if (!confirm('เปิดใช้งานเซลล์คนนี้อีกครั้ง?')) return
    updateRep.mutate({ id: rep.id, data: { status: 'active' } })
  }

  return (
    <>
      <Card className="gap-4 px-4">
        <div className="flex items-start gap-3">
          <RepAvatar name={rep.nickname || rep.displayName} index={index} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold">{rep.nickname || rep.displayName}</div>
            <div className="truncate text-sm text-muted-foreground">LINE: {rep.displayName}</div>
            <div className="truncate text-xs text-muted-foreground">
              {rep.area ? rep.area : 'ยังไม่กำหนดพื้นที่'}
            </div>
          </div>
          {rep.status === 'active' && (
            <Button variant="ghost" size="icon-sm" aria-label="แก้ไข" onClick={openEdit}>
              <MoreHorizontal />
            </Button>
          )}
        </div>

        {rep.status === 'active' && analytics && (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {([['วิ่งงาน', analytics.visits], ['ติดตามอยู่', analytics.following], ['ปิดได้', pct(analytics.winRate)]] as const).map(([l, v]) => (
                <div key={l} className="rounded-lg bg-muted/50 p-2">
                  <div className="num text-lg font-bold">{v}</div>
                  <div className="text-[11px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <OutcomeBar won={analytics.won} open={analytics.following} lost={analytics.lost} cancelled={analytics.cancelled} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>เริ่มงาน {thDate(new Date(rep.createdAt))}</span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate(`/performance/${rep.id}`)}>ดูผลงาน</Button>
            </div>
          </>
        )}

        {rep.status === 'pending' && (
          <>
            <p className="rounded-lg bg-warning-soft p-3 text-sm text-warning-ink">
              ลงทะเบียนเมื่อ {thDate(new Date(rep.createdAt))} — ต้องกำหนดชื่อเล่นและพื้นที่ก่อนอนุมัติ
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={openApprove}><Check /> อนุมัติ</Button>
              <Button variant="outline" className="flex-1" onClick={handleReject} disabled={updateRep.isPending}><X /> ปฏิเสธ</Button>
            </div>
          </>
        )}

        {rep.status === 'inactive' && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>ปิดใช้งานแล้ว — งานเดิมยังอยู่ในรายงานย้อนหลัง</span>
            <Button variant="outline" size="sm" onClick={handleReactivate} disabled={updateRep.isPending}>เปิดใช้งาน</Button>
          </div>
        )}
      </Card>

      <RepEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rep={rep}
        mode={dialogMode}
      />
    </>
  )
}
