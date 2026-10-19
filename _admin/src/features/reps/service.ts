import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

export interface UpdateRepPayload {
  nickname?: string
  area?: string
  status?: string
}

export const repService = {
  async updateRep(id: string, data: UpdateRepPayload) {
    const res = await apiClient.patch<{ success: boolean }>(ADMIN_ROUTES.REP_BY_ID(id), data)
    return res.data
  },
}
