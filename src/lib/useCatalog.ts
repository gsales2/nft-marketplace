import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { nftView, type NFTTransport, type CatalogSearch } from './catalogContracts'
import { useAuth } from './auth'
import { catalogOptions, nftOptions } from './catalogQueries'
export { nftOptions } from './catalogQueries'
export function useNFT(id: string) {
  return useQuery(nftOptions(id))
}
export function useCatalog(search: CatalogSearch, limit: number) {
  const { user, isPending } = useAuth()
  return useQuery({
    ...catalogOptions(search, limit, user?.id),
    enabled: !search.favorites || !isPending,
  })
}

export function useRelatedNFTs(id: string) {
  return useQuery({
    queryKey: ['nfts', id, 'related'],
    queryFn: async ({ signal }) =>
      (
        await api.get<NFTTransport[]>(`/nfts/${encodeURIComponent(id)}/related`, { signal })
      ).data.map(nftView),
    staleTime: 30000,
    retry: false,
  })
}
