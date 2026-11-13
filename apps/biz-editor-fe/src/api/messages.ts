import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { request } from './http'
import type { AppMessage, MessageListResult } from './types'

export const messagesKeys = {
  all: ['messages'] as const,
}

export function getMessages() {
  return request<MessageListResult>('/messages')
}

export function markMessageRead(id: string) {
  return request<AppMessage>(`/messages/${id}/read`, {
    method: 'POST',
  })
}

export function markAllMessagesRead() {
  return request<{ ok: boolean }>('/messages/read-all', {
    method: 'POST',
  })
}

export function useMessagesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: messagesKeys.all,
    queryFn: getMessages,
    ...options,
  })
}

export function useMarkMessageReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markMessageRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.all })
    },
  })
}

export function useMarkAllMessagesReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllMessagesRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.all })
    },
  })
}
