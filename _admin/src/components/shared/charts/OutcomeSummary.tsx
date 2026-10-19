import { OutcomeBar } from '@/components/shared'
import { n, pct } from '@/lib/fmt'

interface Props {
  won: number
  lost: number
  cancelled: number
  winRate: number
  avgDaysToWin: number | null
}

/** แผงสรุปผลลัพธ์: อัตราปิดได้ + outcome bar + ตัวเลข */
export function OutcomeSummary({ won, lost, cancelled, winRate, avgDaysToWin }: Props) {
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-muted-foreground">อัตราปิดได้</div>
          <div className="num text-5xl font-bold tracking-tight">{pct(winRate)}</div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          ปิดแล้ว <b className="num text-foreground">{n(won + lost + cancelled)}</b> งาน
          <div>เฉลี่ยปิดได้ใน <b className="num text-foreground">{avgDaysToWin ?? '–'}</b> วัน</div>
        </div>
      </div>
      <OutcomeBar won={won} open={0} lost={lost} cancelled={cancelled} className="mt-4 h-3" />
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        {([['จบได้', won, 'bg-won'], ['จบที่อื่น', lost, 'bg-lost'], ['ยกเลิก', cancelled, 'bg-cancel']] as const).map(([l, v, c]) => (
          <div key={l} className="rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${c}`} />{l}</div>
            <div className="num mt-0.5 text-xl font-bold">{n(v)}</div>
          </div>
        ))}
      </div>
    </>
  )
}
