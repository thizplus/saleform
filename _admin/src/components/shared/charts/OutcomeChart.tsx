import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { keyLabel } from '@/lib/fmt'
import type { TrendPoint } from '@/features/analytics'

const config = {
  won: { label: 'จบได้', color: 'var(--won)' },
  lost: { label: 'จบที่อื่น', color: 'var(--lost)' },
} satisfies ChartConfig

interface Props {
  data: TrendPoint[]
  height?: number
}

/** กราฟจบได้ vs จบที่อื่น รายสัปดาห์ */
export function OutcomeChart({ data, height = 240 }: Props) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ left: -8, right: 4, top: 8 }} barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={keyLabel} />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={<ChartTooltipContent labelFormatter={(v) => `สัปดาห์ของ ${keyLabel(v as string)}`} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="won" fill="var(--color-won)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="lost" fill="var(--color-lost)" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
  )
}
