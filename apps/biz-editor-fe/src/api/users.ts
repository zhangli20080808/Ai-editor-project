import { useQuery } from '@tanstack/react-query'

import { request } from './http'
import type { AuthUser } from './types'

export const usersKeys = {
  search: (keyword: string) => ['users', 'search', keyword] as const,
}

export function searchUsers(keyword: string) {
  return request<AuthUser[]>('/users/search', {
    params: { keyword },
  })
}

export function useUserSearchQuery(keyword: string) {
  const normalizedKeyword = keyword.trim()

  return useQuery({
    queryKey: usersKeys.search(normalizedKeyword),
    queryFn: () => searchUsers(normalizedKeyword),
    enabled: normalizedKeyword.length > 0,
  })
}
