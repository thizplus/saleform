export interface SiteBrief {
  siteCode: string
  customerName: string
  phone: string
  status: string
  stage: string
  nextFollowUpDate: string | null
  thumbUrl: string
  isMine: boolean
  ownerName: string
  reportCount: number
  lat: number | null
  lng: number | null
  contractorName?: string
  tambon?: string
  amphoe?: string
  lastReportAt?: string | null
}

export interface ContactBrief {
  id: string
  name: string
  phone: string
  contactType: string
  authority: string
  role: string
  isPrimary: boolean
}

export interface SiteDetail {
  siteCode: string
  customerName: string
  customerType: string
  contractorName: string
  phone: string
  lat: number | null
  lng: number | null
  tambon: string
  amphoe: string
  province: string
  postcode: string
  stage: string
  status: string
  lostReason: string
  competitor: string
  expectedOrderDate: string | null
  nextFollowUpDate: string | null
  ownerName: string
  ownerId: string
  canEdit: boolean
  mapsUrl: string
  createdAt: string
  reports: ReportBrief[]
  photos: PhotoBrief[]
  contacts: ContactBrief[]
}

export interface ReportBrief {
  id: string
  reportType: string
  note: string
  stage: string
  status: string
  repName: string
  reportDate: string
  photos: PhotoBrief[]
}

export interface PhotoBrief {
  id: string
  thumbUrl: string
  fullUrl: string
}

export interface SiteListParams {
  tab?: string
  q?: string
  day?: string
  page?: number
  limit?: number
}

export interface MyStatsData {
  running: number
  newJobs: number
  completed: number
  closeRate: number
  teamCloseRate: number | null
  teamAvgRunning: number | null
  teamAvgNewJobs: number | null
  outcomes: {
    won: number
    following: number
    lost: number
  }
  onTimeRate: number | null
  overdue: number
}
