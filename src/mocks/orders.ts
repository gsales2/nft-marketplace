import { defaultLatency } from './scenarios'
import { http, HttpResponse, delay } from 'msw'
import { transaction, type Database } from './database'
import { emitNFT, publishOrder } from './events'
import { checkoutError, validateCollector, validateQuote } from './checkout'
import { currentScenario } from './scenarios'
import { marketPrice, defaultAvailability } from './market'
import { catalogItems } from '../lib/catalogData'
import { ethString, ethUnits } from '../lib/cartContracts'
import { orderFingerprint, type OrderInput } from '../lib/checkoutContracts'
import type { Order } from '../lib/orderContracts'

export async function settleOrder(
  id: string,
  status: 'confirmed' | 'refused',
): Promise<Order | undefined> {
  const order = await transaction((db) => {
    const found = db.orders.find((item) => item.id === id)
    if (!found || found.status !== 'pending') return found
    found.status = status
    found.version++
    if (status === 'confirmed') {
      const cart = db.carts[`user:${found.userId}`]
      if (cart) {
        for (const purchased of found.cart.items) {
          const line = cart.items.find(
            (item) => item.nftId === purchased.nftId && item.edition === purchased.edition,
          )
          if (line) line.quantity = Math.max(0, line.quantity - purchased.quantity)
        }
        cart.items = cart.items.filter((item) => item.quantity > 0)
        if (!cart.items.length) cart.coupon = null
      }
    }
    return found
  })
  if (order) await publishOrder(order)
  return order
}

async function recoverOrder(order: Order) {
  if (order.status === 'pending' && order.settleAt && order.settleAt <= Date.now()) {
    return (await settleOrder(order.id, order.resolution ?? 'confirmed')) ?? order
  }
  return order
}

function scheduleSettlement(order: Order) {
  if (order.status !== 'pending' || !order.settleAt) return
  setTimeout(
    () => {
      void settleOrder(order.id, order.resolution ?? 'confirmed')
    },
    Math.max(0, order.settleAt - Date.now()),
  )
}

function activeSession(db: Database, request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  return db.sessions.find((item) => item.token === token && item.expiresAt > Date.now())
}
const sessionError = () =>
  checkoutError('Sua sessão expirou. Entre novamente.', 'SESSION_EXPIRED', 401)

// This deterministic conflict happens only on order submission, after the review.
function applyMarketConflict(db: Database, userId: string, scenario: string) {
  if (!['price-changed', 'edition-sold-out'].includes(scenario)) return
  const line = db.carts[`user:${userId}`]?.items[0]
  const effect = `${scenario}:${userId}`
  if (!line || db.effects?.includes(effect)) return
  const effects = (db.effects ??= [])
  effects.push(effect)
  const previous = db.market[line.nftId] ?? {
    price: marketPrice(db, line.nftId, catalogItems.find((item) => item.id === line.nftId)!.price),
    availability: { ...defaultAvailability },
    version: 0,
  }
  const next = {
    price:
      scenario === 'price-changed'
        ? ethString(ethUnits(previous.price) + ethUnits('0.10'))
        : previous.price,
    availability:
      scenario === 'edition-sold-out'
        ? { ...previous.availability, [line.edition]: 0 }
        : previous.availability,
    version: previous.version + 1,
  }
  db.market[line.nftId] = next
  emitNFT({ eventId: `${line.nftId}:${next.version}`, nftId: line.nftId, version: next.version })
}

async function networkFailure() {
  const scenario = currentScenario()
  await delay(scenario === 'slow' ? 1500 : defaultLatency)
  if (scenario === 'network-error') return HttpResponse.error()
  if (scenario === 'server-error')
    return checkoutError(
      'Não foi possível consultar a compra. Tente novamente.',
      'SERVICE_UNAVAILABLE',
      503,
    )
}

export const orderHandlers = [
  http.get('/api/orders', async ({ request }) => {
    const failure = await networkFailure()
    if (failure) return failure
    const result = await transaction((db) => {
      const session = activeSession(db, request)
      return session
        ? db.orders.filter((order) => order.userId === session.userId).reverse()
        : sessionError()
    })
    if (result instanceof Response) return result
    return HttpResponse.json(await Promise.all(result.map(recoverOrder)))
  }),
  http.get('/api/orders/attempts/:key', async ({ request, params }) => {
    const failure = await networkFailure()
    if (failure) return failure
    const result = await transaction((db) => {
      const session = activeSession(db, request)
      if (!session) return sessionError()
      return (
        db.orders.find((order) => order.userId === session.userId && order.key === params.key) ??
        checkoutError('Esta tentativa ainda não criou um pedido.', 'NOT_FOUND', 404)
      )
    })
    return result instanceof Response ? result : HttpResponse.json(await recoverOrder(result))
  }),
  http.get('/api/orders/:id', async ({ request, params }) => {
    const failure = await networkFailure()
    if (failure) return failure
    const result = await transaction((db) => {
      const session = activeSession(db, request)
      if (!session) return sessionError()
      return (
        db.orders.find((order) => order.id === params.id && order.userId === session.userId) ??
        checkoutError('Compra não encontrada.', 'NOT_FOUND', 404)
      )
    })
    if (result instanceof Response) return result
    const order = await recoverOrder(result)
    scheduleSettlement(order)
    return HttpResponse.json(order)
  }),
  http.post('/api/orders', async ({ request }) => {
    const failure = await networkFailure()
    if (failure) return failure
    const input = (await request.json()) as OrderInput
    const scenario = currentScenario()
    let created = false
    const result = await transaction((db) => {
      const session = activeSession(db, request)
      if (!session) return sessionError()
      const key = request.headers.get('Idempotency-Key')
      if (
        !key ||
        key.length > 100 ||
        typeof input.walletId !== 'string' ||
        typeof input.expectedRevision !== 'string' ||
        !/^\d+\.\d{1,18}$/.test(input.expectedTotal ?? '')
      ) {
        return checkoutError('Dados da tentativa de compra inválidos.', 'VALIDATION_ERROR')
      }
      const fingerprint = orderFingerprint(input)
      const previous = db.orders.find(
        (order) => order.key === key && order.userId === session.userId,
      )
      if (previous) {
        return previous.requestFingerprint === fingerprint
          ? previous
          : checkoutError(
              'Esta chave já foi utilizada com dados diferentes.',
              'IDEMPOTENCY_CONFLICT',
              409,
            )
      }
      const validation = validateCollector(input.collector)
      if (validation) return validation
      if (
        db.orders.some((order) => order.userId === session.userId && order.status === 'pending')
      ) {
        return checkoutError(
          'Você já tem uma compra pendente. Consulte Atividade para acompanhar.',
          'PENDING_ORDER',
          409,
        )
      }
      applyMarketConflict(db, session.userId, scenario)
      const review = validateQuote(db, session.userId, input.walletId)
      if (review instanceof Response) return review
      if (
        review.cart.total !== input.expectedTotal ||
        review.cart.revision !== input.expectedRevision
      ) {
        return checkoutError(
          'A cotação mudou. Revise os novos valores antes de confirmar novamente.',
          'QUOTE_CHANGED',
          409,
        )
      }
      const order: Order = {
        id: crypto.randomUUID(),
        userId: session.userId,
        key,
        requestFingerprint: fingerprint,
        status: 'pending',
        version: 1,
        settleAt: scenario === 'pending-order' ? null : Date.now() + 1000,
        resolution: scenario === 'payment-refused' ? 'refused' : 'confirmed',
        transactionId: `0x${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`,
        createdAt: new Date().toISOString(),
        wallet: review.wallet,
        cart: review.cart,
        collector: input.collector ? { ...input.collector } : undefined,
      }
      db.orders.push(order)
      created = true
      return order
    })
    if (result instanceof Response) return result
    const order = await recoverOrder(result)
    scheduleSettlement(order)
    if (created && scenario === 'timeout-after-order') await delay(4500)
    return HttpResponse.json(order, { status: created ? 201 : 200 })
  }),
]
