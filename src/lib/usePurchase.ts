import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api, getApiError, readSessionToken } from './api'
import { useAuth } from './auth'
import { orderFingerprint, type OrderInput } from './checkoutContracts'
import { readCheckoutAttempt, saveCheckoutAttempt } from './checkoutAttempt'
import type { Order } from './orderContracts'

export function usePurchase() {
  const { user } = useAuth()
  const token = readSessionToken()
  const client = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationKey: ['private', user?.id, 'purchase'],
    mutationFn: async (input: OrderInput) => {
      if (!user || !token || token !== readSessionToken()) throw new Error('A sessão mudou.')
      if (sessionStorage.getItem(`kurio-quote-review:${token}`)) {
        throw new Error('Confira e aceite os novos valores antes de comprar.')
      }
      let attempt = readCheckoutAttempt(user.id)
      if (attempt && orderFingerprint(attempt.input) !== orderFingerprint(input)) {
        throw new Error('Recupere a tentativa anterior antes de iniciar outra compra.')
      }
      attempt ??= { key: crypto.randomUUID(), input }
      // A lost response must retain this exact request and key after refresh.
      saveCheckoutAttempt(user.id, attempt)
      try {
        return (
          await api.post<Order>('/orders', input, {
            timeout: 3000,
            headers: { 'Idempotency-Key': attempt.key },
          })
        ).data
      } catch (error) {
        const code = getApiError(error).code
        if (
          [
            'VALIDATION_ERROR',
            'QUOTE_CHANGED',
            'EDITION_UNAVAILABLE',
            'WALLET_DISCONNECTED',
            'EMPTY_CART',
          ].includes(code)
        ) {
          saveCheckoutAttempt(user.id, null)
        }
        throw error
      }
    },
    onSuccess: async (order) => {
      if (!user || token !== readSessionToken()) return
      await client.cancelQueries({ queryKey: ['private', user.id, 'cart'] })
      if (token !== readSessionToken()) return
      await client.invalidateQueries({ queryKey: ['private', user.id, 'cart'] })
      if (token !== readSessionToken()) return
      await navigate({ to: '/checkout', search: { order: order.id } })
      saveCheckoutAttempt(user.id, null)
    },
    retry: false,
  })
}
