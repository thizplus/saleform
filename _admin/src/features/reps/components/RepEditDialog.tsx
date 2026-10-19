import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { RepBrief } from '@/features/analytics'
import { useUpdateRep, useAmphoeOptions } from '../hooks'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  rep: RepBrief
  mode: 'approve' | 'edit'
}

export function RepEditDialog({ open, onOpenChange, rep, mode }: Props) {
  const updateRep = useUpdateRep()
  const amphoeList = useAmphoeOptions()

  const [nickname, setNickname] = React.useState('')
  const [area, setArea] = React.useState('')

  // Reset form เมื่อเปิด dialog
  React.useEffect(() => {
    if (open) {
      setNickname(rep.nickname || rep.displayName || '')
      setArea(rep.area || '')
    }
  }, [open, rep])

  const isApprove = mode === 'approve'
  const canSubmit = nickname.trim() && area.trim() && !updateRep.isPending

  function handleSubmit() {
    if (!canSubmit) return

    const data = isApprove
      ? { nickname: nickname.trim(), area: area.trim(), status: 'active' }
      : { nickname: nickname.trim(), area: area.trim() }

    updateRep.mutate(
      { id: rep.id, data },
      {
        onSuccess: () => {
          toast.success(isApprove ? 'อนุมัติเซลล์แล้ว' : 'บันทึกแล้ว')
          onOpenChange(false)
        },
        onError: () => {
          toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        },
      },
    )
  }

  function toggleAmphoe(a: string) {
    // area เป็น comma-separated string เช่น "เมือง, บ้านบึง"
    const current = area ? area.split(',').map(s => s.trim()).filter(Boolean) : []
    const idx = current.indexOf(a)
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push(a)
    }
    setArea(current.join(', '))
  }

  const selectedAmphoes = area ? area.split(',').map(s => s.trim()).filter(Boolean) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isApprove ? 'อนุมัติเซลล์' : 'แก้ไขเซลล์'}</DialogTitle>
          <DialogDescription>
            {isApprove
              ? `กำหนดชื่อเล่นและพื้นที่ให้ ${rep.displayName} ก่อนอนุมัติ`
              : `แก้ไขข้อมูล ${rep.nickname || rep.displayName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nickname */}
          <div className="space-y-1.5">
            <Label htmlFor="rep-nickname">ชื่อเล่น *</Label>
            <Input
              id="rep-nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="เช่น บอม"
            />
          </div>

          {/* Area - Amphoe chips */}
          <div className="space-y-1.5">
            <Label>พื้นที่รับผิดชอบ *</Label>
            {amphoeList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {amphoeList.map(a => {
                  const selected = selectedAmphoes.includes(a)
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmphoe(a)}
                      className={
                        selected
                          ? 'rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background transition-colors'
                          : 'rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground'
                      }
                    >
                      {a}
                    </button>
                  )
                })}
              </div>
            ) : (
              <Input
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="เช่น เมือง, บ้านบึง"
              />
            )}
            {selectedAmphoes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                เลือกแล้ว {selectedAmphoes.length} อำเภอ: {area}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {updateRep.isPending ? 'กำลังบันทึก...' : isApprove ? 'อนุมัติ' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
