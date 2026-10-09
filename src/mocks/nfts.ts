import { defaultLatency } from './scenarios'
import { marketNFTs, marketPrice } from './market'
import type { Database } from './database'
import { http, HttpResponse, delay } from 'msw'
import { parseCatalogSearch, type NFTTransport } from '../lib/catalogContracts'
import { transaction } from './database'
const transport = (nft: ReturnType<typeof marketNFTs>[number], db: Database): NFTTransport => ({
  ...nft,
  price: marketPrice(db, nft.id, nft.price),
  previousPrice: nft.previousPrice?.toFixed(2),
  version: nft.version,
  editions: Object.entries(nft.availability).map(([name, available]) => ({ name, available })),
})
async function network(q = '') {
  const scenario = localStorage.getItem('kurio-mock-scenario') ?? import.meta.env.VITE_MOCK_SCENARIO
  await delay(
    scenario === 'slow'
      ? 1500
      : scenario === 'out-of-order'
        ? q.length < 5
          ? 1200
          : 100
        : defaultLatency,
  )
  if (scenario === 'network-error') return HttpResponse.error()
  if (scenario === 'server-error')
    return HttpResponse.json(
      {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Não foi possível carregar os NFTs. Tente novamente.',
      },
      { status: 503 },
    )
}
export const nftHandlers = [
  http.get('/api/nfts/:id/related', async ({ params }) => {
    const failure = await network()
    if (failure) return failure
    return transaction((db) => {
      const catalogItems = marketNFTs(db)
      const nft = catalogItems.find((item) => item.id === params.id)
      if (!nft)
        return HttpResponse.json(
          { code: 'NOT_FOUND', message: 'NFT não encontrado.' },
          { status: 404 },
        )
      const related = catalogItems.filter(
        (item) => item.collection === nft.collection && item.id !== nft.id && item.name,
      )
      const initial = related.filter((item) =>
        ['cosmic', 'violet', 'ivory', 'beat', 'signal'].includes(item.id),
      )
      return HttpResponse.json(
        [...initial, ...related.filter((item) => !initial.includes(item))]
          .slice(0, 15)
          .map((item) => transport(item, db)),
      )
    })
  }),
  http.get('/api/nfts', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const search = parseCatalogSearch(Object.fromEntries(params))
    const failure = await network(search.q)
    if (failure) return failure
    const limit = Math.min(50, Math.max(1, Number(params.get('limit')) || 9))
    return transaction((db) => {
      let favorites: string[] | undefined
      if (search.favorites) {
        const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
        const session = db.sessions.find(
          (item) => item.token === token && item.expiresAt > Date.now(),
        )
        const user = db.users.find((item) => item.id === session?.userId)
        if (!user)
          return HttpResponse.json(
            { code: 'SESSION_EXPIRED', message: 'Entre novamente para acessar seus favoritos.' },
            { status: 401 },
          )
        favorites = user.favorites
      }
      const scenario = localStorage.getItem('kurio-mock-scenario')
      const catalogItems = marketNFTs(db)
      const items =
        scenario === 'empty-catalog'
          ? []
          : catalogItems.filter(
              (nft) =>
                nft.price <= search.max &&
                (favorites ? favorites.includes(nft.id) : nft.collection === search.collection) &&
                (!search.network || nft.network === search.network) &&
                (nft.name ?? 'Obra digital')
                  .toLocaleLowerCase('pt-BR')
                  .includes(search.q.toLocaleLowerCase('pt-BR')) &&
                (search.tab !== 'new' || nft.recent) &&
                (search.tab !== 'popular' || nft.popularity >= 50),
            )
      if (search.tab === 'popular') items.sort((a, b) => b.popularity - a.popularity)
      if (search.sort === 'lowest') items.sort((a, b) => a.price - b.price)
      if (search.sort === 'highest') items.sort((a, b) => b.price - a.price)
      if (limit === 4 && search.sort === 'recent' && search.tab === 'all') {
        const index = items.findIndex((nft) => nft.id === 'beat')
        if (index > 3) items.splice(3, 0, items.splice(index, 1)[0])
      }
      const pageCount = Math.max(1, Math.ceil(items.length / limit)),
        page = Math.min(search.page, pageCount)
      return HttpResponse.json({
        items: items.slice((page - 1) * limit, page * limit).map((nft) => transport(nft, db)),
        total: items.length,
        page,
        pageCount,
        collections: [...new Set(catalogItems.map((item) => item.collection))].map((name) => [
          name,
          catalogItems.filter((item) => item.collection === name).length,
        ]),
        networks: ['Ethereum', 'Polygon', 'Solana'].map((name) => [
          name,
          catalogItems.filter((item) => item.network === name).length,
        ]),
      })
    })
  }),
  http.get('/api/nfts/:id', async ({ params }) => {
    const failure = await network()
    if (failure) return failure
    return transaction((db) => {
      const catalogItems = marketNFTs(db)
      const nft = catalogItems.find((item) => item.id === params.id)
      return nft
        ? HttpResponse.json(transport(nft, db))
        : HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado.' }, { status: 404 })
    })
  }),
]
