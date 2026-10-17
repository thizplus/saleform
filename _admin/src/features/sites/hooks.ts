import { useQuery } from '@tanstack/react-query'
import { siteService, type SiteListParams } from './service'

export const siteKeys = {
  all: ['admin-sites'] as const,
  list: (p?: SiteListParams) => [...siteKeys.all, 'list', p] as const,
}

export function useSiteList(params?: SiteListParams) {
  return useQuery({
    queryKey: siteKeys.list(params),
    queryFn: () => siteService.getList(params),
  })
}
