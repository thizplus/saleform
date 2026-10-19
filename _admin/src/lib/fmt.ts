const DAY = 86_400_000
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const TH_DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

export const n = (v: number) => v.toLocaleString('en-US')
export const pct = (v: number | null) => (v === null ? '–' : `${v}%`)

/** 18 ต.ค. 69 */
export function thDate(d: Date, withYear = true) {
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]}${withYear ? ` ${String((d.getFullYear() + 543) % 100).padStart(2, '0')}` : ''}`
}
/** 18 ต.ค. */
export const thDay = (d: Date) => thDate(d, false)
export const thDow = (d: Date) => TH_DOW[d.getDay()]
export const time = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export function thRange(from: Date, to: Date) {
  if (from.getTime() === to.getTime()) return thDate(from)
  const sameYear = from.getFullYear() === to.getFullYear()
  if (sameYear && from.getMonth() === to.getMonth()) return `${from.getDate()}–${thDate(to)}`
  return `${thDate(from, !sameYear)} – ${thDate(to)}`
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** วันนี้ / เมื่อวาน / 3 วันก่อน / 18 ต.ค. */
export function relative(d: Date) {
  const diff = Math.round((startOfDay(new Date()).getTime() - startOfDay(d).getTime()) / DAY)
  if (diff === 0) return `วันนี้ ${time(d)}`
  if (diff === 1) return `เมื่อวาน ${time(d)}`
  if (diff < 7) return `${diff} วันก่อน`
  return thDate(d)
}

export function phone(p: string) {
  const s = p.replace(/\D/g, '')
  return s.length === 10 ? `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}` : p
}

export function delta(cur: number, prev: number) {
  if (prev === 0) return cur === 0 ? 0 : null
  return Math.round(((cur - prev) / prev) * 100)
}

/** ป้ายแกน X จาก key 'YYYY-MM-DD' */
export const keyLabel = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return thDay(new Date(y, m - 1, d))
}
