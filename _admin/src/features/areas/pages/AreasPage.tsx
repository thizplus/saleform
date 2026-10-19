import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, OutcomeLegend, PageHeader, Panel } from '@/components/shared'
import { FilterBar } from '@/components/shared/filter-bar'
import { useByArea, useReps } from '@/features/analytics'
import { AreaChart } from '../components/AreaChart'
import { AreaTable } from '../components/AreaTable'

export function AreasPage() {
  const { data: reps } = useReps()
  const { data: areas, isLoading } = useByArea()

  const repItems = React.useMemo(
    () => (reps ?? []).filter((r) => r.status === 'active').map((r) => ({ value: r.id, label: r.nickname })),
    [reps],
  )
  const amphoeItems = React.useMemo(
    () => [...new Set((areas ?? []).map((a) => a.amphoe))],
    [areas],
  )

  const rows = areas ?? []

  return (
    <>
      <PageHeader title="พื้นที่" description="วิเคราะห์ผลงานแยกตามพื้นที่">
        <FilterBar reps={repItems} amphoes={amphoeItems} showArea={false} />
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <Empty>ไม่มีข้อมูลพื้นที่ในช่วงนี้</Empty>
      ) : (
        <>
          {/* กราฟ stacked bar */}
          <Panel title="สถานะแยกตามพื้นที่" description="จบได้ / ตามต่อ / จบที่อื่น">
            <AreaChart data={rows} />
          </Panel>

          {/* ตาราง expandable */}
          <Panel
            title="ตารางพื้นที่"
            description="คลิกอำเภอเพื่อดูตำบล"
            contentClassName="px-0"
            action={<OutcomeLegend withCancel />}
          >
            <AreaTable rows={rows} />
          </Panel>
        </>
      )}
    </>
  )
}
