import { useQuery } from '@tanstack/react-query'
import { useFilters } from '@/lib/filters'
import { analyticsService } from './service'

const keys = {
  all: ['analytics'] as const,
  summary: (from: Date, to: Date, repId?: string | null, amphoe?: string | null) =>
    [...keys.all, 'summary', from.toISOString(), to.toISOString(), repId, amphoe] as const,
  byRep: (from: Date, to: Date, amphoe?: string | null) =>
    [...keys.all, 'byRep', from.toISOString(), to.toISOString(), amphoe] as const,
  trend: (from: Date, to: Date, bucket: string, repId?: string | null, amphoe?: string | null) =>
    [...keys.all, 'trend', from.toISOString(), to.toISOString(), bucket, repId, amphoe] as const,
  byArea: (from: Date, to: Date, repId?: string | null) =>
    [...keys.all, 'byArea', from.toISOString(), to.toISOString(), repId] as const,
  lostReasons: (from: Date, to: Date, repId?: string | null, amphoe?: string | null) =>
    [...keys.all, 'lostReasons', from.toISOString(), to.toISOString(), repId, amphoe] as const,
  activity: (from: Date, to: Date, repId?: string | null) =>
    [...keys.all, 'activity', from.toISOString(), to.toISOString(), repId] as const,
  recent: (from: Date, to: Date, repId?: string | null, amphoe?: string | null) =>
    [...keys.all, 'recent', from.toISOString(), to.toISOString(), repId, amphoe] as const,
  reps: () => [...keys.all, 'reps'] as const,
}

export function useSummary() {
  const { range, repId, amphoe } = useFilters()
  return useQuery({
    queryKey: keys.summary(range.from, range.to, repId, amphoe),
    queryFn: () => analyticsService.getSummary(range.from, range.to, repId, amphoe),
  })
}

export function useByRep() {
  const { range, amphoe } = useFilters()
  return useQuery({
    queryKey: keys.byRep(range.from, range.to, amphoe),
    queryFn: () => analyticsService.getByRep(range.from, range.to, amphoe),
  })
}

export function useTrend(bucket = 'day') {
  const { range, repId, amphoe } = useFilters()
  return useQuery({
    queryKey: keys.trend(range.from, range.to, bucket, repId, amphoe),
    queryFn: () => analyticsService.getTrend(range.from, range.to, bucket, repId, amphoe),
  })
}

export function useByArea() {
  const { range, repId } = useFilters()
  return useQuery({
    queryKey: keys.byArea(range.from, range.to, repId),
    queryFn: () => analyticsService.getByArea(range.from, range.to, repId),
  })
}

export function useLostReasons() {
  const { range, repId, amphoe } = useFilters()
  return useQuery({
    queryKey: keys.lostReasons(range.from, range.to, repId, amphoe),
    queryFn: () => analyticsService.getLostReasons(range.from, range.to, repId, amphoe),
  })
}

export function useActivity() {
  const { range, repId } = useFilters()
  return useQuery({
    queryKey: keys.activity(range.from, range.to, repId),
    queryFn: () => analyticsService.getActivity(range.from, range.to, repId),
  })
}

export function useRecentActivity() {
  const { range, repId, amphoe } = useFilters()
  return useQuery({
    queryKey: keys.recent(range.from, range.to, repId, amphoe),
    queryFn: () => analyticsService.getRecentActivity(range.from, range.to, 12, repId, amphoe),
  })
}

export function useReps() {
  return useQuery({
    queryKey: keys.reps(),
    queryFn: () => analyticsService.getReps(),
    staleTime: 5 * 60_000,
  })
}
