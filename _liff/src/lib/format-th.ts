// เดือนย่อภาษาไทย
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

/**
 * รูปแบบวันที่ไทย: "20 ต.ค. 69"
 */
export function formatThaiDate(dateStr: string | Date): string {
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const day = d.getDate()
  const month = THAI_MONTHS_SHORT[d.getMonth()]
  const buddhistYear = (d.getFullYear() + 543) % 100
  return `${day} ${month} ${String(buddhistYear).padStart(2, '0')}`
}

/**
 * วันสัมพัทธ์: "วันนี้", "พรุ่งนี้", "เมื่อวาน", "อีก 3 วัน", "เลย 2 วัน"
 */
export function formatRelativeDay(dateStr: string | Date): string {
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  // ตัดเวลาออก เปรียบเทียบแค่วัน
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = target.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'วันนี้'
  if (diffDays === 1) return 'พรุ่งนี้'
  if (diffDays === -1) return 'เมื่อวาน'
  if (diffDays > 1) return `อีก ${diffDays} วัน`
  return `เลย ${Math.abs(diffDays)} วัน`
}

/**
 * จำนวนวันที่เลยกำหนด (ค่าบวก = เลย, ค่าลบ = ยังไม่ถึง)
 */
export function getOverdueDays(dateStr: string | Date): number {
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr)
  const now = new Date()
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * เบอร์โทร: "0XX-XXX-XXXX"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}
