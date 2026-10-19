export type SiteStatus = 'following' | 'won' | 'lost' | 'cancelled'
export type RepStatus = 'active' | 'pending' | 'inactive'

export const STATUS_LABEL: Record<SiteStatus, string> = {
  following: 'ตามต่อ', won: 'จบได้', lost: 'จบที่อื่น', cancelled: 'ยกเลิก',
}
