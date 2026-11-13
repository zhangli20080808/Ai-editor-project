import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { adminRequest } from './http'
import type {
  AdminUser,
  ListAdminUsersParams,
  PageResult,
} from './types'

export const adminUserKeys = {
  all: ['adminUsers'] as const,
  list: (params: ListAdminUsersParams) =>
    [...adminUserKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminUserKeys.all, 'detail', id] as const,
}

export function listAdminUsers(params: ListAdminUsersParams) {
  return adminRequest<PageResult<AdminUser>>('/admin/users', {
    params: { ...params },
  })
}

export function getAdminUser(id: string) {
  return adminRequest<AdminUser>(`/admin/users/${id}`)
}

export function freezeAdminUser(id: string, reason: string) {
  return adminRequest<AdminUser>(`/admin/users/${id}/freeze`, {
    method: 'POST',
    body: { reason },
  })
}

export function unfreezeAdminUser(id: string, reason?: string) {
  return adminRequest<AdminUser>(`/admin/users/${id}/unfreeze`, {
    method: 'POST',
    body: { reason },
  })
}

export function useAdminUsersQuery(params: ListAdminUsersParams) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => listAdminUsers(params),
  })
}

export function useAdminUserQuery(id: string | null) {
  return useQuery({
    queryKey: adminUserKeys.detail(id ?? ''),
    queryFn: () => getAdminUser(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useFreezeAdminUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      freezeAdminUser(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
      await queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] })
    },
  })
}

export function useUnfreezeAdminUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      unfreezeAdminUser(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
      await queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] })
    },
  })
}
