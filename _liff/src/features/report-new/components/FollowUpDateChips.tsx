import { addDays } from '@/lib/thai-date'
import { formatThaiDate } from '@/lib/format-th'

interface FollowUpDateChipsProps {
  value: string
  onChange: (date: string) => void
}

const chips = [
  { label: 'พรุ่งนี้', days: 1 },
  { label: '+2', days: 2 },
  { label: '+3', days: 3 },
  { label: '+7', days: 7 },
  { label: '+14', days: 14 },
]

export function FollowUpDateChips({ value, onChange }: FollowUpDateChipsProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {chips.map((chip) => {
          const date = addDays(chip.days)
          const isSelected = value === date
          return (
            <button
              key={chip.days}
              type="button"
              onClick={() => onChange(date)}
              className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold border transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input hover:bg-muted'
              }`}
            >
              {chip.label}
              {isSelected && (
                <span className="ml-1 font-normal text-xs">
                  {formatThaiDate(date)}
                </span>
              )}
            </button>
          )
        })}
        {/* เลือกวันเอง */}
        <label className="shrink-0 h-10 px-4 rounded-full text-sm font-bold border border-input bg-background flex items-center cursor-pointer hover:bg-muted transition-colors">
          เลือกวัน
          <input
            type="date"
            className="sr-only"
            onChange={(e) => e.target.value && onChange(e.target.value)}
          />
        </label>
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          นัดติดตาม: {formatThaiDate(value)}
        </p>
      )}
    </div>
  )
}
