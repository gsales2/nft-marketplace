import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, readSessionToken } from './api'
import { useAuth } from './auth'
import type { WalletInput, Wallets } from './walletContracts'

export function useWallets() {
  const { user } = useAuth()
  const client = useQueryClient()
  const key = ['private', user?.id, 'wallets']
  const token = readSessionToken()
  const query = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => (await api.get<Wallets>('/wallets', { signal })).data,
    enabled: !!user,
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: async (action: {
      method: 'post' | 'patch'
      body: WalletInput | (Partial<WalletInput> & { id: string; selectOnly?: boolean })
    }) => {
      if (!token || token !== readSessionToken()) throw new Error('A sessão mudou.')
      return (
        await api.request<Wallets>({ url: '/wallets', method: action.method, data: action.body })
      ).data
    },
    onSuccess: async (data) => {
      if (token !== readSessionToken()) return
      await client.cancelQueries({ queryKey: key })
      if (token === readSessionToken()) client.setQueryData(key, data)
    },
    retry: false,
  })
  return { user, query, mutation, wallets: query.data }
}
