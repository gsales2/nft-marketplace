import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, readSessionToken } from './api'
import { useAuth, sessionOptions } from './auth'
import type { Profile, ProfileUpdate } from './profileContracts'
export function useProfile() {
  const { user } = useAuth()
  const client = useQueryClient()
  const token = readSessionToken()
  const key = ['private', user?.id, 'profile']
  const query = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => (await api.get<Profile>('/profile', { signal })).data,
    enabled: !!user,
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: async (body: ProfileUpdate) => {
      if (!token || token !== readSessionToken()) throw new Error('A sessão mudou.')
      return (await api.patch<Profile>('/profile', body)).data
    },
    onSuccess: async (profile) => {
      if (token !== readSessionToken()) return
      await client.cancelQueries({ queryKey: key })
      if (token !== readSessionToken()) return
      client.setQueryData(key, profile)
      await client.invalidateQueries({ queryKey: sessionOptions.queryKey })
    },
    retry: false,
  })
  return { user, query, mutation }
}
