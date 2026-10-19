import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, Info } from 'lucide-react'
import { cn } from 'cn'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { STATUS_LABEL, type SiteStatus } from '@/lib/types'
import { n } from '@/lib/fmt'

/* ---------------------------------------------------------------- Page header */
export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

/* ---------------------------------------------------------------- Section card */
export function Panel({
  title, description, action, info, children, className, contentClassName,
}: {
  title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; info?: string
  children: React.ReactNode; className?: string; contentClassName?: string
}) {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 font-bold">
          {title}
          {info && <InfoTip text={info} />}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={cn('min-w-0', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<button type="button" className="text-muted-foreground hover:text-foreground" aria-label="คำอธิบาย" />}>
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  )
}

/* ---------------------------------------------------------------- Delta chip */
export function Delta({ value, inverse = false, suffix = '%' }: { value: number | null; inverse?: boolean; suffix?: string }) {
  if (value === null) return <span className="text-xs text-muted-foreground">ใหม่</span>
  const good = inverse ? value < 0 : value > 0
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        'num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold',
        value === 0 ? 'bg-muted text-muted-foreground' : good ? 'bg-success-soft text-success-ink' : 'bg-danger-soft text-danger-ink'
      )}
    >
      <Icon className="size-3" />
      {value > 0 ? '+' : ''}
      {value}
      {suffix}
    </span>
  )
}

/* ---------------------------------------------------------------- Sparkline (SVG) */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null
  const w = 100, h = 28
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - (v / max) * (h - 4)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn('h-7 w-full overflow-visible', className)} aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} className="fill-foreground/[0.06]" />
      <path d={line} className="fill-none stroke-foreground/70" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------------------------------------------------------------- KPI card */
export function KpiCard({
  label, value, unit, delta, deltaInverse, hint, spark, tone, info, onClick,
}: {
  label: string; value: React.ReactNode; unit?: string; delta?: number | null; deltaInverse?: boolean
  hint?: React.ReactNode; spark?: number[]; tone?: 'won' | 'lost' | 'warn'; info?: string; onClick?: () => void
}) {
  return (
    <Card
      size="sm"
      className={cn('gap-2 px-0', onClick && 'cursor-pointer transition-colors hover:bg-muted/40')}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2 px-4">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {tone && <span className={cn('size-2 rounded-full', tone === 'won' && 'bg-won', tone === 'lost' && 'bg-lost', tone === 'warn' && 'bg-warning')} />}
          {label}
          {info && <InfoTip text={info} />}
        </span>
        {delta !== undefined && <Delta value={delta} inverse={deltaInverse} />}
      </div>
      <div className="flex items-baseline gap-1.5 px-4">
        <span className="num text-3xl font-bold tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {spark ? <div className="px-4 pt-1"><Sparkline values={spark} /></div> : null}
      {hint && <div className="px-4 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  )
}

/* ---------------------------------------------------------------- Status */
const STATUS_CLS: Record<SiteStatus, string> = {
  following: 'bg-muted text-foreground',
  won: 'bg-success-soft text-success-ink',
  lost: 'bg-danger-soft text-danger-ink',
  cancelled: 'bg-muted text-muted-foreground line-through decoration-1',
}
export function StatusBadge({ status, overdue }: { status: SiteStatus; overdue?: number | null }) {
  if (status === 'following' && overdue !== undefined && overdue !== null) {
    if (overdue > 0)
      return <span className="inline-flex h-5 items-center rounded-full bg-warning-soft px-2 text-xs font-bold text-warning-ink">เลย {overdue} วัน</span>
    if (overdue === 0)
      return <span className="inline-flex h-5 items-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">วันนี้</span>
  }
  return (
    <span className={cn('inline-flex h-5 items-center rounded-full px-2 text-xs font-bold whitespace-nowrap', STATUS_CLS[status])}>
      {STATUS_LABEL[status]}
    </span>
  )
}

/* ---------------------------------------------------------------- Outcome bar (จบได้ | ตามต่อ | จบที่อื่น) */
export function OutcomeBar({
  won, open, lost, cancelled = 0, className,
}: { won: number; open: number; lost: number; cancelled?: number; className?: string }) {
  const total = won + open + lost + cancelled
  const segs = [
    { k: 'won', v: won, cls: 'bg-won', label: 'จบได้' },
    { k: 'open', v: open, cls: 'bg-open', label: 'ตามต่อ' },
    { k: 'lost', v: lost, cls: 'bg-lost', label: 'จบที่อื่น' },
    { k: 'cancel', v: cancelled, cls: 'bg-cancel', label: 'ยกเลิก' },
  ].filter((s) => s.v > 0)
  return (
    <Tooltip>
      <TooltipTrigger render={<div className={cn('flex h-2.5 w-full min-w-24 gap-[2px] overflow-hidden rounded-full', className)} />}>
        {total === 0 ? (
          <div className="h-full w-full rounded-full bg-muted" />
        ) : (
          segs.map((s) => <div key={s.k} className={cn('h-full first:rounded-l-full last:rounded-r-full', s.cls)} style={{ width: `${(s.v / total) * 100}%` }} />)
        )}
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
          {segs.map((s) => (
            <React.Fragment key={s.k}>
              <span className="flex items-center gap-1.5"><span className={cn('size-2 rounded-full', s.cls)} />{s.label}</span>
              <span className="num text-right font-bold">{n(s.v)}</span>
            </React.Fragment>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function OutcomeLegend({ className, withCancel = false }: { className?: string; withCancel?: boolean }) {
  const items = [
    ['bg-won', 'จบได้'], ['bg-open', 'ตามต่อ'], ['bg-lost', 'จบที่อื่น'], ...(withCancel ? [['bg-cancel', 'ยกเลิก']] : []),
  ]
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground', className)}>
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5"><span className={cn('size-2 rounded-full', c)} />{l}</span>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Bar list (แท่งแนวนอน + ตัวเลข) */
export function BarList({
  data, valueLabel, max, barClass = 'bg-foreground/10', onSelect, format = n,
}: {
  data: { name: string; count: number; sub?: string }[]; valueLabel?: string; max?: number; barClass?: string
  onSelect?: (name: string) => void; format?: (v: number) => string
}) {
  const top = max ?? Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="space-y-1.5">
      {valueLabel && (
        <div className="flex justify-between px-1 text-xs text-muted-foreground">
          <span>รายการ</span>
          <span>{valueLabel}</span>
        </div>
      )}
      {data.map((d) => (
        <button
          key={d.name}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(d.name)}
          className="group flex w-full items-center gap-3 rounded-md text-left text-sm enabled:hover:bg-muted/50"
        >
          <div className="relative h-8 min-w-0 flex-1">
            <div className={cn('absolute inset-y-0 left-0 rounded-md transition-all', barClass)} style={{ width: `${Math.max((d.count / top) * 100, 2)}%` }} />
            <div className="relative flex h-full items-center gap-2 px-2.5">
              <span className="truncate">{d.name}</span>
              {d.sub && <span className="truncate text-xs text-muted-foreground">{d.sub}</span>}
            </div>
          </div>
          <span className="num w-10 shrink-0 text-right font-bold">{format(d.count)}</span>
          <span className="num w-10 shrink-0 text-right text-xs text-muted-foreground">
            {total ? Math.round((d.count / total) * 100) : 0}%
          </span>
        </button>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Rep avatar */
const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null
function initials(name: string) {
  if (!seg) return name.slice(0, 2)
  return [...seg.segment(name)].slice(0, 2).map((s) => s.segment).join('')
}
const SHADES = ['bg-neutral-900 text-white', 'bg-neutral-700 text-white', 'bg-neutral-500 text-white', 'bg-neutral-300 text-neutral-900', 'bg-neutral-200 text-neutral-900']
export function RepAvatar({ name, index = 0, size = 'md' }: { name: string; index?: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold dark:ring-1 dark:ring-white/15',
        SHADES[index % SHADES.length],
        size === 'sm' && 'size-6 text-[11px]',
        size === 'md' && 'size-8 text-xs',
        size === 'lg' && 'size-12 text-base'
      )}
    >
      {initials(name)}
    </span>
  )
}

/* ---------------------------------------------------------------- Empty */
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">{children}</div>
}
