import { defaultLatency } from './scenarios'
import { marketNFTs, marketPrice } from './market'
import { http, HttpResponse, delay } from 'msw'
import { transaction, type Database } from './database'
import { catalogItems } from '../lib/catalogData'
import { ethString, ethUnits, type Cart, type CartInput } from '../lib/cartContracts'

export interface StoredCart {
  items: CartInput[]
  coupon: string | null
}
const empty = (): StoredCart => ({ items: [], coupon: null })
const maximum = (edition: string) => (edition === 'ABERTA' ? 99 : Number(edition.split('/')[1]))
const guest = (request: Request) => `guest:${request.headers.get('X-Guest-Cart') ?? 'invalid'}`
const fail = (message: string, status = 422) =>
  HttpResponse.json({ code: 'CART_ERROR', message }, { status })
export function mergeGuestCart(db: Database, request: Request, userId: string) {
  const key = guest(request),
    source = db.carts[key]
  if (!source) return
  const target = (db.carts[`user:${userId}`] ??= empty())
  for (const item of source.items) {
    const existing = target.items.find(
      (line) => line.nftId === item.nftId && line.edition === item.edition,
    )
    if (existing)
      existing.quantity = Math.min(maximum(item.edition), existing.quantity + item.quantity)
    else target.items.push(item)
  }
  target.coupon ??= source.coupon
  delete db.carts[key]
}
export function quote(cart: StoredCart, db: Database): Cart {
  const items = cart.items.flatMap((line) => {
    const nft = marketNFTs(db).find((nft) => nft.id === line.nftId)
    if (!nft) return []
    const unitPrice = marketPrice(db, nft.id, nft.price)
    return [
      {
        ...line,
        id: `${line.nftId}:${line.edition}`,
        name: nft.name ?? 'Obra digital',
        image: nft.image,
        maximum: nft.availability[line.edition] ?? 0,
        unitPrice,
        total: ethString(ethUnits(unitPrice) * BigInt(line.quantity)),
      },
    ]
  })
  const subtotal = items.reduce((sum, item) => sum + ethUnits(item.total), 0n)
  const discount = cart.coupon === 'KURIO10' ? subtotal / 10n : 0n
  const fee = items.length ? ethUnits('0.016') : 0n
  return {
    revision: JSON.stringify({
      items: items.map((item) => [item.id, item.quantity, item.unitPrice, item.maximum]),
      coupon: cart.coupon,
      fee: '0.016',
    }),
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: ethString(subtotal),
    discount: ethString(discount),
    networkFee: ethString(fee),
    total: ethString(subtotal - discount + fee),
    coupon: cart.coupon,
  }
}
export const cartHandlers = (['get', 'post', 'patch', 'delete', 'put'] as const).map((method) =>
  http[method]('/api/cart', async ({ request }) => {
    const scenario =
      localStorage.getItem('kurio-mock-scenario') ?? import.meta.env.VITE_MOCK_SCENARIO
    await delay(scenario === 'slow' ? 1500 : defaultLatency)
    if (scenario === 'network-error') return HttpResponse.error()
    if (scenario === 'server-error')
      return fail('Não foi possível atualizar o carrinho. Tente novamente.', 503)
    const body =
      method === 'get'
        ? {}
        : ((await request.json()) as Partial<CartInput> & { id?: string; coupon?: string })
    return transaction((db) => {
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
      const session = db.sessions.find(
        (session) => session.token === token && session.expiresAt > Date.now(),
      )
      if (token && !session)
        return HttpResponse.json(
          { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou. Entre novamente.' },
          { status: 401 },
        )
      const cart = (db.carts[session ? `user:${session.userId}` : guest(request)] ??= empty())
      if (method === 'post') {
        if (
          !catalogItems.some((nft) => nft.id === body.nftId) ||
          !['1/1', '1/10', '1/50', 'ABERTA'].includes(body.edition ?? '') ||
          !Number.isInteger(body.quantity) ||
          (body.quantity ?? 0) < 1
        )
          return fail('NFT, edição ou quantidade inválidos.')
        const existing = cart.items.find(
          (item) => item.nftId === body.nftId && item.edition === body.edition,
        )
        const quantity = (existing?.quantity ?? 0) + body.quantity!
        if (
          quantity >
          (marketNFTs(db).find((nft) => nft.id === body.nftId)?.availability[body.edition!] ?? 0)
        )
          return fail('Quantidade superior às edições disponíveis.')
        if (existing) existing.quantity = quantity
        else cart.items.push({ nftId: body.nftId!, edition: body.edition!, quantity })
      }
      if (method === 'patch' || method === 'delete') {
        const item = cart.items.find((line) => `${line.nftId}:${line.edition}` === body.id)
        if (!item) return fail('Item não encontrado no carrinho.', 404)
        if (method === 'delete') cart.items = cart.items.filter((line) => line !== item)
        else {
          if (
            !Number.isInteger(body.quantity) ||
            body.quantity! < 1 ||
            body.quantity! >
              (marketNFTs(db).find((nft) => nft.id === item.nftId)?.availability[item.edition] ?? 0)
          )
            return fail('Quantidade superior às edições disponíveis ou inválida.')
          item.quantity = body.quantity!
        }
      }
      if (method === 'put') {
        const coupon = body.coupon?.trim().toUpperCase() ?? ''
        if (coupon && coupon !== 'KURIO10')
          return fail(
            coupon === 'EXPIRADO' ? 'Este cupom expirou.' : 'Código promocional inválido.',
          )
        cart.coupon = coupon || null
      }
      return HttpResponse.json(quote(cart, db))
    })
  }),
)
