import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Target, CircleCheck, Percent } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useMyStats } from '../hooks'

type Period = 'week' | 'month' | 'year'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'สัปดาห์นี้' },
  { value: 'month', label: 'เดือนนี้' },
  { value: 'year', label: 'ปีนี้' },
]

/** L10 — ผลงานของฉัน */
export function MyStatsPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const [period, setPeriod] = useState<Period>('month')
  const { data: stats, isLoading } = useMyStats(period)

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1" aria-label="กลับ">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-bold">ผลงานของฉัน</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Profile */}
        <div className="flex items-center gap-3">
          {profile?.pictureUrl && (
            <img src={profile.pictureUrl} alt="" className="size-12 rounded-full" />
          )}
          <div>
            <p className="font-bold">{profile?.nickname || profile?.displayName}</p>
            <p className="text-sm text-muted-foreground">
              {profile?.area || 'ไม่ระบุพื้นที่'}
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`py-2 rounded-lg text-sm font-bold transition-colors ${
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
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-16 mb-2" />
                <div className="h-8 bg-muted rounded w-12" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Hero stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={TrendingUp}
                label="วิ่งงาน"
                value={stats.running}
                iconClass="text-primary"
              />
              <StatCard
                icon={Target}
                label="งานใหม่"
                value={stats.newJobs}
                iconClass="text-primary"
              />
              <StatCard
                icon={CircleCheck}
                label="จบได้"
                value={stats.completed}
                iconClass="text-success"
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
            <section className="space-y-2">
              <h3 className="text-sm font-bold">ผลลัพธ์งาน</h3>
              <OutcomeBar
                won={stats.outcomes.won}
                following={stats.outcomes.following}
                lost={stats.outcomes.lost}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  <span className="inline-block size-2 rounded-full bg-success mr-1" />
                  จบได้ <span className="num font-bold">{stats.outcomes.won}</span>
                </span>
                <span>
                  <span className="inline-block size-2 rounded-full bg-primary mr-1" />
                  ตามต่อ <span className="num font-bold">{stats.outcomes.following}</span>
                </span>
                <span>
                  <span className="inline-block size-2 rounded-full bg-danger mr-1" />
                  จบที่อื่น <span className="num font-bold">{stats.outcomes.lost}</span>
                </span>
              </div>
            </section>

            {/* On-time rate */}
            {stats.onTimeRate != null && (
              <section className="border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">ตามตรงเวลา</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-black num">{stats.onTimeRate}%</p>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(stats.onTimeRate, 100)}%` }}
                  />
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">ไม่มีข้อมูลผลงาน</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** การ์ดตัวเลข */
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
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`size-4 ${iconClass}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-black num">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

/** แถบผลลัพธ์ stacked */
function OutcomeBar({ won, following, lost }: { won: number; following: number; lost: number }) {
  const total = won + following + lost
  if (total === 0) {
    return <div className="h-3 bg-muted rounded-full" />
  }

  return (
    <div className="h-3 rounded-full overflow-hidden flex">
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
