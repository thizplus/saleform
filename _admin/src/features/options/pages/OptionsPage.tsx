import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GripVertical, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOptions, optionKeys } from '../hooks'
import { optionsService, type DropdownOptions } from '../service'

const FIELDS: { key: keyof DropdownOptions; label: string; description: string }[] = [
  { key: 'stages', label: 'ขั้นตอน', description: 'สถานะงานก่อสร้าง' },
  { key: 'customerTypes', label: 'ประเภทลูกค้า', description: 'ประเภทของลูกค้า/หน้างาน' },
  { key: 'decisionMakers', label: 'ผู้ตัดสินใจ', description: 'บทบาทผู้มีอำนาจ' },
  { key: 'lostReasons', label: 'สาเหตุจบที่อื่น', description: 'เหตุผลที่ไม่ได้งาน' },
  { key: 'competitors', label: 'คู่แข่ง', description: 'ชื่อร้าน/แบรนด์คู่แข่ง' },
]

export function OptionsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useOptions()
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FIELDS.map(({ key, label, description }) => (
          <OptionList
            key={key}
            label={label}
            description={description}
            items={options[key]}
            onChange={(items) => updateItems(key, items)}
          />
        ))}
      </div>
    </div>
  )
}

function OptionList({ label, description, items, onChange }: {
  label: string
  description: string
  items: string[]
  onChange: (items: string[]) => void
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
    <div className="border rounded-lg p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold">{label}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {items.map((item, idx) => (
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
            <button
              onClick={() => removeItem(idx)}
              className="text-muted-foreground hover:text-danger shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
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
