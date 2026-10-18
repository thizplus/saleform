import { useQuery } from '@tanstack/react-query'
import { optionsService } from './service'

export const optionKeys = {
  all: ['admin-options'] as const,
}

export function useOptions() {
  return useQuery({
    queryKey: optionKeys.all,
    queryFn: () => optionsService.get(),
  })
}
