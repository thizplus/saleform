import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown } from 'lucide-react'
import { cn } from 'cn'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OutcomeBar, OutcomeLegend, RepAvatar } from '@/components/shared'
import { n, pct } from '@/lib/fmt'
import type { RepAnalytics } from '@/features/analytics'

type SortKey = 'nickname' | 'visits' | 'newSites' | 'followUps' | 'won' | 'lost' | 'winRate' | 'overdue'

interface Props {
  rows: RepAnalytics[]
}

/** ตารางเปรียบเทียบเซลล์ — sortable, คลิกไปหน้า detail */
export function RepTable({ rows }: Props) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = React.useState<SortKey>('visits')
  const [sortAsc, setSortAsc] = React.useState(false)

  const sorted = React.useMemo(() => {
    const cmp = (a: RepAnalytics, b: RepAnalytics) => {
      const av = sortKey === 'nickname' ? a.nickname : a[sortKey]
      const bv = sortKey === 'nickname' ? b.nickname : b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv, 'th')
      return (av as number) - (bv as number)
    }
    const arr = [...rows].sort(cmp)
    return sortAsc ? arr : arr.reverse()
  }, [rows, sortKey, sortAsc])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p)
    else { setSortKey(key); setSortAsc(false) }
  }

  function SortHead({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) {
    return (
      <TableHead className={className}>
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={() => toggleSort(k)}
        >
          {children}
          <ArrowUpDown className={cn('size-3', sortKey === k ? 'text-foreground' : 'text-muted-foreground/50')} />
        </button>
      </TableHead>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortHead k="nickname" className="pl-4">เซลล์</SortHead>
            <SortHead k="visits" className="text-right">วิ่งงาน</SortHead>
            <SortHead k="newSites" className="text-right">ใหม่</SortHead>
            <SortHead k="followUps" className="text-right">ติดตาม</SortHead>
            <SortHead k="won" className="text-right">จบได้</SortHead>
            <SortHead k="lost" className="text-right">จบที่อื่น</SortHead>
            <TableHead className="min-w-32">
              ผลลัพธ์ <OutcomeLegend className="mt-1 hidden font-normal xl:flex" />
            </TableHead>
            <SortHead k="winRate" className="text-right">ปิดได้%</SortHead>
            <SortHead k="overdue" className="pr-4 text-right">เลยกำหนด</SortHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r, i) => (
            <TableRow
              key={r.repId}
              className="cursor-pointer"
              onClick={() => navigate(`/performance/${r.repId}`)}
            >
              <TableCell className="pl-4">
                <div className="flex items-center gap-2.5">
                  <RepAvatar name={r.nickname} index={i} />
                  <div className="min-w-0">
                    <div className="font-bold">{r.nickname}</div>
                    <div className="max-w-40 truncate text-xs text-muted-foreground">{r.area}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="num text-right font-bold">{n(r.visits)}</TableCell>
              <TableCell className="num text-right">{n(r.newSites)}</TableCell>
              <TableCell className="num text-right">{n(r.followUps)}</TableCell>
              <TableCell className="num text-right">{n(r.won)}</TableCell>
              <TableCell className="num text-right">{n(r.lost)}</TableCell>
              <TableCell>
                <OutcomeBar won={r.won} open={r.following} lost={r.lost} cancelled={r.cancelled} />
              </TableCell>
              <TableCell className="num text-right font-bold">{pct(r.winRate)}</TableCell>
              <TableCell className="pr-4 text-right">
                {r.overdue > 0
                  ? <span className="num font-bold text-warning-ink">{r.overdue}</span>
                  : <span className="text-muted-foreground">-</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
