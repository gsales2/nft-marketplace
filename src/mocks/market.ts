import type { Database } from './database'
import { catalogItems } from '../lib/catalogData'
export interface MarketOverride {
  price: string
  availability: Record<string, number>
  version: number
}
export const defaultAvailability = { '1/1': 1, '1/10': 10, '1/50': 50, ABERTA: 99 }
export function marketNFTs(db: Database) {
  return catalogItems.map((nft) => ({
    ...nft,
    price: Number(db.market[nft.id]?.price ?? nft.price),
    version: db.market[nft.id]?.version ?? 0,
    availability: db.market[nft.id]?.availability ?? defaultAvailability,
  }))
}
export function marketPrice(db: Database, id: string, fallback: number) {
  return db.market[id]?.price ?? fallback.toFixed(2)
}
