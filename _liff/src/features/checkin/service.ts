import { apiClient } from '@/lib/api-client'
import { LIFF_ROUTES } from '@/constants/api-routes'

export interface CheckInStatus {
  checkedIn: boolean
  today?: CheckInData
  lastPlate: string
  lastMileage: number
  eveningSummaryDone: boolean
}

export interface CheckInData {
  id: string
  checkInDate: string
  licensePlate: string
  mileage: number
  selfieUrl: string
  dailyKm: number | null
  createdAt: string
  chatMessages?: Record<string, unknown>[]
}

export const checkInService = {
  async getStatus(): Promise<CheckInStatus> {
    const res = await apiClient.get<{ data: CheckInStatus }>(LIFF_ROUTES.CHECK_IN_STATUS)
    return res.data.data
  },

  async checkIn(data: { licensePlate: string; mileage: number; selfieKey: string }): Promise<CheckInData> {
    const res = await apiClient.post<{ data: CheckInData }>(LIFF_ROUTES.CHECK_IN, data)
    return res.data.data
  },

  async eveningSummary(data: EveningSummaryForm): Promise<EveningSummaryResponse> {
    const res = await apiClient.post<{ data: EveningSummaryResponse }>(LIFF_ROUTES.EVENING_SUMMARY, data)
    return res.data.data
  },
}

export interface EveningSummaryForm {
  mileage: number
  callCount: number
  billCount: number
  oldCustomerAmount: number
  newCustomerAmount: number
}

export interface EveningSummaryResponse {
  id: string
  mileage: number
  callCount: number
  billCount: number
  oldCustomerAmount: number
  newCustomerAmount: number
  dailyKm: number | null
  chatMessages?: Record<string, unknown>[]
}
