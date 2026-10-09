import { transaction } from './database'
import type { Order } from '../lib/orderContracts'
import type { NFTUpdate, OrderUpdate } from '../lib/realtimeContracts'

interface Subscriber {
  nft: (event: NFTUpdate) => void
  order: (event: OrderUpdate, validTokens: string[]) => void
}
const subscribers = new Set<Subscriber>()

// Server-side publishers stay independent of the Socket.IO transport bundle.
export function subscribeMockEvents(subscriber: Subscriber) {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}
export function emitNFT(event: NFTUpdate) {
  for (const subscriber of subscribers) subscriber.nft(event)
}
export async function publishOrder(order: Order) {
  const event: OrderUpdate = {
    eventId: `${order.id}:${order.version}`,
    orderId: order.id,
    userId: order.userId,
    version: order.version,
    status: order.status,
  }
  const tokens = await transaction((db) =>
    db.sessions
      .filter((session) => session.userId === order.userId && session.expiresAt > Date.now())
      .map((session) => session.token),
  )
  for (const subscriber of subscribers) subscriber.order(event, tokens)
}
