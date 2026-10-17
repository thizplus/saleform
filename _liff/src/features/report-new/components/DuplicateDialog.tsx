import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import { formatPhone } from '@/lib/format-th'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import type { DuplicateMatch } from '../types'

interface DuplicateDialogProps {
  open: boolean
  matches: DuplicateMatch[]
  /** ข้อมูลที่กรอกไว้ — จะพาไป L9 ได้ */
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
    // พาข้อมูลที่กรอกไว้ไป UpdateSitePage (L9)
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
        <DrawerHeader>
          <DrawerTitle className="text-base font-bold">
            พบงานที่อาจซ้ำ
          </DrawerTitle>
          <DrawerDescription>
            มีงานที่คล้ายกันในระบบแล้ว ต้องการดำเนินการอย่างไร?
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[50vh]">
          {matches.map((m) => (
            <div key={m.siteCode} className="border rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{m.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="num">#{m.siteCode}</span>
                    {m.phone && <> · <span className="num">{formatPhone(m.phone)}</span></>}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  เจ้าของ: {m.ownerName} ·{' '}
                  {m.reason === 'phone' ? 'เบอร์ซ้ำ' : `ห่าง ${m.distanceM} ม.`}
                </p>
              </div>

              {/* ปุ่มตามเจ้าของ */}
              {m.isMine ? (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => handleUpdateInstead(m)}
                >
                  อัปเดตงานนี้แทน
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // TODO: B-06 แจ้งแอดมินว่าซ้ำ
                    navigate(`/sites/${m.siteCode}`)
                  }}
                >
                  ดูงานของ {m.ownerName}
                </Button>
              )}
            </div>
          ))}
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={onForceNew} className="w-full">
            ไม่ใช่ — สร้างเป็นงานใหม่
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
