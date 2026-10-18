import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Target, CircleCheck, Percent, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useMyStats } from '../hooks'

type Period = 'week' | 'month' | 'year'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'สัปดาห์นี้' },
  { value: 'month', label: 'เดือนนี้' },
  { value: 'year', label: 'ปีนี้' },
]

/** L10 — ผลงานของฉัน (compact) */
export function MyStatsPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const [period, setPeriod] = useState<Period>('month')
  const { data: stats, isLoading } = useMyStats(period)

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 h-12 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1" aria-label="กลับ">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-sm font-bold">ผลงานของฉัน</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Profile compact */}
        <div className="flex items-center gap-2.5">
          {profile?.pictureUrl && (
            <img src={profile.pictureUrl} alt="" className="size-10 rounded-full" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{profile?.nickname || profile?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.area || 'ไม่ระบุพื้นที่'}
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="grid grid-cols-3 gap-0.5 p-0.5 rounded-lg bg-muted">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`py-1.5 rounded-md text-xs font-bold transition-colors ${
                period === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border rounded-xl p-3 animate-pulse">
                <div className="h-3 bg-muted rounded w-12 mb-2" />
                <div className="h-6 bg-muted rounded w-8" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Hero stats — 2x2 grid compact */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={TrendingUp}
                label="วิ่งงาน"
                value={stats.running}
                iconClass="text-primary"
                sub={stats.teamAvgRunning != null ? `ทีมเฉลี่ย ${stats.teamAvgRunning}` : undefined}
              />
              <StatCard
                icon={Target}
                label="งานใหม่"
                value={stats.newJobs}
                iconClass="text-primary"
                sub={stats.teamAvgNewJobs != null ? `ทีมเฉลี่ย ${stats.teamAvgNewJobs}` : undefined}
              />
              <StatCard
                icon={CircleCheck}
                label="จบได้"
                value={stats.outcomes.won}
                iconClass="text-success"
                sub={stats.completed > 0 ? `จาก ${stats.completed} งานที่จบ` : undefined}
              />
              <StatCard
                icon={Percent}
                label="อัตราปิด"
                value={`${stats.closeRate}%`}
                iconClass="text-success"
                sub={stats.teamCloseRate != null ? `ทีม ${stats.teamCloseRate}%` : undefined}
              />
            </div>

            {/* Outcome bar */}
            <section className="space-y-1.5">
              <h3 className="text-xs font-bold text-muted-foreground">ผลลัพธ์งาน</h3>
              <OutcomeBar
                won={stats.outcomes.won}
                following={stats.outcomes.following}
                lost={stats.outcomes.lost}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-success" />
                  จบได้ <span className="num font-bold">{stats.outcomes.won}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-primary" />
                  ตามต่อ <span className="num font-bold">{stats.outcomes.following}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-danger" />
                  จบที่อื่น <span className="num font-bold">{stats.outcomes.lost}</span>
                </span>
              </div>
            </section>

            {/* On-time rate */}
            {stats.onTimeRate != null && (
              <section className="border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">ตามตรงเวลา</p>
                  <p className="text-xl font-black num">{stats.onTimeRate}%</p>
                </div>
                <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(stats.onTimeRate, 100)}%` }}
                  />
                </div>
              </section>
            )}

            {/* Overdue warning */}
            {stats.overdue > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-warning-soft bg-warning-soft/30 px-3 py-2.5">
                <AlertTriangle className="size-4 text-warning-ink shrink-0" />
                <p className="text-xs text-warning-ink font-bold">
                  เลยกำหนดอยู่ <span className="num">{stats.overdue}</span> งาน
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">ไม่มีข้อมูลผลงาน</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** การ์ดตัวเลข compact */
function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
  sub,
}: {
  icon: typeof TrendingUp
  label: string
  value: number | string
  iconClass: string
  sub?: string
}) {
  return (
    <div className="border rounded-xl p-3">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={`size-3.5 ${iconClass}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-black num leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

/** แถบผลลัพธ์ stacked */
function OutcomeBar({ won, following, lost }: { won: number; following: number; lost: number }) {
  const total = won + following + lost
  if (total === 0) {
    return <div className="h-2.5 bg-muted rounded-full" />
  }

  return (
    <div className="h-2.5 rounded-full overflow-hidden flex">
      {won > 0 && (
        <div className="bg-success h-full" style={{ width: `${(won / total) * 100}%` }} />
      )}
      {following > 0 && (
        <div className="bg-primary h-full" style={{ width: `${(following / total) * 100}%` }} />
      )}
      {lost > 0 && (
        <div className="bg-danger h-full" style={{ width: `${(lost / total) * 100}%` }} />
      )}
    </div>
  )
}
