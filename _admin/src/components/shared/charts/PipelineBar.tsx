import { n } from '@/lib/fmt'

interface Props {
  following: number
  overdue: number
}

/** แถบ pipeline: เลยกำหนด / ยังไม่ถึงกำหนด */
export function PipelineBar({ following, overdue }: Props) {
  const upcoming = following - overdue
  const max = Math.max(following, 1)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold">งานที่ยังตามอยู่</span>
        <span className="num text-muted-foreground">{n(following)} งาน</span>
      </div>
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full">
        <div className="bg-warning" style={{ width: `${(overdue / max) * 100}%` }} />
        <div className="bg-muted" style={{ width: `${(upcoming / max) * 100}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning" />เลยกำหนด <b className="num text-foreground">{overdue}</b></span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted ring-1 ring-border" />ยังไม่ถึงกำหนด <b className="num text-foreground">{upcoming}</b></span>
      </div>
    </div>
  )
}
