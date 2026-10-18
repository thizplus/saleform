import { apiClient } from '@/lib/api-client'

const BASE = `${import.meta.env.VITE_API_URL}/admin/analytics`

export interface RepAnalytics {
  repId: string
  nickname: string
  area: string
  pictureUrl: string
  visits: number
  newSites: number
  followUps: number
  won: number
  lost: number
  following: number
  winRate: number
  overdue: number
}

export interface TrendPoint {
  bucket: string
  value: number
  teamAvg: number | null
}

export interface AreaAnalytics {
  amphoe: string
  tambon?: string
  visits: number
  won: number
  lost: number
  following: number
  winRate: number
}

export interface LostReasonsData {
  reasons: { reason: string; count: number }[]
  competitors: { name: string; count: number }[]
}

export interface ActivityPoint {
  date: string
  count: number
}

export const reportsService = {
  async getByRep(from?: string, to?: string): Promise<RepAnalytics[]> {
    const res = await apiClient.get<{ data: RepAnalytics[] }>(`${BASE}/by-rep`, { params: { from, to } })
    return res.data.data
  },

  async getTrend(from?: string, to?: string, bucket = 'day', metric = 'visits', repId?: string): Promise<TrendPoint[]> {
    const res = await apiClient.get<{ data: TrendPoint[] }>(`${BASE}/trend`, {
      params: { from, to, bucket, metric, repId },
    })
    return res.data.data
  },

  async getByArea(from?: string, to?: string, level = 'amphoe'): Promise<AreaAnalytics[]> {
    const res = await apiClient.get<{ data: AreaAnalytics[] }>(`${BASE}/by-area`, {
      params: { from, to, level },
    })
    return res.data.data
  },

  async getLostReasons(from?: string, to?: string): Promise<LostReasonsData> {
    const res = await apiClient.get<{ data: LostReasonsData }>(`${BASE}/lost-reasons`, {
      params: { from, to },
    })
    return res.data.data
  },

  async getActivity(from?: string, to?: string, repId?: string): Promise<ActivityPoint[]> {
    const res = await apiClient.get<{ data: ActivityPoint[] }>(`${BASE}/activity`, {
      params: { from, to, repId },
    })
    return res.data.data
  },
}
