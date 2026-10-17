import { addDays, formatThaiDate } from '@/lib/thai-date'

interface FollowUpDateChipsProps {
  value: string
  onChange: (date: string) => void
}

const chips = [
  { label: '+2 วัน', days: 2 },
  { label: '+3 วัน', days: 3 },
  { label: '+7 วัน', days: 7 },
  { label: '+14 วัน', days: 14 },
]

export function FollowUpDateChips({ value, onChange }: FollowUpDateChipsProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {chips.map((chip) => {
          const date = addDays(chip.days)
          const isSelected = value === date
          return (
            <button
              key={chip.days}
              type="button"
              onClick={() => onChange(date)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input hover:bg-muted'
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          นัดติดตาม: {formatThaiDate(value)}
        </p>
      )}
    </div>
  )
}
