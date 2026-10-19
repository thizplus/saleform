import { Link } from 'react-router-dom'
import { CircleCheck, CircleX, FilePlus2, RefreshCw } from 'lucide-react'
import { StatusBadge } from '@/components/shared'
import { relative } from '@/lib/fmt'
import type { RecentActivityItem } from '@/features/analytics'

interface Props {
  items: RecentActivityItem[]
}

/** รายการกิจกรรมล่าสุด */
export function ActivityFeed({ items }: Props) {
  return (
    <ul className="divide-y">
      {items.map((r) => {
        const Icon = r.reportType === 'new' ? FilePlus2 : r.status === 'won' ? CircleCheck : r.status === 'lost' ? CircleX : RefreshCw
        return (
          <li key={r.id}>
            <Link to={`/sites?code=${r.siteCode}`} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <b>{r.repName}</b>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Icon className="size-3.5" />
                    {r.reportType === 'new' ? 'รายงานงานใหม่' : r.status === 'following' ? 'ติดตามงาน' : 'ปิดงาน'}
                  </span>
                  <span className="num text-xs text-muted-foreground">#{r.siteCode}</span>
                  {r.status !== 'following' && <StatusBadge status={r.status} />}
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{r.note}</p>
              </div>
              <span className="num shrink-0 text-xs text-muted-foreground">{relative(new Date(r.reportDate))}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
