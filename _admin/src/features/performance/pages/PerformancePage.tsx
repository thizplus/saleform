import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, OutcomeLegend, PageHeader, Panel } from '@/components/shared'
import { FilterBar } from '@/components/shared/filter-bar'
import { useByRep, useByArea, useReps } from '@/features/analytics'
import { RepCompareChart } from '../components/RepCompareChart'
import { RepTable } from '../components/RepTable'

export function PerformancePage() {
  const { data: reps } = useReps()
  const { data: repRows, isLoading } = useByRep()
  const { data: areas } = useByArea()

  const repItems = React.useMemo(
    () => (reps ?? []).filter((r) => r.status === 'active').map((r) => ({ value: r.id, label: r.nickname })),
    [reps],
  )
  const amphoeItems = React.useMemo(
    () => [...new Set((areas ?? []).map((a) => a.amphoe))],
    [areas],
  )

  const rows = repRows ?? []

  return (
    <>
      <PageHeader title="ผลงานเซลล์" description="เปรียบเทียบผลงานเซลล์ทั้งทีม">
        <FilterBar reps={repItems} amphoes={amphoeItems} showRep={false} />
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <Empty>ไม่มีข้อมูลเซลล์ในช่วงนี้</Empty>
      ) : (
        <>
          {/* กราฟเปรียบเทียบ */}
          <Panel title="เปรียบเทียบเซลล์" description="เลือก metric ด้านขวามือ">
            <RepCompareChart rows={rows} />
          </Panel>

          {/* ตารางผลงาน */}
          <Panel
            title="ตารางผลงาน"
            description="คลิกแถวเพื่อดูรายละเอียด"
            contentClassName="px-0"
            action={<OutcomeLegend withCancel />}
          >
            <RepTable rows={rows} />
          </Panel>
        </>
      )}
    </>
  )
}
