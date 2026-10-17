import { Loader2, Check, X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export interface UploadStep {
  label: string
  status: 'pending' | 'uploading' | 'done' | 'error'
}

interface UploadProgressSheetProps {
  open: boolean
  steps: UploadStep[]
}

/** ชีทแสดงความคืบหน้าอัปโหลดทีละรูป */
export function UploadProgressSheet({ open, steps }: UploadProgressSheetProps) {
  const done = steps.filter((s) => s.status === 'done').length
  const total = steps.length

  return (
    <Drawer open={open}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-base font-bold">
            กำลังบันทึก... ({done}/{total})
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <StepIcon status={step.status} />
              <span className={`text-sm ${step.status === 'done' ? 'text-muted-foreground' : 'text-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function StepIcon({ status }: { status: UploadStep['status'] }) {
  switch (status) {
    case 'uploading':
      return <Loader2 className="size-5 text-primary animate-spin shrink-0" />
    case 'done':
      return <Check className="size-5 text-success shrink-0" />
    case 'error':
      return <X className="size-5 text-danger shrink-0" />
    default:
      return <div className="size-5 rounded-full border-2 border-muted shrink-0" />
  }
}
