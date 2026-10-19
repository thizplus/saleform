import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { AreaAnalytics } from '@/features/analytics'

const config = {
  won: { label: 'จบได้', color: 'var(--won)' },
  following: { label: 'ตามต่อ', color: 'var(--open)' },
  lost: { label: 'จบที่อื่น', color: 'var(--lost)' },
} satisfies ChartConfig

interface Props {
  data: AreaAnalytics[]
  height?: number
}

/** กราฟ stacked bar — แต่ละอำเภอ แยกตามสถานะ */
export function AreaChart({ data, height = 320 }: Props) {
  const chartData = data.map((a) => ({
    name: a.amphoe || 'ไม่ระบุ',
    won: a.won,
    following: a.following,
    lost: a.lost,
  }))

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={chartData} margin={{ left: -8, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={60}
          className="text-xs"
        />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="won" stackId="a" fill="var(--color-won)" maxBarSize={32} />
        <Bar dataKey="following" stackId="a" fill="var(--color-following)" maxBarSize={32} />
        <Bar dataKey="lost" stackId="a" fill="var(--color-lost)" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ChartContainer>
  )
}
