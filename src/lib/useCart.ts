import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth'
import { api, guestCartId, readSessionToken } from './api'
import type { Cart, CartInput } from './cartContracts'

export function useCart() {
  const { user, isPending: sessionPending, isError: sessionError } = useAuth()
  const client = useQueryClient()
  const key = user ? ['private', user.id, 'cart'] : ['cart', guestCartId()]
  const query = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => (await api.get<Cart>('/cart', { signal })).data,
    enabled: !sessionPending && !sessionError,
    retry: false,
  })
  const token = readSessionToken()
  const mutation = useMutation({
    mutationFn: async (action: {
      method: 'post' | 'patch' | 'delete' | 'put'
      body: CartInput | { id: string; quantity?: number } | { coupon: string }
    }) => {
      if (token !== readSessionToken()) throw new Error('A sessão mudou. Tente novamente.')
      return (await api.request<Cart>({ url: '/cart', method: action.method, data: action.body }))
        .data
    },
    onSuccess: async (cart, action) => {
      if (token !== readSessionToken()) return
      await client.cancelQueries({ queryKey: key })
      if (token !== readSessionToken()) return
      client.setQueryData(key, cart)
      if (action.method === 'post')
        window.dispatchEvent(
          new CustomEvent('kurio:cart-added', { detail: 'NFT adicionado ao carrinho!' }),
        )
    },
    retry: false,
  })
  return { query, cart: query.data, mutation }
}
