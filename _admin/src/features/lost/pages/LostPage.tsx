import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { BarList, Empty, KpiCard, PageHeader, Panel } from '@/components/shared'
import { FilterBar } from '@/components/shared/filter-bar'
import { useLostReasons, useByArea, useReps } from '@/features/analytics'
import { n } from '@/lib/fmt'
import { LostSiteTable } from '../components/LostSiteTable'

export function LostPage() {
  const { data: reps } = useReps()
  const { data: areas } = useByArea()
  const { data: lostData, isLoading } = useLostReasons()

  const repItems = React.useMemo(
    () => (reps ?? []).filter((r) => r.status === 'active').map((r) => ({ value: r.id, label: r.nickname })),
    [reps],
  )
  const amphoeItems = React.useMemo(
    () => [...new Set((areas ?? []).map((a) => a.amphoe))],
    [areas],
  )

  const topReason = lostData?.reasons[0]
  const topCompetitor = lostData?.competitors[0]

  return (
    <>
      <PageHeader title="สาเหตุจบที่อื่น" description="วิเคราะห์งานที่เสียให้คู่แข่ง">
        <FilterBar reps={repItems} amphoes={amphoeItems} />
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !lostData ? (
        <Empty>ไม่มีข้อมูลงานจบที่อื่นในช่วงนี้</Empty>
      ) : (
        <>
          {/* KPI row */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <KpiCard
              label="จบที่อื่นทั้งหมด"
              tone="lost"
              value={n(lostData.total)}
              unit="งาน"
            />
            <KpiCard
              label="สาเหตุอันดับ 1"
              value={topReason?.reason ?? '-'}
              hint={topReason ? `${n(topReason.count)} งาน` : undefined}
            />
            <KpiCard
              label="คู่แข่งอันดับ 1"
              value={topCompetitor?.name ?? '-'}
              hint={topCompetitor ? `${n(topCompetitor.count)} งาน` : undefined}
            />
          </section>

          {/* สาเหตุ + คู่แข่ง */}
          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="สาเหตุ" description={`${lostData.reasons.length} รายการ`}>
              {lostData.reasons.length === 0 ? (
                <Empty>ไม่มีข้อมูล</Empty>
              ) : (
                <BarList
                  data={lostData.reasons.map((r) => ({ name: r.reason, count: r.count }))}
                  valueLabel="จำนวน"
                  barClass="bg-lost/20"
                />
              )}
            </Panel>

            <Panel title="ร้านคู่แข่ง" description={`${lostData.competitors.length} ร้าน`}>
              {lostData.competitors.length === 0 ? (
                <Empty>ไม่มีข้อมูล</Empty>
              ) : (
                <BarList
                  data={lostData.competitors.map((c) => ({ name: c.name, count: c.count }))}
                  valueLabel="จำนวน"
                  barClass="bg-warning/20"
                />
              )}
            </Panel>
          </section>

          {/* เสียงานตอนอยู่ขั้นไหน */}
          {lostData.byStage.length > 0 && (
            <Panel title="เสียงานตอนอยู่ขั้นไหน" description="แยกตาม stage ตอนที่ปิดงาน">
              <BarList
                data={lostData.byStage.map((s) => ({ name: s.stage, count: s.count }))}
                valueLabel="จำนวน"
              />
            </Panel>
          )}

          {/* รายการงานที่จบที่อื่น */}
          {lostData.sites.length > 0 && (
            <Panel
              title="รายการงานที่จบที่อื่น"
              description={`${n(lostData.sites.length)} งาน`}
              contentClassName="px-0"
            >
              <LostSiteTable sites={lostData.sites} />
            </Panel>
          )}
        </>
      )}
    </>
  )
}
