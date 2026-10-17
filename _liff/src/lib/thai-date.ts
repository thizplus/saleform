// Format date as Thai Buddhist year: DD/MM/YYYY+543
export function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const buddhistYear = d.getFullYear() + 543
  return `${day}/${month}/${buddhistYear}`
}

// Get date string in YYYY-MM-DD (Gregorian) for API
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Add days to today and return YYYY-MM-DD
export function addDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toISODate(date)
}
