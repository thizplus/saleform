import { apiClient } from '@/lib/api-client'
import { LIFF_ROUTES } from '@/constants/api-routes'
import type { CreateSiteForm, OptionsData, DuplicateMatch } from './types'

interface CreateSiteResponse {
  site: { siteCode: string; customerName: string }
  report: { id: string; closeStatus?: string }
  messageSent: boolean
  chatMessages?: unknown[]
}

interface DuplicateCheckResponse {
  hasDuplicate: boolean
  matches: DuplicateMatch[]
}

interface UploadResponse {
  files: { id: string; thumbUrl: string }[]
}

export const reportNewService = {
  async getOptions(): Promise<OptionsData> {
    const res = await apiClient.get<{ data: OptionsData }>(LIFF_ROUTES.OPTIONS)
    return res.data.data
  },

  async checkDuplicate(phone: string, lat?: number | null, lng?: number | null, customerName?: string): Promise<DuplicateCheckResponse> {
    const params: Record<string, string | number> = {}
    if (phone) params.phone = phone
    if (lat) params.lat = lat
    if (lng) params.lng = lng
    if (customerName) params.name = customerName

    const res = await apiClient.get<{ data: DuplicateCheckResponse }>(LIFF_ROUTES.CHECK_DUPLICATE, { params })
    return res.data.data
  },

  async uploadPhotos(files: File[]): Promise<UploadResponse> {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))

    const res = await apiClient.post<{ data: UploadResponse }>(LIFF_ROUTES.UPLOADS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return res.data.data
  },

  async createSite(data: CreateSiteForm): Promise<CreateSiteResponse> {
    const { idempotencyKey, ...body } = data
    const headers: Record<string, string> = {}
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }
    const res = await apiClient.post<{ data: CreateSiteResponse }>(LIFF_ROUTES.SITES, body, { headers })
    return res.data.data
  },
}
