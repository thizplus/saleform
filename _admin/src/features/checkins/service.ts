import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

export interface CheckInRow {
  id: string
  repId: string
  repName: string
  pictureUrl: string
  checkInDate: string
  licensePlate: string
  mileage: number
  selfieUrl: string
  dailyKm: number | null
  createdAt: string
}

export interface RepSummary {
  repId: string
  repName: string
  pictureUrl: string
  period: string
  totalKm: number
  checkInDays: number
  avgKmPerDay: number
  entries?: { date: string; mileage: number; dailyKm: number | null; licensePlate: string }[]
}

export interface TeamSummary {
  period: string
  reps: RepSummary[]
}

export const checkInsService = {
  async listByDate(date: string): Promise<CheckInRow[]> {
    const res = await apiClient.get<{ data: CheckInRow[] }>(ADMIN_ROUTES.CHECK_INS, { params: { date } })
    return res.data.data
  },

  async teamSummary(period: string): Promise<TeamSummary> {
    const res = await apiClient.get<{ data: TeamSummary }>(ADMIN_ROUTES.CHECK_INS_SUMMARY, { params: { period } })
    return res.data.data
  },

  async repSummary(repId: string, period: string): Promise<RepSummary> {
    const res = await apiClient.get<{ data: RepSummary }>(ADMIN_ROUTES.CHECK_INS_REP(repId), { params: { period } })
    return res.data.data
  },
}
