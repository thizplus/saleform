import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Delta, KpiCard, PageHeader, Panel } from '@/components/shared'
import { FilterBar } from '@/components/shared/filter-bar'
import { ActivityChart } from '@/components/shared/charts/ActivityChart'
import { OutcomeChart } from '@/components/shared/charts/OutcomeChart'
import { OutcomeSummary } from '@/components/shared/charts/OutcomeSummary'
import { PipelineBar } from '@/components/shared/charts/PipelineBar'
import { RepLeaderboard } from '../components/RepLeaderboard'
import { ActivityFeed } from '../components/ActivityFeed'
import { TopAreas } from '../components/TopAreas'
import { LostSummary } from '../components/LostSummary'
import { useSummary, useByRep, useTrend, useByArea, useLostReasons, useRecentActivity, useReps } from '@/features/analytics'
import { useTeamSummary } from '@/features/checkins/hooks'
import { useFilters } from '@/lib/filters'
import { delta, n, pct, thRange } from '@/lib/fmt'

export function DashboardPage() {
  const f = useFilters()
  const navigate = useNavigate()
  const [bucket, setBucket] = React.useState<'day' | 'week'>('day')

  const { data: summary } = useSummary()
  const { data: reps } = useReps()
  const { data: repRows } = useByRep()
  const { data: trend } = useTrend(bucket)
  const { data: weeklyTrend } = useTrend('week')
  const { data: areas } = useByArea()
  const { data: lostData } = useLostReasons()
  const { data: feed } = useRecentActivity()
  const { data: teamCheckIn } = useTeamSummary('month')

  const repItems = React.useMemo(() => (reps ?? []).filter(r => r.status === 'active').map(r => ({ value: r.id, label: r.nickname })), [reps])
  const amphoeItems = React.useMemo(() => [...new Set((areas ?? []).map(a => a.amphoe))], [areas])
  const sortedReps = React.useMemo(() => [...(repRows ?? [])].sort((a, b) => b.visits - a.visits), [repRows])

  const teamKm = React.useMemo(() => {
    if (!teamCheckIn?.reps) return { totalKm: 0, totalDays: 0 }
    return teamCheckIn.reps.reduce((acc, r) => ({ totalKm: acc.totalKm + r.totalKm, totalDays: acc.totalDays + r.checkInDays }), { totalKm: 0, totalDays: 0 })
  }, [teamCheckIn])

  const cur = summary
  const prev = summary?.previous

  if (!cur) {
    return (
      <>
        <PageHeader title="ภาพรวมทีมขาย"><FilterBar reps={repItems} amphoes={amphoeItems} /></PageHeader>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="ภาพรวมทีมขาย" description={`ข้อมูลช่วง ${thRange(f.range.from, f.range.to)} · เทียบกับช่วงก่อนหน้าเท่ากัน`}>
        <FilterBar reps={repItems} amphoes={amphoeItems} />
      </PageHeader>

      {/* KPI */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="วิ่งงาน" value={n(cur.visits)} unit="ครั้ง" delta={prev ? delta(cur.visits, prev.visits) : undefined}
          spark={trend?.map(d => d.value)} info="จำนวนรายงานทั้งหมดในช่วง (งานใหม่ + ติดตาม)" />
        <KpiCard label="งานใหม่" value={n(cur.newSites)} unit="งาน" delta={prev ? delta(cur.newSites, prev.newSites) : undefined}
          spark={trend?.map(d => d.newSites)} />
        <KpiCard label="จบได้" tone="won" value={n(cur.won)} unit="งาน" delta={prev ? delta(cur.won, prev.won) : undefined}
          spark={trend?.map(d => d.won)} info="นับตามวันที่ปิดงาน" />
        <KpiCard label="จบที่อื่น" tone="lost" value={n(cur.lost)} unit="งาน" delta={prev ? delta(cur.lost, prev.lost) : undefined} deltaInverse
          spark={trend?.map(d => d.lost)} />
        <KpiCard label="อัตราปิดได้" value={cur.winRate ?? '–'} unit={cur.winRate ? '%' : undefined}
          info="จบได้ ÷ (จบได้ + จบที่อื่น)"
          hint={prev && <span className="flex items-center gap-1.5">ช่วงก่อน {pct(prev.winRate)} <Delta value={cur.winRate - prev.winRate} suffix=" จุด" /></span>} />
        <KpiCard label="ติดตามอยู่" tone="warn" value={n(cur.following)} unit="งาน" onClick={() => navigate('/follow-ups')}
          info="หน้างานที่ยังเปิดอยู่ (ไม่ขึ้นกับช่วงเวลา)"
          hint={<span>เลยกำหนด <b className="num text-warning-ink">{cur.overdue}</b></span>} />
        <KpiCard label="ระยะทางรวม" value={n(teamKm.totalKm)} unit="กม." onClick={() => navigate('/check-ins')}
          info="ระยะทางวิ่งงานทั้งทีม (เดือนนี้)"
          hint={<span>เช็คอิน <b className="num">{teamKm.totalDays}</b> วัน</span>} />
      </section>

      {/* Activity chart + Outcome */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="การวิ่งงาน" description="จำนวนรายงานแยกงานใหม่ / ติดตาม"
          action={
            <Tabs value={bucket} onValueChange={(v) => setBucket(v as 'day' | 'week')}>
              <TabsList><TabsTrigger value="day" className="px-3">รายวัน</TabsTrigger><TabsTrigger value="week" className="px-3">รายสัปดาห์</TabsTrigger></TabsList>
            </Tabs>
          }>
          {trend && <ActivityChart data={trend} />}
        </Panel>

        <Panel title="ผลลัพธ์งานที่ปิดในช่วงนี้" info="นับตามวันที่ปิดงาน">
          <OutcomeSummary won={cur.won} lost={cur.lost} cancelled={cur.cancelled} winRate={cur.winRate} avgDaysToWin={cur.avgDaysToWin} />
          <div className="mt-5 border-t pt-4">
            <PipelineBar following={cur.following} overdue={cur.overdue} />
          </div>
        </Panel>
      </section>

      {/* Rep leaderboard */}
      {sortedReps.length > 0 && (
        <Panel title="ผลงานเซลล์" description="เรียงตามจำนวนวิ่งงาน · คลิกเพื่อดูรายละเอียด"
          action={<Button variant="ghost" size="sm" render={<Link to="/performance" />}>ดูรายงานเต็ม <ArrowRight /></Button>}
          contentClassName="px-0">
          <RepLeaderboard rows={sortedReps} checkInMap={React.useMemo(() => {
            const map = new Map<string, { totalKm: number; checkInDays: number }>()
            if (teamCheckIn?.reps) {
              for (const r of teamCheckIn.reps) map.set(r.repId, { totalKm: r.totalKm, checkInDays: r.checkInDays })
            }
            return map
          }, [teamCheckIn])} />
        </Panel>
      )}

      {/* Won vs lost / reasons / areas */}
      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="จบได้ vs จบที่อื่น" description="รายสัปดาห์">
          {weeklyTrend && <OutcomeChart data={weeklyTrend} />}
        </Panel>

        <Panel title="สาเหตุจบที่อื่น" description={lostData ? `${lostData.total} งาน` : ''}
          action={<Button variant="ghost" size="sm" render={<Link to="/lost" />}>วิเคราะห์ <ArrowRight /></Button>}>
          {lostData && <LostSummary data={lostData} />}
        </Panel>

        <Panel className="lg:col-span-2 xl:col-span-1" title="พื้นที่ที่วิ่งงานมากสุด"
          action={<Button variant="ghost" size="sm" render={<Link to="/areas" />}>ทั้งหมด <ArrowRight /></Button>}>
          <TopAreas areas={(areas ?? []).slice(0, 6)} />
        </Panel>
      </section>

      {/* Feed */}
      {feed && feed.length > 0 && (
        <Panel title="กิจกรรมล่าสุด" description="รายงานที่เซลล์ส่งเข้ามา" contentClassName="px-0">
          <ActivityFeed items={feed} />
        </Panel>
      )}
    </>
  )
}
