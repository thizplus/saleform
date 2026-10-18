import { useQuery } from '@tanstack/react-query'
import { userService } from './service'

export const userKeys = {
  all: ['admin-users'] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => userService.list(),
  })
}
