import { ws, http, HttpResponse } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { transaction } from './database'
import { catalogItems } from '../lib/catalogData'
import { defaultAvailability } from './market'
import { settleOrder } from './orders'
import { emitNFT, subscribeMockEvents } from './events'
// MSW normalizes Socket.IO's transport path to the server root.
const endpoint = ws.link(`${window.location.origin}/`)
type Peer = { io: ReturnType<typeof toSocketIo>; token: string; userId: string | null }
const peers = new Set<Peer>()
subscribeMockEvents({
  nft: (event) => {
    for (const peer of peers) peer.io.client.emit('nft.updated', event)
  },
  order: (event, tokens) => {
    for (const peer of peers)
      if (peer.userId === event.userId && tokens.includes(peer.token))
        peer.io.client.emit('order.updated', event)
  },
})
export const realtimeHandlers = [
  endpoint.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const peer: Peer = { io, token: '', userId: null }
    peers.add(peer)
    const heartbeat = setInterval(() => connection.client.send('2'), 10000)
    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      peers.delete(peer)
    })
    io.client.on('session.subscribe', async (_event, token: string) => {
      peer.token = typeof token === 'string' ? token : ''
      peer.userId = await transaction(
        (db) =>
          db.sessions.find(
            (session) => session.token === peer.token && session.expiresAt > Date.now(),
          )?.userId ?? null,
      )
      io.client.emit('session.ready', { userId: peer.userId })
    })
  }),
  http.post('/api/mock/realtime', async ({ request }) => {
    const body = (await request.json()) as {
      action: string
      nftId?: string
      price?: string
      edition?: string
      available?: number
      version?: number
      orderId?: string
      status?: 'confirmed' | 'refused'
    }
    if (body.action === 'disconnect') {
      for (const peer of peers) peer.io.rawClient.close(1012, 'Simulated network interruption')
      return HttpResponse.json({ ok: true })
    }
    if (body.action === 'nft') {
      if (
        (body.version !== undefined && (!Number.isSafeInteger(body.version) || body.version < 1)) ||
        (body.edition !== undefined && !(body.edition in defaultAvailability))
      )
        return HttpResponse.json({ message: 'Versão ou edição inválida.' }, { status: 422 })
      if (
        !catalogItems.some((nft) => nft.id === body.nftId) ||
        (body.price !== undefined && !/^\d+\.\d{1,18}$/.test(body.price)) ||
        (body.available !== undefined &&
          (!Number.isInteger(body.available) || body.available < 0 || body.available > 99))
      )
        return HttpResponse.json({ message: 'Atualização inválida.' }, { status: 422 })
      const event = await transaction((db) => {
        const nft = catalogItems.find((nft) => nft.id === body.nftId)!
        const previous = db.market[nft.id] ?? {
          price: nft.price.toFixed(2),
          availability: { ...defaultAvailability },
          version: 0,
        }
        const version = body.version ?? previous.version + 1
        if (version > previous.version)
          db.market[nft.id] = {
            price: body.price ?? previous.price,
            availability:
              body.edition && body.available !== undefined
                ? { ...previous.availability, [body.edition]: body.available }
                : previous.availability,
            version,
          }
        return { eventId: `${nft.id}:${version}`, nftId: nft.id, version }
      })
      emitNFT(event)
      return HttpResponse.json(event)
    }
    if (body.action === 'order' && ['confirmed', 'refused'].includes(body.status ?? '')) {
      const order = await settleOrder(body.orderId ?? '', body.status!)
      return order
        ? HttpResponse.json(order)
        : HttpResponse.json({ message: 'Pedido não encontrado.' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'Ação inválida.' }, { status: 422 })
  }),
]
