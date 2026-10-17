export function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const buddhistYear = d.getFullYear() + 543
  return `${day}/${month}/${buddhistYear}`
}
