import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { checkInService, type EveningSummaryForm } from './service'

export const checkInKeys = {
  all: ['check-in'] as const,
  status: () => [...checkInKeys.all, 'status'] as const,
}

export function useCheckInStatus() {
  return useQuery({
    queryKey: checkInKeys.status(),
    queryFn: () => checkInService.getStatus(),
    staleTime: 60_000,
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { licensePlate: string; mileage: number; selfieKey: string }) =>
      checkInService.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.status() })
    },
  })
}

export function useEveningSummary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EveningSummaryForm) => checkInService.eveningSummary(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.status() })
    },
  })
}
