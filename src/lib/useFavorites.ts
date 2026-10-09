import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth'
import { api, readSessionToken } from './api'
import type { FavoritesResponse } from './authContracts'

export function useFavorites() {
  const { user } = useAuth()
  const client = useQueryClient()
  const ownerToken = readSessionToken()
  const key = ['private', user?.id, 'favorites']
  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async ({ signal }) =>
      (await api.get<FavoritesResponse>('/favorites', { signal })).data,
    staleTime: 30_000,
  })
  const mutation = useMutation({
    mutationFn: async ({ id, remove }: { id: string; remove: boolean }) => {
      if (!ownerToken || ownerToken !== readSessionToken()) throw new Error('Session changed')
      return (
        await (remove
          ? api.delete<FavoritesResponse>(`/favorites/${encodeURIComponent(id)}`)
          : api.post<FavoritesResponse>(`/favorites/${encodeURIComponent(id)}`))
      ).data
    },
    onMutate: async ({ id, remove }) => {
      await client.cancelQueries({ queryKey: key })
      if (!ownerToken || ownerToken !== readSessionToken()) throw new Error('Session changed')
      const previous = client.getQueryData<FavoritesResponse>(key) ?? { ids: [] }
      client.setQueryData(key, {
        ids: remove
          ? previous.ids.filter((value) => value !== id)
          : [...new Set([...previous.ids, id])],
      })
      return { previous, token: ownerToken }
    },
    onError: (_error, _variables, context) => {
      if (context && context.token === readSessionToken())
        client.setQueryData(key, context.previous)
    },
    onSuccess: (data, _variables, context) => {
      if (context.token === readSessionToken() && client.getQueryData(key))
        client.setQueryData(key, data)
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.token === readSessionToken())
        return Promise.all([
          client.invalidateQueries({ queryKey: key }),
          client.invalidateQueries({ queryKey: ['private', user?.id, 'catalog'] }),
        ])
    },
    retry: false,
  })
  return { favorites: user ? (query.data?.ids ?? []) : [], query, mutation, user }
}
