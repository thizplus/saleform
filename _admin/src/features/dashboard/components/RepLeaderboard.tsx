import { useNavigate } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OutcomeBar, OutcomeLegend, RepAvatar } from '@/components/shared'
import { n, pct } from '@/lib/fmt'
import type { RepAnalytics } from '@/features/analytics'

interface Props {
  rows: RepAnalytics[]
}

/** ตารางผลงานเซลล์แบบย่อ — ใช้ใน Dashboard */
export function RepLeaderboard({ rows }: Props) {
  const navigate = useNavigate()
  const maxVisits = Math.max(...rows.map(r => r.visits), 1)

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">เซลล์</TableHead>
          <TableHead className="w-[28%]">วิ่งงาน</TableHead>
          <TableHead className="text-right">ใหม่</TableHead>
          <TableHead className="min-w-36">ผลลัพธ์ <OutcomeLegend className="mt-1 hidden font-normal 2xl:flex" /></TableHead>
          <TableHead className="text-right">ปิดได้</TableHead>
          <TableHead className="pr-4 text-right">เลยกำหนด</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.repId} className="cursor-pointer" onClick={() => navigate(`/performance/${r.repId}`)}>
            <TableCell className="pl-4">
              <div className="flex items-center gap-2.5">
                <RepAvatar name={r.nickname} index={i} />
                <div className="min-w-0">
                  <div className="font-bold">{r.nickname}</div>
                  <div className="max-w-40 truncate text-xs text-muted-foreground">{r.area}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${(r.visits / maxVisits) * 100}%` }} />
                </div>
                <span className="num w-9 text-right font-bold">{n(r.visits)}</span>
              </div>
            </TableCell>
            <TableCell className="num text-right">{n(r.newSites)}</TableCell>
            <TableCell><OutcomeBar won={r.won} open={r.following} lost={r.lost} cancelled={r.cancelled} /></TableCell>
            <TableCell className="num text-right font-bold">{pct(r.winRate)}</TableCell>
            <TableCell className="pr-4 text-right">
              {r.overdue > 0 ? <span className="num font-bold text-warning-ink">{r.overdue}</span> : <span className="text-muted-foreground">–</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
