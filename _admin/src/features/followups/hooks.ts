import { useQuery } from '@tanstack/react-query'
import { followUpService } from './service'

export const followUpKeys = {
  all: ['admin-followups'] as const,
  tab: (tab: string) => [...followUpKeys.all, tab] as const,
}

export function useFollowUps(tab: string) {
  return useQuery({
    queryKey: followUpKeys.tab(tab),
    queryFn: () => followUpService.getByTab(tab),
  })
}
