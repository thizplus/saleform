import { apiClient } from '@/lib/api-client'
import { AUTH_ROUTES } from '@/constants/api-routes'

export interface LIFFAuthResponse {
  token: string
  profile: {
    id: string
    displayName: string
    pictureUrl: string
    nickname: string
    area: string
    status: string
    registered: boolean
    counts: {
      dueToday: number
      overdue: number
      following: number
    }
  }
}

export interface LIFFAuthParams {
  idToken: string
  nickname?: string
  area?: string
}

export const authService = {
  async liffAuth(params: LIFFAuthParams): Promise<LIFFAuthResponse> {
    const res = await apiClient.post<{ data: LIFFAuthResponse }>(AUTH_ROUTES.LIFF_AUTH, params)
    return res.data.data
  },
}
