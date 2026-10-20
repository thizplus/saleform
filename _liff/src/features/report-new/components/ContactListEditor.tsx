import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ContactInput } from '../types'

const CONTACT_TYPES = ['ผู้มุ่งหวังใหม่', 'ลูกค้าเก่า', 'ไม่แน่ใจ']
const AUTHORITY_OPTIONS = ['มีอำนาจตัดสินใจ', 'ไม่มีอำนาจ', 'ไม่แน่ใจ']
const ROLE_OPTIONS = ['เจ้าของ', 'ช่าง', 'ไม่แน่ใจ']

const emptyContact: ContactInput = { name: '', phone: '', contactType: '', authority: '', role: '' }

interface ContactListEditorProps {
  contacts: ContactInput[]
  onChange: (contacts: ContactInput[]) => void
}

export function ContactListEditor({ contacts, onChange }: ContactListEditorProps) {
  function updateAt(idx: number, field: keyof ContactInput, value: string) {
    const next = [...contacts]
    next[idx] = { ...next[idx], [field]: value }
    onChange(next)
  }

  function add() {
    onChange([...contacts, { ...emptyContact }])
  }

  function remove(idx: number) {
    onChange(contacts.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      {contacts.map((c, idx) => (
        <ContactCard
          key={idx}
          contact={c}
          index={idx}
          total={contacts.length}
          onChange={(field, value) => updateAt(idx, field, value)}
          onRemove={() => remove(idx)}
        />
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full gap-1.5">
        <Plus className="size-4" />
        เพิ่มผู้ติดต่อ
      </Button>
    </div>
  )
}

function ContactCard({
  contact, index, total, onChange, onRemove,
}: {
  contact: ContactInput
  index: number
  total: number
  onChange: (field: keyof ContactInput, value: string) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl border bg-card p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">
          ผู้ติดต่อ #{index + 1}
          {index === 0 && <span className="ml-1 text-primary">(หลัก)</span>}
        </span>
        {total > 1 && (
          <button type="button" onClick={onRemove} className="p-1 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">ชื่อ</Label>
          <Input
            value={contact.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="ชื่อผู้ติดต่อ"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">เบอร์โทร</Label>
          <Input
            type="tel"
            inputMode="numeric"
            value={contact.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="08X-XXX-XXXX"
            className="h-9 text-sm num"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">ประเภท</Label>
        <div className="flex gap-1.5 flex-wrap">
          {CONTACT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange('contactType', contact.contactType === t ? '' : t)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium border transition-colors ${
                contact.contactType === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">บทบาท</Label>
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange('role', contact.role === r ? '' : r)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium border transition-colors ${
                contact.role === r
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">สิทธิ์</Label>
        <div className="flex gap-1.5">
          {AUTHORITY_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onChange('authority', contact.authority === a ? '' : a)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium border transition-colors ${
                contact.authority === a
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
