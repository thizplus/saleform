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
}

export interface SiteDetail {
  siteCode: string
  customerName: string
  customerType: string
  contractorName: string
  decisionMaker: string
  phone: string
  lat: number | null
  lng: number | null
  address: string
  amphoe: string
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
  page?: number
  limit?: number
}
