import * as React from 'react'
import { cn } from 'cn'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, PageHeader } from '@/components/shared'
import { useReps, useByRep } from '@/features/analytics'
import type { RepStatus } from '@/lib/types'
import { RepCard } from '../components/RepCard'

const TABS: { id: RepStatus; label: string }[] = [
  { id: 'active', label: 'ใช้งาน' },
  { id: 'pending', label: 'รออนุมัติ' },
  { id: 'inactive', label: 'ปิดใช้งาน' },
]

export function RepsPage() {
  const [tab, setTab] = React.useState<RepStatus>('active')
  const { data: reps, isLoading } = useReps()
  const { data: repAnalytics } = useByRep()

  const analyticsMap = React.useMemo(() => {
    const m = new Map<string, (typeof repAnalytics extends (infer T)[] | undefined ? T : never)>()
    for (const r of repAnalytics ?? []) m.set(r.repId, r)
    return m
  }, [repAnalytics])

  const list = React.useMemo(() => (reps ?? []).filter(r => r.status === tab), [reps, tab])

  if (isLoading) {
    return (
      <>
        <PageHeader title="เซลล์" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="เซลล์" description="เซลล์ลงทะเบียนเองผ่าน LIFF ครั้งแรก → แอดมินอนุมัติก่อนใช้งาน" />

      <div className="flex gap-1 border-b">
        {TABS.map((t) => {
          const c = (reps ?? []).filter(r => r.status === t.id).length
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm',
                tab === t.id ? 'border-foreground font-bold' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t.label}
              <span className={cn('num rounded px-1.5 text-xs', t.id === 'pending' && c ? 'bg-warning-soft text-warning-ink' : 'bg-muted')}>{c}</span>
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <Empty>ไม่มีเซลล์ในสถานะนี้</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r, i) => (
            <RepCard key={r.id} rep={r} index={i} analytics={analyticsMap.get(r.id)} />
          ))}
        </div>
      )}
    </>
  )
}
