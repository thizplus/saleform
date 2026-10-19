import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPhone } from '@/lib/format-th'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer'
import type { DuplicateMatch } from '../types'

interface DuplicateDialogProps {
  open: boolean
  matches: DuplicateMatch[]
  pendingNote?: string
  pendingPhotos?: { file: File; preview: string }[]
  onForceNew: () => void
  onClose: () => void
}

export function DuplicateDialog({
  open,
  matches,
  pendingNote,
  pendingPhotos,
  onForceNew,
  onClose,
}: DuplicateDialogProps) {
  const navigate = useNavigate()

  function handleUpdateInstead(match: DuplicateMatch) {
    navigate(`/sites/${match.siteCode}/update`, {
      state: {
        prefillNote: pendingNote || '',
        prefillPhotos: pendingPhotos || [],
        fromDuplicate: true,
      },
    })
  }

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose() }} showSwipeHandle>
      <DrawerContent>
        {/* Header — compact */}
        <div className="px-4 pt-3 pb-2 flex items-start gap-2.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-warning-soft">
            <AlertTriangle className="size-4 text-warning-ink" />
          </span>
          <div>
            <p className="text-base font-bold">พบงานที่อาจซ้ำ</p>
            <p className="text-xs text-muted-foreground">
              มี {matches.length} งานที่คล้ายกัน ต้องการดำเนินการอย่างไร?
            </p>
          </div>
        </div>

        {/* Match list — compact cards */}
        <div className="px-4 py-2 space-y-2 overflow-y-auto max-h-[50vh]">
          {matches.map((m) => (
            <div key={m.siteCode} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{m.customerName || 'ไม่มีชื่อ'}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="num">#{m.siteCode}</span>
                    {m.phone && <> · <span className="num">{formatPhone(m.phone)}</span></>}
                    {' · '}
                    {m.reason === 'phone' ? 'เบอร์ซ้ำ' : m.reason === 'name' ? 'ชื่อคล้าย' : m.distanceM != null ? `ห่าง ${m.distanceM} ม.` : 'ตำแหน่งใกล้'}
                    {' · '}{m.isMine ? 'งานของฉัน' : `งานของ${m.ownerName}`}
                  </p>
                </div>
              </div>

              {m.isMine ? (
                <Button size="sm" className="w-full" onClick={() => handleUpdateInstead(m)}>
                  อัปเดตงานนี้แทน
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/sites/${m.siteCode}`)}>
                  ดูงานของ {m.ownerName}
                </Button>
              )}
            </div>
          ))}
        </div>

        <DrawerFooter className="pt-2">
          <button type="button" onClick={onForceNew} className="w-full py-2 text-center text-sm font-bold underline underline-offset-4">
            ไม่ใช่ — สร้างเป็นงานใหม่
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
