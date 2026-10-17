import { useMutation } from '@tanstack/react-query'
import { authService, type LIFFAuthParams } from './service'
import { useAuthStore } from '@/stores/auth'

export function useLIFFAuth() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (params: LIFFAuthParams) => authService.liffAuth(params),
    onSuccess: (data) => {
      if (data.token) {
        setAuth(data.token, data.profile)
      }
    },
  })
}
