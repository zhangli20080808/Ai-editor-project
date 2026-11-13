import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { adminRequest } from './http'
import type {
  AdminWork,
  ListAdminWorksParams,
  PageResult,
} from './types'

export const adminWorkKeys = {
  all: ['adminWorks'] as const,
  list: (params: ListAdminWorksParams) =>
    [...adminWorkKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminWorkKeys.all, 'detail', id] as const,
}

export function listAdminWorks(params: ListAdminWorksParams) {
  return adminRequest<PageResult<AdminWork>>('/admin/works', {
    params: { ...params },
  })
}

export function getAdminWork(id: string) {
  return adminRequest<AdminWork>(`/admin/works/${id}`)
}

export function offlineAdminWork(id: string, reason: string) {
  return adminRequest<AdminWork>(`/admin/works/${id}/offline`, {
    method: 'POST',
    body: { reason },
  })
}

export function restoreAdminWork(id: string, reason?: string) {
  return adminRequest<AdminWork>(`/admin/works/${id}/restore-publish`, {
    method: 'POST',
    body: { reason },
  })
}

export function useAdminWorksQuery(params: ListAdminWorksParams) {
  return useQuery({
    queryKey: adminWorkKeys.list(params),
    queryFn: () => listAdminWorks(params),
  })
}

export function useAdminWorkQuery(id: string | null) {
  return useQuery({
    queryKey: adminWorkKeys.detail(id ?? ''),
    queryFn: () => getAdminWork(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useOfflineAdminWorkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      offlineAdminWork(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminWorkKeys.all })
      await queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] })
    },
  })
}

export function useRestoreAdminWorkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      restoreAdminWork(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminWorkKeys.all })
      await queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] })
    },
  })
}
