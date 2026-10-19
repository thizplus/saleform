import * as React from 'react'
import { addDays, startOfDay, today } from './date-utils'

export interface Range { from: Date; to: Date }
export interface Filters { range: Range; repId: string | null; amphoe: string | null }

export interface Preset { id: string; label: string; range: () => Range }

export const PRESETS: Preset[] = [
  { id: 'today', label: 'วันนี้', range: () => ({ from: today(), to: today() }) },
  { id: '7d', label: '7 วันล่าสุด', range: () => ({ from: addDays(today(), -6), to: today() }) },
  { id: '30d', label: '30 วันล่าสุด', range: () => ({ from: addDays(today(), -29), to: today() }) },
  { id: 'month', label: 'เดือนนี้', range: () => ({ from: new Date(today().getFullYear(), today().getMonth(), 1), to: today() }) },
  {
    id: 'lastMonth', label: 'เดือนที่แล้ว',
    range: () => ({ from: new Date(today().getFullYear(), today().getMonth() - 1, 1), to: new Date(today().getFullYear(), today().getMonth(), 0) }),
  },
  { id: '60d', label: '60 วันล่าสุด', range: () => ({ from: addDays(today(), -59), to: today() }) },
]

interface Ctx extends Filters {
  presetId: string | null
  setRange: (r: Range, presetId?: string | null) => void
  setRepId: (id: string | null) => void
  setAmphoe: (a: string | null) => void
  reset: () => void
}

const FiltersContext = React.createContext<Ctx | null>(null)

const DEFAULT_PRESET = '30d'

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [range, setRangeState] = React.useState<Range>(PRESETS.find((p) => p.id === DEFAULT_PRESET)!.range())
  const [presetId, setPresetId] = React.useState<string | null>(DEFAULT_PRESET)
  const [repId, setRepId] = React.useState<string | null>(null)
  const [amphoe, setAmphoe] = React.useState<string | null>(null)

  const value = React.useMemo<Ctx>(() => ({
    range, repId, amphoe, presetId,
    setRange: (r, id = null) => {
      setRangeState({ from: startOfDay(r.from), to: startOfDay(r.to) })
      setPresetId(id)
    },
    setRepId, setAmphoe,
    reset: () => {
      setRangeState(PRESETS.find((p) => p.id === DEFAULT_PRESET)!.range())
      setPresetId(DEFAULT_PRESET)
      setRepId(null)
      setAmphoe(null)
    },
  }), [range, repId, amphoe, presetId])

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useFilters() {
  const ctx = React.useContext(FiltersContext)
  if (!ctx) throw new Error('useFilters must be inside FiltersProvider')
  return ctx
}

/** ช่วงก่อนหน้า (สำหรับคำนวณ delta) */
export function previousRange(r: Range): Range {
  const days = Math.round((startOfDay(r.to).getTime() - startOfDay(r.from).getTime()) / DAY) + 1
  return { from: addDays(r.from, -days), to: addDays(r.from, -1) }
}

const DAY = 86_400_000
