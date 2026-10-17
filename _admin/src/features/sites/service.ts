import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

export interface SiteBrief {
  siteCode: string
  customerName: string
  phone: string
  status: string
  stage: string
  nextFollowUpDate: string | null
  isMine: boolean
  ownerName: string
  reportCount: number
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

export const siteService = {
  async getList(params?: SiteListParams): Promise<SiteListResponse> {
    const res = await apiClient.get<{ data: SiteListResponse }>(ADMIN_ROUTES.SITES, { params })
    return res.data.data
  },

  async getByCode(code: string) {
    const res = await apiClient.get<{ data: unknown }>(ADMIN_ROUTES.SITE_BY_CODE(code))
    return res.data.data
  },

  async updateSite(code: string, data: Record<string, unknown>) {
    const res = await apiClient.patch<{ data: unknown }>(ADMIN_ROUTES.SITE_BY_CODE(code), data)
    return res.data.data
  },
}
