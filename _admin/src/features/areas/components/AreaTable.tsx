import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from 'cn'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OutcomeBar, OutcomeLegend } from '@/components/shared'
import { n, pct } from '@/lib/fmt'
import type { AreaAnalytics } from '@/features/analytics'

interface Props {
  rows: AreaAnalytics[]
}

/** ตารางพื้นที่แบบ expandable — อำเภอ → ตำบล */
export function AreaTable({ rows }: Props) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  function toggle(amphoe: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(amphoe)) next.delete(amphoe)
      else next.add(amphoe)
      return next
    })
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">
              อำเภอ/ตำบล <OutcomeLegend className="mt-1 hidden font-normal xl:flex" />
            </TableHead>
            <TableHead className="text-right">หน้างาน</TableHead>
            <TableHead className="text-right">จบได้</TableHead>
            <TableHead className="text-right">จบที่อื่น</TableHead>
            <TableHead className="text-right">ตามต่อ</TableHead>
            <TableHead className="min-w-28">ผลลัพธ์</TableHead>
            <TableHead className="pr-4 text-right">ปิดได้%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((area) => {
            const hasChildren = area.children && area.children.length > 0
            const isOpen = expanded.has(area.amphoe)

            return (
              <React.Fragment key={area.amphoe}>
                {/* Amphoe row */}
                <TableRow
                  className={cn(hasChildren && 'cursor-pointer')}
                  onClick={() => hasChildren && toggle(area.amphoe)}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-1.5">
                      {hasChildren && (
                        <ChevronRight
                          className={cn(
                            'size-4 shrink-0 text-muted-foreground transition-transform',
                            isOpen && 'rotate-90',
                          )}
                        />
                      )}
                      <span className="font-bold">{area.amphoe || 'ไม่ระบุ'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="num text-right font-medium">{n(area.visits)}</TableCell>
                  <TableCell className="num text-right">{n(area.won)}</TableCell>
                  <TableCell className="num text-right">{n(area.lost)}</TableCell>
                  <TableCell className="num text-right">{n(area.following)}</TableCell>
                  <TableCell>
                    <OutcomeBar won={area.won} open={area.following} lost={area.lost} cancelled={area.cancelled} />
                  </TableCell>
                  <TableCell className="num pr-4 text-right font-bold">{pct(area.winRate)}</TableCell>
                </TableRow>

                {/* Tambon children */}
                {isOpen && area.children?.map((child) => (
                  <TableRow key={`${area.amphoe}-${child.tambon}`} className="bg-muted/30">
                    <TableCell className="pl-12 text-muted-foreground">
                      {child.tambon || 'ไม่ระบุ'}
                    </TableCell>
                    <TableCell className="num text-right text-muted-foreground">{n(child.visits)}</TableCell>
                    <TableCell className="num text-right text-muted-foreground">{n(child.won)}</TableCell>
                    <TableCell className="num text-right text-muted-foreground">{n(child.lost)}</TableCell>
                    <TableCell className="num text-right text-muted-foreground">{n(child.following)}</TableCell>
                    <TableCell>
                      <OutcomeBar won={child.won} open={child.following} lost={child.lost} cancelled={child.cancelled} />
                    </TableCell>
                    <TableCell className="num pr-4 text-right text-muted-foreground">{pct(child.winRate)}</TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
