import { cn } from 'cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { addDays, dayKey, startOfDay, today } from '@/lib/date-utils'
import { thDate, thDow } from '@/lib/fmt'

const LEVELS = ['bg-muted', 'bg-foreground/20', 'bg-foreground/45', 'bg-foreground/70', 'bg-foreground']
const DOW = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

/** ปฏิทินกิจกรรม (แบบ GitHub) — คอลัมน์ = สัปดาห์, แถว = จันทร์–อาทิตย์ ขยายเต็มความกว้าง */
export function CalendarHeatmap({ counts, weeks = 13 }: { counts: Map<string, number>; weeks?: number }) {
  const end = today()
  const endMonday = addDays(end, -((end.getDay() + 6) % 7))
  const start = addDays(endMonday, -(weeks - 1) * 7)
  const max = Math.max(1, ...counts.values())
  const level = (v: number) => (v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)))
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `1.75rem repeat(${weeks}, minmax(0, 1fr))` }}>
        <span />
        {cols.map((days, wi) => (
          <span key={wi} className="truncate text-[10px] text-muted-foreground">
            {wi === 0 || days[0].getDate() <= 7 ? thDate(days[0], false).split(' ')[1] : ''}
          </span>
        ))}
        {DOW.map((label, di) => (
          <div key={label} className="contents">
            <span className="flex items-center text-[10px] text-muted-foreground">{di % 2 === 0 ? label : ''}</span>
            {cols.map((days) => {
              const d = days[di]
              const future = startOfDay(d) > end
              const v = counts.get(dayKey(d)) ?? 0
              return (
                <Tooltip key={d.toISOString()}>
                  <TooltipTrigger render={<span />} className={cn('aspect-square max-h-6 w-full rounded-[4px]', future ? 'bg-transparent' : LEVELS[level(v)])} />
                  {!future && <TooltipContent className="text-xs">{thDow(d)} {thDate(d)} · <b className="num">{v}</b> รายงาน</TooltipContent>}
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        น้อย {LEVELS.map((c) => <span key={c} className={cn('size-3 rounded-[3px]', c)} />)} มาก
      </div>
    </div>
  )
}
