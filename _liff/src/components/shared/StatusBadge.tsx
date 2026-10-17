import { Badge } from '@/components/ui/badge'
import {
  CircleCheck,
  CircleX,
  AlarmClock,
  CalendarClock,
  Ban,
} from 'lucide-react'
import { formatRelativeDay, getOverdueDays } from '@/lib/format-th'

type SiteStatus = 'following' | 'won' | 'lost' | 'cancelled'

interface StatusBadgeProps {
  status: SiteStatus | string
  /** วันนัดติดตาม — ใช้คำนวณ today/overdue/future */
  nextFollowUpDate?: string | null
  className?: string
}

const ICON_SIZE = 'size-3.5'

/**
 * ป้ายสถานะใช้ทั้งระบบ — มีไอคอน + ข้อความเสมอ
 */
export function StatusBadge({ status, nextFollowUpDate, className }: StatusBadgeProps) {
  // จบได้
  if (status === 'won') {
    return (
      <Badge variant="success" className={className}>
        <CircleCheck className={ICON_SIZE} />
        จบได้
      </Badge>
    )
  }

  // จบที่อื่น
  if (status === 'lost') {
    return (
      <Badge variant="danger" className={className}>
        <CircleX className={ICON_SIZE} />
        จบที่อื่น
      </Badge>
    )
  }

  // ยกเลิก
  if (status === 'cancelled') {
    return (
      <Badge variant="neutral" className={className}>
        <Ban className={ICON_SIZE} />
        ยกเลิก
      </Badge>
    )
  }

  // ตามต่อ — แยกตามวันนัด
  if (status === 'following' && nextFollowUpDate) {
    const overdue = getOverdueDays(nextFollowUpDate)
    const relative = formatRelativeDay(nextFollowUpDate)

    // เลยกำหนด
    if (overdue > 0) {
      return (
        <Badge variant="warning" className={className}>
          <AlarmClock className={ICON_SIZE} />
          เลย {overdue} วัน
        </Badge>
      )
    }

    // วันนี้
    if (overdue === 0) {
      return (
        <Badge variant="today" className={className}>
          <CalendarClock className={ICON_SIZE} />
          ตามวันนี้
        </Badge>
      )
    }

    // อนาคต
    return (
      <Badge variant="neutral" className={className}>
        <CalendarClock className={ICON_SIZE} />
        {relative}
      </Badge>
    )
  }

  // fallback: ตามต่อ (ไม่มีวันนัด)
  return (
    <Badge variant="neutral" className={className}>
      <CalendarClock className={ICON_SIZE} />
      ตามต่อ
    </Badge>
  )
}
