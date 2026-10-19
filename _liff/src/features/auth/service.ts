import { apiClient } from '@/lib/api-client'
import { AUTH_ROUTES } from '@/constants/api-routes'
import type { RepProfile } from '@/stores/auth'

export interface LIFFAuthResponse {
  token: string
  profile: RepProfile
}

export interface LIFFAuthParams {
  idToken: string
  nickname?: string
  areas?: string[]
  phone?: string
}

export interface RegisterParams {
  idToken: string
  nickname: string
  areas: string[]
  phone: string
}

export const authService = {
  /** ส่ง LINE ID token ไป backend — ได้ JWT + profile กลับมา */
  async liffAuth(params: LIFFAuthParams): Promise<LIFFAuthResponse> {
    const res = await apiClient.post<{ data: LIFFAuthResponse }>(AUTH_ROUTES.LIFF_AUTH, params)
    return res.data.data
  },

  /** ลงทะเบียนเซลล์ใหม่ — ใช้ /liff/auth ตัวเดียวกัน (backend รองรับ nickname+area) */
  async register(params: RegisterParams): Promise<LIFFAuthResponse> {
    const res = await apiClient.post<{ data: LIFFAuthResponse }>(AUTH_ROUTES.LIFF_AUTH, params)
    return res.data.data
  },

  /** ดึง profile ใหม่ (ใช้ JWT ที่มีอยู่) */
  async refreshProfile(): Promise<LIFFAuthResponse> {
    const res = await apiClient.get<{ data: LIFFAuthResponse }>(AUTH_ROUTES.ME)
    return res.data.data
  },
}
