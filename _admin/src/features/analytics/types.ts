import type { SiteStatus } from '@/lib/types'

export interface AnalyticsSummary {
  visits: number
  newSites: number
  followUps: number
  won: number
  lost: number
  following: number
  cancelled: number
  winRate: number
  overdue: number
  avgDaysToWin: number | null
  previous: {
    visits: number
    newSites: number
    followUps: number
    won: number
    lost: number
    winRate: number
  } | null
}

export interface RepAnalytics {
  repId: string
  nickname: string
  displayName: string
  area: string
  pictureUrl: string
  visits: number
  newSites: number
  followUps: number
  won: number
  lost: number
  cancelled: number
  following: number
  winRate: number
  overdue: number
  avgDaysToWin: number | null
  sitesOwned: number
}

export interface TrendPoint {
  bucket: string
  value: number
  newSites: number
  followUps: number
  won: number
  lost: number
  teamAvg: number | null
}

export interface AreaAnalytics {
  amphoe: string
  tambon?: string
  visits: number
  newSites: number
  followUps: number
  won: number
  lost: number
  cancelled: number
  following: number
  winRate: number
  overdue: number
  avgDaysToWin: number | null
  children?: AreaAnalytics[]
}

export interface LostReasonsData {
  total: number
  reasons: { reason: string; count: number }[]
  competitors: { name: string; count: number }[]
  byStage: { stage: string; count: number }[]
  sites: LostSiteBrief[]
}

export interface LostSiteBrief {
  siteCode: string
  customerName: string
  amphoe: string
  repId: string
  repName: string
  closedAt: string
  lostReason: string
  competitor: string
  stage: string
}

export interface ActivityPoint {
  date: string
  count: number
}

export interface RecentActivityItem {
  id: string
  siteCode: string
  repName: string
  reportType: string
  note: string
  status: SiteStatus
  reportDate: string
}

export interface RepBrief {
  id: string
  nickname: string
  displayName: string
  area: string
  pictureUrl: string
  status: 'active' | 'pending' | 'inactive'
  createdAt: string
}

export interface SiteBrief {
  siteCode: string
  customerName: string
  customerType: string
  contractorName: string
  decisionMaker: string
  phone: string
  status: SiteStatus
  stage: string
  amphoe: string
  tambon: string
  nextFollowUpDate: string | null
  lastReportAt: string | null
  ownerName: string
  reportCount: number
  createdAt: string
  closedAt: string | null
}
