import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'
import type {
  AnalyticsSummary, RepAnalytics, TrendPoint, AreaAnalytics,
  LostReasonsData, ActivityPoint, RecentActivityItem, RepBrief,
} from './types'

interface FilterParams {
  from: string
  to: string
  repId?: string
  amphoe?: string
}

function rangeParams(from: Date, to: Date, repId?: string | null, amphoe?: string | null): FilterParams {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const p: FilterParams = { from: fmt(from), to: fmt(to) }
  if (repId) p.repId = repId
  if (amphoe) p.amphoe = amphoe
  return p
}

export const analyticsService = {
  async getSummary(from: Date, to: Date, repId?: string | null, amphoe?: string | null) {
    const res = await apiClient.get<{ data: AnalyticsSummary }>(ADMIN_ROUTES.ANALYTICS_SUMMARY, { params: rangeParams(from, to, repId, amphoe) })
    return res.data.data
  },

  async getByRep(from: Date, to: Date, amphoe?: string | null) {
    const res = await apiClient.get<{ data: RepAnalytics[] }>(ADMIN_ROUTES.ANALYTICS_BY_REP, { params: rangeParams(from, to, null, amphoe) })
    return res.data.data
  },

  async getTrend(from: Date, to: Date, bucket = 'day', repId?: string | null, amphoe?: string | null) {
    const params = { ...rangeParams(from, to, repId, amphoe), bucket }
    const res = await apiClient.get<{ data: TrendPoint[] }>(ADMIN_ROUTES.ANALYTICS_TREND, { params })
    return res.data.data
  },

  async getByArea(from: Date, to: Date, repId?: string | null) {
    const res = await apiClient.get<{ data: AreaAnalytics[] }>(ADMIN_ROUTES.ANALYTICS_BY_AREA, { params: rangeParams(from, to, repId) })
    return res.data.data
  },

  async getLostReasons(from: Date, to: Date, repId?: string | null, amphoe?: string | null) {
    const res = await apiClient.get<{ data: LostReasonsData }>(ADMIN_ROUTES.ANALYTICS_LOST_REASONS, { params: rangeParams(from, to, repId, amphoe) })
    return res.data.data
  },

  async getActivity(from: Date, to: Date, repId?: string | null) {
    const res = await apiClient.get<{ data: ActivityPoint[] }>(ADMIN_ROUTES.ANALYTICS_ACTIVITY, { params: rangeParams(from, to, repId) })
    return res.data.data
  },

  async getRecentActivity(from: Date, to: Date, limit = 12, repId?: string | null, amphoe?: string | null) {
    const params = { ...rangeParams(from, to, repId, amphoe), limit }
    const res = await apiClient.get<{ data: RecentActivityItem[] }>(ADMIN_ROUTES.ANALYTICS_RECENT, { params })
    return res.data.data
  },

  async getReps() {
    const res = await apiClient.get<{ data: RepBrief[] }>(ADMIN_ROUTES.REPS)
    return res.data.data
  },
}
