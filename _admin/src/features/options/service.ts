import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

export interface DropdownOptions {
  customerTypes: string[]
  stages: string[]
  lostReasons: string[]
  competitors: string[]
  amphoes: string[]
  vehiclePlates: string[]
}

export const optionsService = {
  async get(): Promise<DropdownOptions> {
    const res = await apiClient.get<{ data: DropdownOptions }>(ADMIN_ROUTES.OPTIONS)
    return res.data.data
  },

  async save(options: DropdownOptions) {
    const res = await apiClient.put<{ data: { updated: boolean } }>(ADMIN_ROUTES.OPTIONS, options)
    return res.data.data
  },
}
