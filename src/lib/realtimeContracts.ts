export interface NFTUpdate {
  eventId: string
  nftId: string
  version: number
}
export interface OrderUpdate {
  eventId: string
  orderId: string
  userId: string
  version: number
  status: 'pending' | 'confirmed' | 'refused'
}
export const realtimeNoticeEvent = 'kurio:realtime-notice'
