import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

export interface SiteBrief {
  siteCode: string
  customerName: string
  customerType: string
  contractorName: string
  phone: string
  status: string
  stage: string
  amphoe: string
  tambon: string
  province: string
  postcode: string
  nextFollowUpDate: string | null
  lastReportAt: string | null
  ownerName: string
  reportCount: number
  createdAt: string
}

export interface SiteListResponse {
  sites: SiteBrief[]
  total: number
  page: number
  limit: number
}

export interface SiteListParams {
  tab?: string
  q?: string
  status?: string
  repId?: string
  amphoe?: string
  page?: number
  limit?: number
}

export interface PhotoBrief {
  id: string
  thumbUrl: string
  fullUrl: string
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

export interface SiteDetail {
  siteCode: string
  customerName: string
  customerType: string
  contractorName: string
  phone: string
  lat: number | null
  lng: number | null
  address: string
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
}

export const siteService = {
  async getList(params?: SiteListParams): Promise<SiteListResponse> {
    const res = await apiClient.get<{ data: SiteListResponse }>(ADMIN_ROUTES.SITES, { params })
    return res.data.data
  },

  async getByCode(code: string): Promise<SiteDetail> {
    const res = await apiClient.get<{ data: SiteDetail }>(ADMIN_ROUTES.SITE_BY_CODE(code))
    return res.data.data
  },

  async updateSite(code: string, data: Record<string, unknown>) {
    const res = await apiClient.patch<{ data: { updated: boolean } }>(ADMIN_ROUTES.SITE_BY_CODE(code), data)
    return res.data.data
  },
}
