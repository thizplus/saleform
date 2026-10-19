import { BarList } from '@/components/shared'
import type { LostReasonsData } from '@/features/analytics'

interface Props {
  data: LostReasonsData
}

/** สรุปสาเหตุจบที่อื่น — แบบย่อ */
export function LostSummary({ data }: Props) {
  return (
    <>
      <BarList data={data.reasons.map(r => ({ name: r.reason, count: r.count }))} barClass="bg-lost/15" />
      {data.competitors[0] && (
        <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
          ร้านที่ได้งานไปมากที่สุด: <b>{data.competitors[0].name}</b>{' '}
          <span className="num text-muted-foreground">({data.competitors[0].count} งาน)</span>
        </p>
      )}
    </>
  )
}
