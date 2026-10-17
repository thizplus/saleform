import { useQuery } from '@tanstack/react-query'
import { siteService } from './service'
import type { SiteListParams } from './types'

export const siteKeys = {
  all: ['sites'] as const,
  list: (params?: SiteListParams) => [...siteKeys.all, 'list', params] as const,
  detail: (code: string) => [...siteKeys.all, 'detail', code] as const,
  myStats: (period: string) => ['my-stats', period] as const,
}

export function useSiteList(params?: SiteListParams, enabled = true) {
  return useQuery({
    queryKey: siteKeys.list(params),
    queryFn: () => siteService.getList(params),
    enabled,
  })
}

export function useSiteDetail(code: string) {
  return useQuery({
    queryKey: siteKeys.detail(code),
    queryFn: () => siteService.getByCode(code),
    enabled: !!code,
  })
}

export function useMyStats(period: string) {
  return useQuery({
    queryKey: siteKeys.myStats(period),
    queryFn: () => siteService.getMyStats(period),
  })
}
