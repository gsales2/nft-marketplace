import { queryClient } from '../lib/queryClient'
import { nftOptions } from '../lib/catalogQueries'
import { Skeleton } from '../components/ui/Skeleton'
import { createFileRoute } from '@tanstack/react-router'
import { useNFT } from '../lib/useCatalog'
import { nftView } from '../lib/catalogContracts'
import { getApiError } from '../lib/api'
import { NFTDetailsPage } from '../components/nft/NFTDetailsPage'
import { Button } from '../components/ui/Button'
export const Route = createFileRoute('/nft/$nftId')({
  loader: ({ params }) => {
    void queryClient.prefetchQuery(nftOptions(params.nftId))
  },
  component: NFTPage,
})
function NFTPage() {
  const { nftId } = Route.useParams()
  const query = useNFT(nftId)
  if (query.isPending)
    return (
      <main
        id="page-content"
        tabIndex={-1}
        aria-label="Carregando NFT"
        role="status"
        className="mx-auto grid max-w-[1200px] gap-8 px-7 py-16 md:grid-cols-2"
      >
        <span className="sr-only">Carregando NFT…</span>
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((value) => (
            <Skeleton key={value} className="h-16" />
          ))}
        </div>
      </main>
    )
  if (query.isError) {
    const error = getApiError(query.error)
    return (
      <main id="page-content" tabIndex={-1} className="mx-auto max-w-[1200px] px-6 py-20">
        <h1 className="text-2xl font-bold">
          {error.code === 'NOT_FOUND' ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}
        </h1>
        <p role="alert" className="mt-4">
          {error.message}
        </p>
        {error.code !== 'NOT_FOUND' && (
          <Button onClick={() => void query.refetch()} className="mt-4">
            Tentar novamente
          </Button>
        )}
        <a href="/" className="mt-6 block text-catalog-accent underline">
          Voltar ao mercado
        </a>
      </main>
    )
  }
  return <NFTDetailsPage key={nftId} nft={nftView(query.data)} />
}
