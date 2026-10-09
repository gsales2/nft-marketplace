import { io } from 'socket.io-client'
import { queryClient } from './queryClient'
import { guestCartId, readSessionToken } from './api'
import { realtimeNoticeEvent, type NFTUpdate, type OrderUpdate } from './realtimeContracts'
import type { Cart } from './cartContracts'
const versionsByOwner = new Map<string, Map<string, number>>()
export function connectRealtime(userId?: string) {
  const token = readSessionToken()
  const socket = io(import.meta.env.VITE_SOCKET_URL ?? window.location.origin, {
    transports: ['websocket'],
    reconnectionDelay: 500,
    reconnectionDelayMax: 2000,
    randomizationFactor: 0,
    auth: { token },
    autoConnect: false,
  })
  const owner = token ?? guestCartId()
  const versions = versionsByOwner.get(owner) ?? new Map<string, number>()
  versionsByOwner.set(owner, versions)
  let disposed = false
  let connectedBefore = false
  const current = () => !disposed && token === readSessionToken()
  const refresh = async () => {
    if (!current()) return
    const cartKey = userId ? ['private', userId, 'cart'] : ['cart', guestCartId()]
    const previousCart = queryClient.getQueryData<Cart>(cartKey)
    await queryClient.cancelQueries({ queryKey: ['catalog'] })
    await queryClient.cancelQueries({ queryKey: ['nfts'] })
    if (!current()) return
    void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    await queryClient.invalidateQueries({
      queryKey: userId ? ['private', userId] : ['cart', guestCartId()],
    })
    if (!current()) return
    const nextCart = queryClient.getQueryData<Cart>(cartKey)
    if (
      previousCart?.items.some((before) =>
        nextCart?.items.some(
          (after) =>
            before.id === after.id &&
            (before.unitPrice !== after.unitPrice || before.maximum !== after.maximum),
        ),
      )
    ) {
      sessionStorage.setItem(`kurio-quote-review:${owner}`, 'required')
      window.dispatchEvent(
        new CustomEvent(realtimeNoticeEvent, {
          detail: { message: 'Confira os valores atualizados do carrinho antes de comprar.' },
        }),
      )
    }
  }
  socket.on('connect', () => {
    if (current()) socket.emit('session.subscribe', token ?? '')
  })
  socket.on('session.ready', (session: { userId: string | null }) => {
    if (!current() || session.userId !== (userId ?? null)) return
    // Initial REST requests already load the current state. Cancelling them here
    // duplicates the first load. Reconnection reconciles events missed offline.
    if (connectedBefore) void refresh()
    connectedBefore = true
    window.dispatchEvent(
      new CustomEvent(realtimeNoticeEvent, { detail: { connection: 'connected' } }),
    )
  })
  socket.on('disconnect', () => {
    if (current())
      window.dispatchEvent(
        new CustomEvent(realtimeNoticeEvent, { detail: { connection: 'disconnected' } }),
      )
  })
  socket.on('nft.updated', (event: NFTUpdate) => {
    const cachedVersion =
      queryClient.getQueryData<{ version: number }>(['nfts', event.nftId])?.version ?? 0
    if (
      !current() ||
      !Number.isSafeInteger(event.version) ||
      event.version <= Math.max(cachedVersion, versions.get(`nft:${event.nftId}`) ?? 0)
    )
      return
    versions.set(`nft:${event.nftId}`, event.version)
    const cart = queryClient.getQueryData<Cart>(
      userId ? ['private', userId, 'cart'] : ['cart', guestCartId()],
    )
    if (cart?.items.some((item) => item.nftId === event.nftId)) {
      sessionStorage.setItem(`kurio-quote-review:${token ?? guestCartId()}`, 'required')
      window.dispatchEvent(
        new CustomEvent(realtimeNoticeEvent, {
          detail: {
            message:
              'Preço ou disponibilidade de um NFT do carrinho mudou. Confira os valores atualizados antes de comprar.',
            review: true,
          },
        }),
      )
    }
    refresh()
  })
  socket.on('order.updated', (event: OrderUpdate) => {
    const cachedVersion =
      queryClient.getQueryData<{ version: number }>(['private', userId, 'order', event.orderId])
        ?.version ?? 0
    if (
      !current() ||
      event.userId !== userId ||
      !Number.isSafeInteger(event.version) ||
      event.version <= Math.max(cachedVersion, versions.get(`order:${event.orderId}`) ?? 0)
    )
      return
    versions.set(`order:${event.orderId}`, event.version)
    void queryClient.invalidateQueries({ queryKey: ['private', userId, 'order', event.orderId] })
    void queryClient.invalidateQueries({ queryKey: ['private', userId, 'orders'] })
    void queryClient.invalidateQueries({ queryKey: ['private', userId, 'cart'] })
  })
  socket.connect()
  return () => {
    disposed = true
    socket.removeAllListeners()
    socket.disconnect()
  }
}
