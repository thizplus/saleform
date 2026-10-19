import { useMutation, useQueryClient } from '@tanstack/react-query'
import { repService, type UpdateRepPayload } from './service'
import { useOptions } from '@/features/options'

export function useUpdateRep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRepPayload }) =>
      repService.updateRep(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analytics', 'reps'] })
    },
  })
}

export function useAmphoeOptions() {
  const { data } = useOptions()
  return data?.amphoes ?? []
}
