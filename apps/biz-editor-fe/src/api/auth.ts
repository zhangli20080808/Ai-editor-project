import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { clearAuthToken, getAuthToken, setAuthToken } from './authStorage'
import { request } from './http'
import type {
  AuthTokenResult,
  AuthUser,
  LoginByPhonePayload,
  SendCodeResult,
} from './types'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function sendLoginCode(phoneNumber: string) {
  return request<SendCodeResult>('/auth/send-code', {
    method: 'POST',
    body: { phoneNumber },
  })
}

export function loginByPhone(payload: LoginByPhonePayload) {
  return request<AuthTokenResult>('/auth/login-by-phone', {
    method: 'POST',
    body: payload,
  })
}

export function getCurrentUser() {
  return request<AuthUser>('/auth/me')
}

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getCurrentUser,
    enabled: Boolean(getAuthToken()),
    retry: false,
  })
}

export function useSendLoginCodeMutation() {
  return useMutation({
    mutationFn: sendLoginCode,
  })
}

export function useLoginByPhoneMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: loginByPhone,
    onSuccess: (result) => {
      setAuthToken(result.token)
      queryClient.setQueryData(authKeys.me, result.user)
      queryClient.invalidateQueries({ queryKey: ['works'] })
    },
  })
}

export function logout(queryClient: ReturnType<typeof useQueryClient>) {
  clearAuthToken()
  queryClient.removeQueries({ queryKey: authKeys.me })
  queryClient.invalidateQueries({ queryKey: ['works'] })
}
