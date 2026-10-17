import { apiClient } from '@/lib/api-client'
import { LIFF_ROUTES } from '@/constants/api-routes'
import type { SiteBrief, SiteDetail, SiteListParams } from './types'

interface SiteListResponse {
  sites: SiteBrief[]
  total: number
  page: number
  limit: number
}

export const siteService = {
  async getList(params?: SiteListParams): Promise<SiteListResponse> {
    const res = await apiClient.get<{ data: SiteListResponse }>(LIFF_ROUTES.SITES, { params })
    return res.data.data
  },

  async getByCode(code: string): Promise<SiteDetail> {
    const res = await apiClient.get<{ data: SiteDetail }>(LIFF_ROUTES.SITE_BY_CODE(code))
    return res.data.data
  },
}
