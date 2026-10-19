import { OutcomeBar, OutcomeLegend } from '@/components/shared'
import { pct } from '@/lib/fmt'
import type { AreaAnalytics } from '@/features/analytics'

interface Props {
  areas: AreaAnalytics[]
}

/** รายการพื้นที่ top N พร้อม outcome bar */
export function TopAreas({ areas }: Props) {
  return (
    <>
      <ul className="space-y-3">
        {areas.map((a) => (
          <li key={a.amphoe} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold">อ.{a.amphoe}</span>
              <span className="text-xs text-muted-foreground">
                วิ่ง <b className="num text-foreground">{a.visits}</b> · ปิดได้ <b className="num text-foreground">{pct(a.winRate)}</b>
              </span>
            </div>
            <OutcomeBar won={a.won} open={a.following} lost={a.lost} cancelled={a.cancelled} />
          </li>
        ))}
      </ul>
      <OutcomeLegend className="mt-4" />
    </>
  )
}
