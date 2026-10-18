import { useQuery } from '@tanstack/react-query'
import { siteService, type SiteListParams } from './service'

export const siteKeys = {
  all: ['admin-sites'] as const,
  list: (p?: SiteListParams) => [...siteKeys.all, 'list', p] as const,
  detail: (code: string) => [...siteKeys.all, 'detail', code] as const,
}

export function useSiteList(params?: SiteListParams) {
  return useQuery({
    queryKey: siteKeys.list(params),
    queryFn: () => siteService.getList(params),
  })
}

export function useSiteDetail(code: string) {
  return useQuery({
    queryKey: siteKeys.detail(code),
    queryFn: () => siteService.getByCode(code),
    enabled: !!code,
  })
}
