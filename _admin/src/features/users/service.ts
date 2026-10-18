import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

export interface AdminUser {
  id: string
  email: string
  displayName: string
  role: string
  isActive: boolean
  createdAt: string
}

export const userService = {
  async list(): Promise<AdminUser[]> {
    const res = await apiClient.get<{ data: AdminUser[] }>(ADMIN_ROUTES.USERS)
    return res.data.data
  },

  async create(data: { email: string; password: string; displayName: string; role: string }) {
    const res = await apiClient.post<{ data: AdminUser }>(ADMIN_ROUTES.USERS, data)
    return res.data.data
  },

  async update(id: string, data: Record<string, unknown>) {
    const res = await apiClient.patch<{ data: { updated: boolean } }>(ADMIN_ROUTES.USER_BY_ID(id), data)
    return res.data.data
  },
}
