export const SITE_STATUS = {
  FOLLOWING: 'following',
  WON: 'won',
  LOST: 'lost',
  CANCELLED: 'cancelled',
} as const

export const SITE_STATUS_LABELS: Record<string, string> = {
  following: 'กำลังติดตาม',
  won: 'จบได้',
  lost: 'จบที่อื่น',
  cancelled: 'ยกเลิก',
}

export const SITE_STATUS_STYLES: Record<string, string> = {
  following: 'status-info',
  won: 'status-success',
  lost: 'status-danger',
  cancelled: 'status-muted',
}

export const REPORT_TYPE = {
  NEW: 'new',
  FOLLOW_UP: 'follow_up',
} as const

export const TAB_OPTIONS = [
  { value: 'due_today', label: 'ครบกำหนดวันนี้' },
  { value: 'overdue', label: 'เลยกำหนด' },
  { value: 'following', label: 'กำลังติดตาม' },
  { value: 'all', label: 'ทั้งหมด' },
] as const
