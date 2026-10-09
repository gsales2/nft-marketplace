import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { api, getApiError, sessionTokenKey } from './api'
import { queryClient } from './queryClient'
import type { AuthResponse, LoginRequest, RegisterRequest, SessionResponse } from './authContracts'

export const sessionOptions = queryOptions({
  queryKey: ['session'],
  queryFn: async ({ signal }): Promise<SessionResponse> => {
    try {
      return (await api.get<SessionResponse>('/session', { signal })).data
    } catch (error) {
      if (getApiError(error).code === 'SESSION_EXPIRED') return { session: null }
      throw error
    }
  },
  staleTime: 30_000,
  retry: false,
})

// All user data queries must begin with this prefix and then the user ID.
export async function clearPrivateState() {
  await queryClient.cancelQueries({ queryKey: ['cart'] })
  queryClient.removeQueries({ queryKey: ['cart'] })
  await queryClient.cancelQueries({ queryKey: ['private'] })
  queryClient.removeQueries({ queryKey: ['private'] })
  queryClient.getMutationCache().clear()
  window.dispatchEvent(new Event('kurio:session-changed'))
}

export function useAuth() {
  const client = useQueryClient()
  const session = useQuery(sessionOptions)
  const accept = async (response: AuthResponse) => {
    await client.cancelQueries({ queryKey: ['session'] })
    await clearPrivateState()
    localStorage.setItem(sessionTokenKey, response.token)
    client.setQueryData(sessionOptions.queryKey, { session: response.session })
  }
  const login = useMutation({
    mutationFn: async (body: LoginRequest) => (await api.post<AuthResponse>('/session', body)).data,
    onSuccess: accept,
    retry: false,
  })
  const register = useMutation({
    mutationFn: async (body: RegisterRequest) =>
      (await api.post<AuthResponse>('/accounts', body)).data,
    onSuccess: accept,
    retry: false,
  })
  const logout = useMutation({
    mutationFn: async () => {
      await api.delete('/session')
    },
    onSuccess: async () => {
      await client.cancelQueries({ queryKey: ['session'] })
      localStorage.removeItem(sessionTokenKey)
      await clearPrivateState()
      client.setQueryData(sessionOptions.queryKey, { session: null })
    },
    retry: false,
  })
  return { ...session, user: session.data?.session?.user ?? null, login, register, logout }
}

export async function requireSession(returnTo: string) {
  const result = await queryClient.fetchQuery({ ...sessionOptions, staleTime: 0 })
  if (!result.session) throw redirect({ to: '/login', search: { returnTo } })
  return result.session
}

export function safeReturnTo(value: unknown) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  )
    return '/'
  try {
    const parsed = new URL(value, window.location.origin)
    return parsed.origin === window.location.origin && parsed.pathname !== '/login'
      ? parsed.pathname + parsed.search + parsed.hash
      : '/'
  } catch {
    return '/'
  }
}
