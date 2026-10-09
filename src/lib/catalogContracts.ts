import { collections, networks, type CatalogNFT } from './catalogData'
export interface CatalogSearch {
  q: string
  collection: string
  network: string
  max: number
  sort: 'recent' | 'lowest' | 'highest'
  tab: 'all' | 'new' | 'popular'
  page: number
  favorites: boolean
}
export const catalogDefaults: CatalogSearch = {
  q: '',
  collection: 'Arte digital',
  network: '',
  max: 12.3,
  sort: 'recent',
  tab: 'all',
  page: 1,
  favorites: false,
}
export function parseCatalogSearch(input: Record<string, unknown>): CatalogSearch {
  const max = Number(input.max ?? 12.3),
    page = Number(input.page ?? 1)
  return {
    q: typeof input.q === 'string' ? input.q.slice(0, 120) : '',
    collection: collections.some(([name]) => name === input.collection)
      ? String(input.collection)
      : 'Arte digital',
    network: networks.includes(input.network as (typeof networks)[number])
      ? String(input.network)
      : '',
    max: Number.isFinite(max) ? Math.min(12.3, Math.max(0.02, max)) : 12.3,
    sort: input.sort === 'lowest' || input.sort === 'highest' ? input.sort : 'recent',
    tab: input.tab === 'new' || input.tab === 'popular' ? input.tab : 'all',
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1,
    favorites: input.favorites === true || input.favorites === 'true',
  }
}
export type NFTTransport = Omit<CatalogNFT, 'price' | 'previousPrice'> & {
  version: number
  price: string
  previousPrice?: string
  editions: { name: string; available: number }[]
}
export interface CatalogResponse {
  items: NFTTransport[]
  total: number
  page: number
  pageCount: number
  collections: [string, number][]
  networks: [string, number][]
}
export const nftView = (nft: NFTTransport): CatalogNFT & Pick<NFTTransport, 'editions'> => ({
  ...nft,
  displayPrice: nft.price,
  displayPreviousPrice: nft.previousPrice,
  price: Number(nft.price),
  previousPrice: nft.previousPrice === undefined ? undefined : Number(nft.previousPrice),
})
