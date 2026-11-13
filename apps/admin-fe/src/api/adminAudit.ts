import { useQuery } from '@tanstack/react-query'

import { adminRequest } from './http'
import type {
  AdminAuditLog,
  ListAdminAuditLogsParams,
  PageResult,
} from './types'

export const adminAuditKeys = {
  all: ['adminAuditLogs'] as const,
  list: (params: ListAdminAuditLogsParams) =>
    [...adminAuditKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminAuditKeys.all, 'detail', id] as const,
}

export function listAdminAuditLogs(params: ListAdminAuditLogsParams) {
  return adminRequest<PageResult<AdminAuditLog>>('/admin/audit-logs', {
    params: { ...params },
  })
}

export function getAdminAuditLog(id: string) {
  return adminRequest<AdminAuditLog>(`/admin/audit-logs/${id}`)
}

export function useAdminAuditLogsQuery(params: ListAdminAuditLogsParams) {
  return useQuery({
    queryKey: adminAuditKeys.list(params),
    queryFn: () => listAdminAuditLogs(params),
  })
}

export function useAdminAuditLogQuery(id: string | null) {
  return useQuery({
    queryKey: adminAuditKeys.detail(id ?? ''),
    queryFn: () => getAdminAuditLog(id ?? ''),
    enabled: Boolean(id),
  })
}
