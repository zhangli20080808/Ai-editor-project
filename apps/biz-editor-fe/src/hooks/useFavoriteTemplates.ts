import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getFavoriteTemplateIds, setTemplateFavorite } from '../api/works'
import { getAuthToken } from '../api/authStorage'

const favoritesKey = ['favorite-templates'] as const

export function useFavoriteTemplates() {
  const queryClient = useQueryClient()
  const enabled = Boolean(getAuthToken())
  const favoritesQuery = useQuery({
    queryKey: favoritesKey,
    queryFn: getFavoriteTemplateIds,
    enabled,
  })
  const favoriteIds = enabled ? (favoritesQuery.data?.ids ?? []) : []
  const favoriteSet = new Set(favoriteIds)
  const mutation = useMutation({
    mutationFn: ({ templateId, favorite }: { templateId: string; favorite: boolean }) =>
      setTemplateFavorite(templateId, favorite),
    onMutate: async ({ templateId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey })
      const previous = queryClient.getQueryData<{ ids: string[] }>(favoritesKey)
      const currentIds = previous?.ids ?? []
      queryClient.setQueryData(favoritesKey, {
        ids: favorite
          ? Array.from(new Set([...currentIds, templateId]))
          : currentIds.filter((id) => id !== templateId),
      })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(favoritesKey, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoritesKey })
      queryClient.invalidateQueries({ queryKey: ['public-templates'] })
      queryClient.invalidateQueries({ queryKey: ['public-template'] })
    },
  })

  return {
    favoriteIds,
    favoriteSet,
    isFavorite: (templateId: string) => favoriteSet.has(templateId),
    toggleFavorite: (templateId: string) => {
      const favorite = !favoriteSet.has(templateId)
      mutation.mutate({ templateId, favorite })
    },
    isPending: mutation.isPending,
  }
}
