import { defaultLatency } from './scenarios'
import { http, HttpResponse, delay } from 'msw'
import type { CollectorDetails } from '../lib/checkoutContracts'
import { transaction, type Database } from './database'
import { quote } from './cart'
import { currentScenario } from './scenarios'

export function checkoutError(message: string, code: string, status = 422) {
  return HttpResponse.json({ code, message }, { status })
}

export function validateCollector(collector: CollectorDetails | undefined) {
  if (!collector) return null // Mobile uses the saved account and wallet details.
  const validText = (value: unknown, limit = 120) =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= limit
  if (
    !validText(collector.displayName) ||
    !validText(collector.username) ||
    !validText(collector.profileName) ||
    !validText(collector.referralCode) ||
    !validText(collector.email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collector.email) ||
    typeof collector.notes !== 'string' ||
    collector.notes.length > 1000
  ) {
    return checkoutError('Verifique os dados do colecionador antes de comprar.', 'VALIDATION_ERROR')
  }
  return null
}

export function validateQuote(db: Database, userId: string, walletId: string) {
  const cart = db.carts[`user:${userId}`]
  if (!cart?.items.length) return checkoutError('Seu carrinho está vazio.', 'EMPTY_CART')
  const wallets = db.wallets[userId]
  const wallet = wallets?.items.find((item) => item.id === walletId)
  if (!wallet || wallets.connectedId !== walletId) {
    return checkoutError(
      'Conecte a carteira selecionada antes de comprar.',
      'WALLET_DISCONNECTED',
      409,
    )
  }
  const snapshot = quote(cart, db)
  if (snapshot.items.some((item) => item.quantity > item.maximum)) {
    return checkoutError(
      'Uma edição ficou indisponível. Revise seu carrinho.',
      'EDITION_UNAVAILABLE',
      409,
    )
  }
  if (snapshot.coupon && currentScenario() === 'coupon-expired') {
    return checkoutError('Este cupom expirou. Remova-o para continuar.', 'QUOTE_CHANGED', 409)
  }
  return { cart: snapshot, wallet: { ...wallet } }
}

export const quoteHandlers = [
  http.post('/api/quote', async ({ request }) => {
    const scenario = currentScenario()
    await delay(scenario === 'slow' ? 1500 : defaultLatency)
    if (scenario === 'network-error') return HttpResponse.error()
    if (scenario === 'server-error')
      return checkoutError(
        'Não foi possível revisar a compra. Tente novamente.',
        'SERVICE_UNAVAILABLE',
        503,
      )
    const { walletId } = (await request.json()) as { walletId?: string }
    return transaction((db) => {
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
      const session = db.sessions.find(
        (item) => item.token === token && item.expiresAt > Date.now(),
      )
      if (!session)
        return checkoutError('Sua sessão expirou. Entre novamente.', 'SESSION_EXPIRED', 401)
      const result = validateQuote(db, session.userId, walletId ?? '')
      return result instanceof Response ? result : HttpResponse.json(result)
    })
  }),
]
