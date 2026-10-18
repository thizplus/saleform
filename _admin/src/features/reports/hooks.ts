import { useQuery } from '@tanstack/react-query'
import { reportsService } from './service'

export const reportKeys = {
  all: ['admin-reports'] as const,
  byRep: (from?: string, to?: string) => [...reportKeys.all, 'by-rep', from, to] as const,
  trend: (from?: string, to?: string, repId?: string) => [...reportKeys.all, 'trend', from, to, repId] as const,
  byArea: (from?: string, to?: string) => [...reportKeys.all, 'by-area', from, to] as const,
  lostReasons: (from?: string, to?: string) => [...reportKeys.all, 'lost-reasons', from, to] as const,
  activity: (from?: string, to?: string, repId?: string) => [...reportKeys.all, 'activity', from, to, repId] as const,
}

export function useByRep(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.byRep(from, to),
    queryFn: () => reportsService.getByRep(from, to),
  })
}

export function useTrend(from?: string, to?: string, repId?: string) {
  return useQuery({
    queryKey: reportKeys.trend(from, to, repId),
    queryFn: () => reportsService.getTrend(from, to, 'day', 'visits', repId),
  })
}

export function useByArea(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.byArea(from, to),
    queryFn: () => reportsService.getByArea(from, to),
  })
}

export function useLostReasons(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.lostReasons(from, to),
    queryFn: () => reportsService.getLostReasons(from, to),
  })
}

export function useActivity(from?: string, to?: string, repId?: string) {
  return useQuery({
    queryKey: reportKeys.activity(from, to, repId),
    queryFn: () => reportsService.getActivity(from, to, repId),
    enabled: !!repId,
  })
}
