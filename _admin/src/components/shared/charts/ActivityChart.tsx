import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { keyLabel } from '@/lib/fmt'
import type { TrendPoint } from '@/features/analytics'

const config = {
  newSites: { label: 'งานใหม่', color: 'var(--chart-1)' },
  followUps: { label: 'ติดตาม', color: 'var(--chart-3)' },
} satisfies ChartConfig

interface Props {
  data: TrendPoint[]
  height?: number
}

/** กราฟวิ่งงาน stacked bar — งานใหม่ + ติดตาม */
export function ActivityChart({ data, height = 280 }: Props) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ left: -16, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={keyLabel} />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={<ChartTooltipContent labelFormatter={(v) => keyLabel(v as string)} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="newSites" stackId="a" fill="var(--color-newSites)" radius={[0, 0, 0, 0]} maxBarSize={28} />
        <Bar dataKey="followUps" stackId="a" fill="var(--color-followUps)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  )
}
