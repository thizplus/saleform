import { apiClient } from '@/lib/api-client'
import { LIFF_ROUTES } from '@/constants/api-routes'

interface ContactInput {
  name: string
  phone: string
  contactType: string
  authority: string
}

interface CreateFollowUpParams {
  note: string
  status: string
  nextFollowUpDate?: string
  lostReason: string
  competitor: string
  stage: string
  photoIds: string[]
  groupId?: string
  newPhone?: string
  contacts?: ContactInput[]
}

interface FollowUpResponse {
  site: { siteCode: string }
  report: { id: string }
  messageSent: boolean
  chatMessages?: unknown[]
}

export const followUpService = {
  async createFollowUp(code: string, data: CreateFollowUpParams): Promise<FollowUpResponse> {
    const res = await apiClient.post<{ data: FollowUpResponse }>(
      LIFF_ROUTES.SITE_FOLLOW_UP(code),
      data
    )
    return res.data.data
  },
}
