import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CircleCheck,
  CircleX,
  Clock,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatThaiDate } from '@/lib/format-th'
import { useSummary, useByRep, useTrend } from '../hooks'
import type { SummaryData, RepAnalytics } from '../service'

export function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useSummary()
  const { data: reps } = useByRep()
  const { data: trend } = useTrend()

  return (
    <div className="space-y-6">
      {/* Stat Row */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-3 bg-muted rounded w-12 mb-2" />
                <div className="h-7 bg-muted rounded w-8" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <StatRow summary={summary} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="size-4" />
                การวิ่งงานรายวัน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!trend?.length ? (
                <p className="text-sm text-muted-foreground text-center py-12">ยังไม่มีข้อมูล</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => formatThaiDate(v)}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                      labelFormatter={(v) => formatThaiDate(String(v))}
                    />
                    <Bar dataKey="value" name="วิ่งงาน" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rep Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">ผลงานเซลล์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!reps?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูล</p>
              ) : (
                reps.map((rep) => <RepRow key={rep.repId} rep={rep} />)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatRow({ summary }: { summary: SummaryData }) {
  const prev = summary.previous
  const stats = [
    { label: 'วิ่งงาน', value: summary.visits, prev: prev.visits, icon: Target, color: 'text-primary' },
    { label: 'งานใหม่', value: summary.newSites, prev: prev.newSites, icon: Target, color: 'text-primary' },
    { label: 'จบได้', value: summary.won, prev: prev.won, icon: CircleCheck, color: 'text-success' },
    { label: 'จบที่อื่น', value: summary.lost, prev: prev.lost, icon: CircleX, color: 'text-danger' },
    { label: 'ติดตามอยู่', value: summary.following, prev: null, icon: Clock, color: 'text-muted-foreground' },
    { label: 'เลยกำหนด', value: summary.overdue, prev: null, icon: AlertTriangle, color: summary.overdue > 0 ? 'text-warning' : 'text-muted-foreground' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`size-3.5 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-black num leading-tight">{s.value}</p>
            {s.prev !== null && <ChangeIndicator current={s.value} previous={s.prev} />}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  const diff = current - previous
  if (diff === 0) {
    return (
      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
        <Minus className="size-3" /> เท่าเดิม
      </span>
    )
  }
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : 100
  const isUp = diff > 0
  return (
    <span className={`text-[11px] flex items-center gap-0.5 mt-0.5 ${isUp ? 'text-success' : 'text-danger'}`}>
      {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      <span className="num">{isUp ? '+' : ''}{pct}%</span>
    </span>
  )
}

function RepRow({ rep }: { rep: RepAnalytics }) {
  const total = rep.won + rep.lost + rep.following
  const wonPct = total > 0 ? (rep.won / total) * 100 : 0
  const followPct = total > 0 ? (rep.following / total) * 100 : 0
  const lostPct = total > 0 ? (rep.lost / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        {rep.pictureUrl && <AvatarImage src={rep.pictureUrl} alt="" />}
        <AvatarFallback className="text-xs">{(rep.nickname || '?').slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{rep.nickname || rep.repId.slice(0, 8)}</span>
          <span className="text-xs text-muted-foreground num">{rep.visits} งาน</span>
        </div>
        {/* Outcome bar */}
        {total > 0 && (
          <div className="h-2 rounded-full overflow-hidden flex mt-1 bg-muted">
            {wonPct > 0 && <div className="bg-success h-full" style={{ width: `${wonPct}%` }} />}
            {followPct > 0 && <div className="bg-muted-foreground/30 h-full" style={{ width: `${followPct}%` }} />}
            {lostPct > 0 && <div className="bg-danger h-full" style={{ width: `${lostPct}%` }} />}
          </div>
        )}
        <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
          <span>จบได้ <span className="num font-medium text-success">{rep.won}</span></span>
          <span>ตามต่อ <span className="num font-medium">{rep.following}</span></span>
          <span>จบที่อื่น <span className="num font-medium text-danger">{rep.lost}</span></span>
          {rep.overdue > 0 && <span className="text-warning">เลยกำหนด <span className="num font-medium">{rep.overdue}</span></span>}
        </div>
      </div>
    </div>
  )
}
