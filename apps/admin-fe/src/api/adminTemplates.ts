import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { adminRequest } from './http'
import type {
  AdminTemplate,
  ListAdminTemplatesParams,
  PageResult,
} from './types'

export const adminTemplateKeys = {
  all: ['adminTemplates'] as const,
  list: (params: ListAdminTemplatesParams) =>
    [...adminTemplateKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminTemplateKeys.all, 'detail', id] as const,
}

export function listAdminTemplates(params: ListAdminTemplatesParams) {
  return adminRequest<PageResult<AdminTemplate>>('/admin/templates', {
    params: { ...params },
  })
}

export function getAdminTemplate(id: string) {
  return adminRequest<AdminTemplate>(`/admin/templates/${id}`)
}

export function publishAdminTemplate(id: string, reason?: string) {
  return adminRequest<AdminTemplate>(`/admin/templates/${id}/publish`, {
    method: 'POST',
    body: { reason },
  })
}

export function unpublishAdminTemplate(id: string, reason?: string) {
  return adminRequest<AdminTemplate>(`/admin/templates/${id}/unpublish`, {
    method: 'POST',
    body: { reason },
  })
}

export function recommendAdminTemplate(id: string, reason?: string) {
  return adminRequest<AdminTemplate>(`/admin/templates/${id}/recommend`, {
    method: 'POST',
    body: { reason },
  })
}

export function cancelRecommendAdminTemplate(id: string, reason?: string) {
  return adminRequest<AdminTemplate>(
    `/admin/templates/${id}/cancel-recommend`,
    {
      method: 'POST',
      body: { reason },
    },
  )
}

export function useAdminTemplatesQuery(params: ListAdminTemplatesParams) {
  return useQuery({
    queryKey: adminTemplateKeys.list(params),
    queryFn: () => listAdminTemplates(params),
  })
}

export function useAdminTemplateQuery(id: string | null) {
  return useQuery({
    queryKey: adminTemplateKeys.detail(id ?? ''),
    queryFn: () => getAdminTemplate(id ?? ''),
    enabled: Boolean(id),
  })
}

function useTemplateActionMutation(
  mutationFn: (payload: { id: string; reason?: string }) => Promise<AdminTemplate>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all })
      await queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] })
    },
  })
}

export function usePublishAdminTemplateMutation() {
  return useTemplateActionMutation(({ id, reason }) =>
    publishAdminTemplate(id, reason),
  )
}

export function useUnpublishAdminTemplateMutation() {
  return useTemplateActionMutation(({ id, reason }) =>
    unpublishAdminTemplate(id, reason),
  )
}

export function useRecommendAdminTemplateMutation() {
  return useTemplateActionMutation(({ id, reason }) =>
    recommendAdminTemplate(id, reason),
  )
}

export function useCancelRecommendAdminTemplateMutation() {
  return useTemplateActionMutation(({ id, reason }) =>
    cancelRecommendAdminTemplate(id, reason),
  )
}
