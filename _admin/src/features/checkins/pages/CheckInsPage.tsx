import * as React from 'react'
import { cn } from 'cn'
import { CalendarCheck, Route, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, KpiCard, RepAvatar, Empty } from '@/components/shared'
import { n, thDate, time as fmtTime } from '@/lib/fmt'
import { useCheckInsByDate, useTeamSummary } from '../hooks'
import { useReps } from '@/features/analytics'

const TABS = [
  { id: 'log', label: 'เช็คอินวันนี้', icon: CalendarCheck },
  { id: 'summary', label: 'สรุประยะทาง', icon: Route },
] as const

const PERIODS = [
  { id: 'week', label: 'สัปดาห์นี้' },
  { id: 'month', label: 'เดือนนี้' },
  { id: 'year', label: 'ปีนี้' },
] as const

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CheckInsPage() {
  const [tab, setTab] = React.useState<'log' | 'summary'>('log')
  const [date, setDate] = React.useState(todayStr)
  const [period, setPeriod] = React.useState('month')

  return (
    <>
      <PageHeader title="เช็คอิน" description="เช็คอินประจำวันก่อนเริ่มงาน — ทะเบียน, ไมล์, เซลฟี่" />

      <div className="flex gap-1 border-b">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm',
                tab === t.id ? 'border-foreground font-bold' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <Icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'log' ? <LogTab date={date} setDate={setDate} /> : <SummaryTab period={period} setPeriod={setPeriod} />}
    </>
  )
}

/* ====== Tab 1: Log วันนี้ ====== */

function LogTab({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const { data: rows, isLoading } = useCheckInsByDate(date)
  const { data: reps } = useReps()
  const isToday = date === todayStr()

  const activeReps = React.useMemo(() => (reps ?? []).filter((r) => r.status === 'active'), [reps])
  const checkedRepIds = React.useMemo(() => new Set((rows ?? []).map((r) => r.repId)), [rows])
  const notChecked = React.useMemo(() => activeReps.filter((r) => !checkedRepIds.has(r.id)), [activeReps, checkedRepIds])

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setDate(shiftDate(date, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <button type="button" onClick={() => setDate(todayStr())}
          className={cn('text-sm font-bold', isToday ? 'text-primary' : 'text-foreground hover:text-primary')}>
          {thDate(new Date(date + 'T00:00:00'))}
          {isToday && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(วันนี้)</span>}
        </button>
        <Button variant="ghost" size="icon" onClick={() => setDate(shiftDate(date, 1))} disabled={isToday}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="เช็คอินแล้ว" value={rows?.length ?? 0} unit={`/ ${activeReps.length} คน`} />
        <KpiCard label="ยังไม่เช็คอิน" value={notChecked.length} tone={notChecked.length > 0 ? 'warn' : undefined} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : !rows?.length ? (
        <Empty>ยังไม่มีใครเช็คอินวันนี้</Empty>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เซลล์</TableHead>
                <TableHead>ทะเบียน</TableHead>
                <TableHead className="text-right">ไมล์</TableHead>
                <TableHead className="text-right">ระยะทาง</TableHead>
                <TableHead>เวลา</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RepAvatar name={row.repName} index={i} size="sm" />
                      <span className="font-medium text-sm">{row.repName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.licensePlate}</TableCell>
                  <TableCell className="text-right num text-sm">{n(row.mileage)}</TableCell>
                  <TableCell className="text-right num text-sm font-bold">
                    {row.dailyKm != null ? `${n(row.dailyKm)} km` : '–'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtTime(new Date(row.createdAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ยังไม่เช็คอิน */}
      {notChecked.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground">ยังไม่เช็คอิน ({notChecked.length})</h3>
          <div className="flex flex-wrap gap-2">
            {notChecked.map((r, i) => (
              <div key={r.id} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                <RepAvatar name={r.displayName} index={i} size="sm" />
                <span className="text-xs">{r.nickname || r.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ====== Tab 2: สรุประยะทาง ====== */

function SummaryTab({ period, setPeriod }: { period: string; setPeriod: (p: string) => void }) {
  const { data: summary, isLoading } = useTeamSummary(period)

  const sorted = React.useMemo(
    () => [...(summary?.reps ?? [])].sort((a, b) => b.totalKm - a.totalKm),
    [summary],
  )

  const totalKM = sorted.reduce((s, r) => s + r.totalKm, 0)
  const totalDays = sorted.reduce((s, r) => s + r.checkInDays, 0)

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)}
            className={cn('h-8 rounded-full px-3 text-xs font-bold border transition-colors',
              period === p.id ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-input hover:bg-muted')}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Team KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="ระยะทางรวม" value={n(totalKM)} unit="km" />
        <KpiCard label="วันเช็คอิน" value={n(totalDays)} unit="วัน" />
        <KpiCard label="เฉลี่ยต่อคน" value={sorted.length ? n(Math.round(totalKM / sorted.length)) : '0'} unit="km" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : !sorted.length ? (
        <Empty>ยังไม่มีข้อมูลในช่วงนี้</Empty>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>เซลล์</TableHead>
                <TableHead className="text-right">วันเช็คอิน</TableHead>
                <TableHead className="text-right">ระยะทางรวม</TableHead>
                <TableHead className="text-right">เฉลี่ย/วัน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((rep, i) => (
                <TableRow key={rep.repId}>
                  <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RepAvatar name={rep.repName} index={i} size="sm" />
                      <span className="font-medium text-sm">{rep.repName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right num text-sm">{rep.checkInDays} วัน</TableCell>
                  <TableCell className="text-right num text-sm font-bold">{n(rep.totalKm)} km</TableCell>
                  <TableCell className="text-right num text-sm text-muted-foreground">{rep.avgKmPerDay} km</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
