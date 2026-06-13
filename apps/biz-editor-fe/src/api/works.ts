import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { request } from './http'
import type {
  CreateWorkPayload,
  ListWorksParams,
  PageResult,
  UpdateWorkPayload,
  Work,
} from './types'

export const worksKeys = {
  all: ['works'] as const,
  list: (params: ListWorksParams = {}) => ['works', params] as const,
  detail: (id: string) => ['work', id] as const,
}

export function getWorks(params: ListWorksParams = {}) {
  return request<PageResult<Work>>('/works', {
    params: { ...params },
  })
}

export function getWork(id: string) {
  return request<Work>(`/works/${id}`)
}

export function createWork(payload: CreateWorkPayload) {
  return request<Work>('/works', {
    method: 'POST',
    body: payload,
  })
}

export function updateWork(id: string, payload: UpdateWorkPayload) {
  return request<Work>(`/works/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function publishWork(id: string) {
  return request<Work>(`/works/${id}/publish`, {
    method: 'POST',
  })
}

export function copyWork(id: string) {
  return request<Work>(`/works/${id}/copy`, {
    method: 'POST',
  })
}

export function deleteWork(id: string) {
  return request<Work>(`/works/${id}`, {
    method: 'DELETE',
  })
}

export function restoreWork(id: string) {
  return request<Work>(`/works/${id}/restore`, {
    method: 'POST',
  })
}

export function useWorksQuery(params: ListWorksParams = {}) {
  return useQuery({
    queryKey: worksKeys.list(params),
    queryFn: () => getWorks(params),
  })
}

export function useWorkQuery(id?: string) {
  return useQuery({
    queryKey: worksKeys.detail(id ?? ''),
    queryFn: () => getWork(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useCreateWorkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWork,
    onSuccess: (work) => {
      queryClient.invalidateQueries({ queryKey: worksKeys.all })
      queryClient.setQueryData(worksKeys.detail(work.uuid), work)
    },
  })
}

export function useUpdateWorkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWorkPayload }) =>
      updateWork(id, payload),
    onSuccess: (work) => {
      queryClient.invalidateQueries({ queryKey: worksKeys.all })
      queryClient.setQueryData(worksKeys.detail(work.uuid), work)
    },
  })
}

export function usePublishWorkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publishWork,
    onSuccess: (work) => {
      queryClient.invalidateQueries({ queryKey: worksKeys.all })
      queryClient.setQueryData(worksKeys.detail(work.uuid), work)
    },
  })
}

export function useCopyWorkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: copyWork,
    onSuccess: (work) => {
      queryClient.invalidateQueries({ queryKey: worksKeys.all })
      queryClient.setQueryData(worksKeys.detail(work.uuid), work)
    },
  })
}

export function useDeleteWorkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWork,
    onSuccess: (work) => {
      queryClient.invalidateQueries({ queryKey: worksKeys.all })
      queryClient.setQueryData(worksKeys.detail(work.uuid), work)
    },
  })
}

export function useRestoreWorkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreWork,
    onSuccess: (work) => {
      queryClient.invalidateQueries({ queryKey: worksKeys.all })
      queryClient.setQueryData(worksKeys.detail(work.uuid), work)
    },
  })
}
