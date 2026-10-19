import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportNewService } from './service'
import type { CreateSiteForm } from './types'
import { siteKeys } from '@/features/sites'

export function useOptions() {
  return useQuery({
    queryKey: ['options'],
    queryFn: () => reportNewService.getOptions(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCheckDuplicate() {
  return useMutation({
    mutationFn: ({ phone, lat, lng, customerName }: { phone: string; lat?: number | null; lng?: number | null; customerName?: string }) =>
      reportNewService.checkDuplicate(phone, lat, lng, customerName),
  })
}

export function useUploadPhotos() {
  return useMutation({
    mutationFn: (files: File[]) => reportNewService.uploadPhotos(files),
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSiteForm) => reportNewService.createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.all })
    },
  })
}
