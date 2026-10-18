import { useQuery } from '@tanstack/react-query'
import { dashboardService } from './service'

export const dashboardKeys = {
  all: ['admin-dashboard'] as const,
  summary: (from?: string, to?: string) => [...dashboardKeys.all, 'summary', from, to] as const,
  byRep: (from?: string, to?: string) => [...dashboardKeys.all, 'by-rep', from, to] as const,
  trend: (from?: string, to?: string) => [...dashboardKeys.all, 'trend', from, to] as const,
}

export function useSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: dashboardKeys.summary(from, to),
    queryFn: () => dashboardService.getSummary(from, to),
  })
}

export function useByRep(from?: string, to?: string) {
  return useQuery({
    queryKey: dashboardKeys.byRep(from, to),
    queryFn: () => dashboardService.getByRep(from, to),
  })
}

export function useTrend(from?: string, to?: string) {
  return useQuery({
    queryKey: dashboardKeys.trend(from, to),
    queryFn: () => dashboardService.getTrend(from, to),
  })
}
