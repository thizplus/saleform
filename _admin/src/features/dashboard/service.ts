import { apiClient } from '@/lib/api-client'

const BASE = `${import.meta.env.VITE_API_URL}/admin/analytics`

export interface SummaryData {
  visits: number
  newSites: number
  followUps: number
  won: number
  lost: number
  following: number
  cancelled: number
  winRate: number
  overdue: number
  avgDaysToWin: number | null
  previous: {
    visits: number
    newSites: number
    followUps: number
    won: number
    lost: number
    winRate: number
  }
}

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

export const dashboardService = {
  async getSummary(from?: string, to?: string): Promise<SummaryData> {
    const res = await apiClient.get<{ data: SummaryData }>(`${BASE}/summary`, {
      params: { from, to },
    })
    return res.data.data
  },

  async getByRep(from?: string, to?: string): Promise<RepAnalytics[]> {
    const res = await apiClient.get<{ data: RepAnalytics[] }>(`${BASE}/by-rep`, {
      params: { from, to },
    })
    return res.data.data
  },

  async getTrend(from?: string, to?: string, bucket = 'day'): Promise<TrendPoint[]> {
    const res = await apiClient.get<{ data: TrendPoint[] }>(`${BASE}/trend`, {
      params: { from, to, bucket, metric: 'visits' },
    })
    return res.data.data
  },
}
