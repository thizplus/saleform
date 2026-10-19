import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Plus, X, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useOptions, optionKeys } from '../hooks'
import { optionsService, type DropdownOptions } from '../service'
import { useReps } from '@/features/analytics'

const FIELDS: { key: keyof DropdownOptions; label: string; description: string }[] = [
  { key: 'stages', label: 'ขั้นตอน', description: 'สถานะงานก่อสร้าง' },
  { key: 'customerTypes', label: 'ประเภทลูกค้า', description: 'ประเภทของลูกค้า/หน้างาน' },
  { key: 'decisionMakers', label: 'ผู้ตัดสินใจ', description: 'บทบาทผู้มีอำนาจ' },
  { key: 'lostReasons', label: 'สาเหตุจบที่อื่น', description: 'เหตุผลที่ไม่ได้งาน' },
  { key: 'competitors', label: 'คู่แข่ง', description: 'ชื่อร้าน/แบรนด์คู่แข่ง' },
  { key: 'amphoes', label: 'เขตพื้นที่', description: 'พื้นที่รับผิดชอบของเซลล์' },
]

export function OptionsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useOptions()
  const { data: reps } = useReps()
  const [options, setOptions] = useState<DropdownOptions | null>(null)

  useEffect(() => {
    if (data) setOptions({ ...data })
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => optionsService.save(options!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optionKeys.all })
      toast.success('บันทึกสำเร็จ')
    },
  })

  const updateItems = useCallback((key: keyof DropdownOptions, items: string[]) => {
    setOptions((prev) => prev ? { ...prev, [key]: items } : prev)
  }, [])

  // สร้าง map อำเภอ → รายชื่อ sale ที่รับผิดชอบ
  const amphoeRepMap = buildAmphoeRepMap(reps)

  if (isLoading || !options) {
    return <p className="text-sm text-muted-foreground text-center py-12">กำลังโหลด...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">ตั้งค่าตัวเลือก</h1>
          <p className="text-sm text-muted-foreground">ลากเพื่อเรียงลำดับ เพิ่ม/ลบรายการได้</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>

      <Tabs defaultValue="stages">
        <TabsList className="w-full justify-start">
          {FIELDS.map(({ key, label }) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>

        {FIELDS.map(({ key, description }) => (
          <TabsContent key={key} value={key}>
            <div className="mt-4 max-w-xl">
              <p className="mb-3 text-sm text-muted-foreground">{description}</p>
              <OptionList
                items={options[key] ?? []}
                onChange={(items) => updateItems(key, items)}
                amphoeRepMap={key === 'amphoes' ? amphoeRepMap : undefined}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// --- Helpers ---

interface RepInfo { nickname: string; displayName: string }

function buildAmphoeRepMap(reps?: { nickname: string; displayName: string; area: string; status: string }[]) {
  const map = new Map<string, RepInfo[]>()
  if (!reps) return map
  for (const rep of reps) {
    if (rep.status !== 'active' || !rep.area) continue
    const amphoes = rep.area.split(',').map(s => s.trim()).filter(Boolean)
    for (const a of amphoes) {
      if (!map.has(a)) map.set(a, [])
      map.get(a)!.push({ nickname: rep.nickname, displayName: rep.displayName })
    }
  }
  return map
}

// --- OptionList component ---

function OptionList({ items, onChange, amphoeRepMap }: {
  items: string[]
  onChange: (items: string[]) => void
  amphoeRepMap?: Map<string, RepInfo[]>
}) {
  const [newItem, setNewItem] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  function addItem() {
    const trimmed = newItem.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setNewItem('')
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx)
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const reordered = [...items]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    onChange(reordered)
    setDragIdx(idx)
  }

  function handleDragEnd() {
    setDragIdx(null)
  }

  return (
    <div className="space-y-1">
      {items.map((item, idx) => {
        const assignedReps = amphoeRepMap?.get(item)
        return (
          <div
            key={`${item}-${idx}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm bg-background transition-opacity ${
              dragIdx === idx ? 'opacity-50' : ''
            }`}
          >
            <GripVertical className="size-4 text-muted-foreground cursor-grab shrink-0" />
            <span className="flex-1 truncate">{item}</span>

            {/* แสดง sale ที่รับผิดชอบอำเภอนี้ */}
            {amphoeRepMap && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                {assignedReps && assignedReps.length > 0 ? (
                  <>
                    <User className="size-3" />
                    {assignedReps.map(r => r.nickname || r.displayName).join(', ')}
                  </>
                ) : (
                  <span className="text-destructive">ยังไม่มีเซลล์</span>
                )}
              </span>
            )}

            <button
              onClick={() => removeItem(idx)}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}

      {/* Add new */}
      <div className="flex gap-2 pt-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="เพิ่มรายการ..."
          className="h-8 text-sm"
        />
        <Button variant="outline" size="sm" onClick={addItem} className="shrink-0">
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}
