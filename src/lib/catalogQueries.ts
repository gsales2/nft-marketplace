import { queryOptions } from '@tanstack/react-query'
import { api } from './api'
import {
  nftView,
  type NFTTransport,
  type CatalogSearch,
  type CatalogResponse,
} from './catalogContracts'

export const nftOptions = (id: string) =>
  queryOptions({
    queryKey: ['nfts', id],
    queryFn: async ({ signal }) =>
      (await api.get<NFTTransport>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
    staleTime: 30_000,
    retry: false,
  })

export const catalogOptions = (search: CatalogSearch, limit: number, userId?: string) =>
  queryOptions({
    queryKey: search.favorites
      ? ['private', userId, 'catalog', search, limit]
      : ['catalog', search, limit],
    queryFn: async ({ signal }) => {
      const response = (
        await api.get<CatalogResponse>('/nfts', { params: { ...search, limit }, signal })
      ).data
      return { ...response, items: response.items.map(nftView) }
    },
    staleTime: 30_000,
    retry: false,
  })
