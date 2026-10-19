import { useQuery } from '@tanstack/react-query'
import { checkInsService } from './service'

export const checkInKeys = {
  all: ['check-ins'] as const,
  byDate: (date: string) => [...checkInKeys.all, 'date', date] as const,
  teamSummary: (period: string) => [...checkInKeys.all, 'team', period] as const,
  repSummary: (repId: string, period: string) => [...checkInKeys.all, 'rep', repId, period] as const,
}

export function useCheckInsByDate(date: string) {
  return useQuery({
    queryKey: checkInKeys.byDate(date),
    queryFn: () => checkInsService.listByDate(date),
  })
}

export function useTeamSummary(period: string) {
  return useQuery({
    queryKey: checkInKeys.teamSummary(period),
    queryFn: () => checkInsService.teamSummary(period),
  })
}

export function useRepSummary(repId: string, period: string) {
  return useQuery({
    queryKey: checkInKeys.repSummary(repId, period),
    queryFn: () => checkInsService.repSummary(repId, period),
    enabled: !!repId,
  })
}
