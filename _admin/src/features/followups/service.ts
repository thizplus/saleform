import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'
import type { SiteBrief } from '@/features/sites/service'

interface SiteListResponse {
  sites: SiteBrief[]
  total: number
  page: number
  limit: number
}

export const followUpService = {
  async getByTab(tab: string): Promise<SiteBrief[]> {
    const res = await apiClient.get<{ data: SiteListResponse }>(ADMIN_ROUTES.SITES, {
      params: { tab, limit: 200 },
    })
    return res.data.data.sites
  },
}
