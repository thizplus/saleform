import * as React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { n, pct } from '@/lib/fmt'
import type { RepAnalytics } from '@/features/analytics'

type Metric = 'visits' | 'newSites' | 'won' | 'winRate'

const METRIC_OPTS: { value: Metric; label: string }[] = [
  { value: 'visits', label: 'วิ่งงาน' },
  { value: 'newSites', label: 'งานใหม่' },
  { value: 'won', label: 'จบได้' },
  { value: 'winRate', label: 'ปิดได้%' },
]

const config = {
  value: { label: 'ค่า', color: 'var(--chart-1)' },
} satisfies ChartConfig

const SHADES = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

interface Props {
  rows: RepAnalytics[]
}

/** กราฟแท่งแนวนอนเปรียบเทียบเซลล์ตาม metric ที่เลือก */
export function RepCompareChart({ rows }: Props) {
  const [metric, setMetric] = React.useState<Metric>('visits')

  const data = React.useMemo(() => {
    const sorted = [...rows].sort((a, b) => b[metric] - a[metric])
    return sorted.map((r) => ({
      name: r.nickname,
      value: r[metric],
      repId: r.repId,
    }))
  }, [rows, metric])

  const formatter = metric === 'winRate' ? (v: number) => pct(v) : (v: number) => n(v)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRIC_OPTS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={config} className="w-full" style={{ height: Math.max(rows.length * 40 + 40, 200) }}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatter} />
          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={72} className="text-xs" />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
            content={<ChartTooltipContent formatter={(v) => formatter(v as number)} />}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={SHADES[idx % SHADES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
