import * as React from 'react'
import { CalendarDays, ChevronDown, MapPin, RotateCcw, UserRound } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRESETS, useFilters } from '@/lib/filters'
import { addDays, today } from '@/lib/date-utils'
import { thRange } from '@/lib/fmt'

/** ตัวเลือกช่วงเวลา: preset ด้านซ้าย + ปฏิทินเลือกช่วง 2 เดือน */
export function DateRangePicker() {
  const { range, presetId, setRange } = useFilters()
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DateRange | undefined>({ from: range.from, to: range.to })

  React.useEffect(() => {
    if (open) setDraft({ from: range.from, to: range.to })
  }, [open, range])

  const preset = PRESETS.find((p) => p.id === presetId)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="h-9 justify-start gap-2 px-3 font-normal" />}>
        <CalendarDays className="size-4 text-muted-foreground" />
        {preset && <span className="font-bold">{preset.label}</span>}
        <span className={cn('num', preset && 'text-muted-foreground')}>{thRange(range.from, range.to)}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex gap-1 overflow-x-auto border-b p-2 sm:w-40 sm:flex-col sm:border-r sm:border-b-0">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                variant={p.id === presetId ? 'secondary' : 'ghost'}
                size="sm"
                className="justify-start font-normal"
                onClick={() => {
                  setRange(p.range(), p.id)
                  setOpen(false)
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="p-3">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={addDays(range.to, -31)}
              selected={draft}
              onSelect={setDraft}
              disabled={{ after: today() }}
              className="hidden md:block"
            />
            <Calendar
              mode="range"
              numberOfMonths={1}
              defaultMonth={range.to}
              selected={draft}
              onSelect={setDraft}
              disabled={{ after: today() }}
              className="md:hidden"
            />
            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
              <span className="num text-sm text-muted-foreground">
                {draft?.from ? thRange(draft.from, draft.to ?? draft.from) : 'เลือกวันเริ่ม–วันสิ้นสุด'}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>ยกเลิก</Button>
                <Button
                  size="sm"
                  disabled={!draft?.from}
                  onClick={() => {
                    if (!draft?.from) return
                    setRange({ from: draft.from, to: draft.to ?? draft.from }, null)
                    setOpen(false)
                  }}
                >
                  ใช้ช่วงนี้
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const ALL = '__all'

export function RepSelect({ items, value, onChange }: { items: { value: string; label: string }[]; value: string | null; onChange: (v: string | null) => void }) {
  const allItems = [{ value: ALL, label: 'เซลล์ทั้งหมด' }, ...items]
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL || !v ? null : v)}>
      <SelectTrigger className="h-9 min-w-36 gap-2 data-[size=default]:h-9">
        <UserRound className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function AmphoeSelect({ items, value, onChange }: { items: string[]; value: string | null; onChange: (v: string | null) => void }) {
  const allItems = [{ value: ALL, label: 'ทุกอำเภอ' }, ...items.map((a) => ({ value: a, label: `อ.${a}` }))]
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL || !v ? null : v)}>
      <SelectTrigger className="h-9 min-w-40 gap-2 data-[size=default]:h-9">
        <MapPin className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** แถวตัวกรองเดียวด้านบนของทุกหน้ารายงาน */
export function FilterBar({
  reps = [], amphoes = [], showRep = true, showArea = true,
}: {
  reps?: { value: string; label: string }[]; amphoes?: string[]
  showRep?: boolean; showArea?: boolean
}) {
  const f = useFilters()
  const dirty = f.repId || f.amphoe || f.presetId !== '30d'
  return (
    <>
      {showRep && <RepSelect items={reps} value={f.repId} onChange={f.setRepId} />}
      {showArea && <AmphoeSelect items={amphoes} value={f.amphoe} onChange={f.setAmphoe} />}
      <DateRangePicker />
      {dirty && (
        <Button variant="ghost" size="icon" className="size-9" onClick={f.reset} aria-label="ล้างตัวกรอง">
          <RotateCcw className="size-4" />
        </Button>
      )}
    </>
  )
}
