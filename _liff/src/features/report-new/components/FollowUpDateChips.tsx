import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { th } from 'date-fns/locale'
import { addDays, toISODate } from '@/lib/thai-date'
import { formatThaiDate } from '@/lib/format-th'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

interface FollowUpDateChipsProps {
  value: string
  onChange: (date: string) => void
}

const chips = [
  { label: 'พรุ่งนี้', days: 1 },
  { label: '3 วัน', days: 3 },
  { label: '7 วัน', days: 7 },
  { label: '14 วัน', days: 14 },
  { label: '30 วัน', days: 30 },
]

export function FollowUpDateChips({ value, onChange }: FollowUpDateChipsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  const chipDates = chips.map((c) => addDays(c.days))
  const isCustom = value && !chipDates.includes(value)

  function handleCalendarSelect(date: Date | undefined) {
    if (date) {
      onChange(toISODate(date))
      setCalendarOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap">
        {chips.map((chip) => {
          const date = addDays(chip.days)
          const isSelected = value === date
          return (
            <button
              key={chip.days}
              type="button"
              onClick={() => onChange(date)}
              className={`h-8 px-3 rounded-full text-sm font-bold border transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input hover:bg-muted'
              }`}
            >
              {chip.label}
            </button>
          )
        })}

        {/* ปุ่มเลือกวัน — เปิด Calendar Popover */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            className={`h-8 px-3 rounded-full text-sm font-bold border flex items-center gap-1.5 transition-colors ${
              isCustom
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-input hover:bg-muted'
            }`}
          >
            <CalendarIcon className="size-3.5" />
            {isCustom ? formatThaiDate(value) : 'เลือกวัน'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              locale={th}
              selected={value ? new Date(value) : undefined}
              onSelect={handleCalendarSelect}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {value && (
        <p className="text-xs text-muted-foreground">
          นัดติดตาม: <span className="num">{formatThaiDate(value)}</span>
        </p>
      )}
    </div>
  )
}
