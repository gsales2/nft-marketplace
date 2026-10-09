import { Skeleton } from '../ui/Skeleton'
import { useNavigate } from '@tanstack/react-router'
import { Fragment } from 'react'
import { Container } from '../layout/Container'
import { NFTGrid } from '../nft/NFTGrid'
import type { NFT } from '../nft/NFTCard'
import { CollectionFilters } from './CollectionFilters'
import { FeaturedNFT } from './FeaturedNFT'
import { useCatalog } from '../../lib/useCatalog'
import { useCatalogSearch } from '../../lib/useCatalogSearch'
import { catalogDefaults } from '../../lib/catalogContracts'
import { getApiError } from '../../lib/api'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { HomeDialog } from '../ui/HomeDialog'

interface Props {
  filtersOpen: boolean
  onOpenFilters: () => void
  onCloseFilters: () => void
  favorites: string[]
  favoritesOnly: boolean
  onToggleFavorite: (id: string) => void
}

export function Catalog({
  filtersOpen,
  onOpenFilters,
  onCloseFilters,
  favorites,
  favoritesOnly,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate()
  const mobile = useMediaQuery('(max-width: 767px)')
  const showFeatured = useMediaQuery('(min-width: 1280px)')
  const pageSize = mobile ? 4 : 9
  const { search, update } = useCatalogSearch()
  const result = useCatalog(search, pageSize)
  const activeCollection = search.collection,
    network = search.network,
    maximum = search.max,
    sort = search.sort
  const tab =
    search.tab === 'new'
      ? 'Novos lançamentos'
      : search.tab === 'popular'
        ? 'Em alta'
        : 'Todos os NFTs'
  const clear = () => update(catalogDefaults)
  const pageCount = result.data?.pageCount ?? 1
  const currentPage = result.data?.page ?? search.page
  const visible = result.data?.items ?? []
  const paginationPages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (number) =>
      !mobile ||
      pageCount <= 7 ||
      number === 1 ||
      number === pageCount ||
      Math.abs(number - currentPage) <= 2,
  )
  const selectNFT = (nft: NFT) => {
    void navigate({ to: '/nft/$nftId', params: { nftId: nft.id } })
  }

  const filterPanel = (
    <CollectionFilters
      collectionCounts={result.data?.collections}
      networkCounts={result.data?.networks}
      key={`${maximum}:${activeCollection}:${network}`}
      initialMaximum={maximum}
      collection={activeCollection}
      network={network}
      onCollection={(value) => update({ collection: value })}
      onNetwork={(value) => update({ network: value })}
      onPrice={(value) => update({ max: value })}
    />
  )

  return (
    <section
      id="catalogo"
      className="mb-12 mt-4 scroll-mt-6 text-[#f5f1eb] md:mt-12 xl:mb-[96px] xl:mt-[96px]"
      aria-label="Catálogo de NFTs"
    >
      <Container>
        <h2 className="sr-only">Catálogo de NFTs</h2>
        <div className="flex items-start gap-[48px]">
          {showFeatured && (
            <aside className="hidden w-[310px] shrink-0 flex-col gap-6 xl:flex">
              {filterPanel}
              <FeaturedNFT
                onSelect={() => void navigate({ to: '/nft/$nftId', params: { nftId: 'sage' } })}
              />
            </aside>
          )}
          <div className="relative flex min-w-0 flex-1 flex-col gap-8 xl:w-[842px] xl:shrink-0 xl:flex-none xl:gap-[88px]">
            <div>
              <div className="relative flex flex-wrap items-start justify-between gap-y-4 text-[14px] leading-4 md:text-[15px] xl:h-[18px] xl:flex-nowrap">
                <div
                  className="flex max-w-full gap-4 overflow-x-auto font-medium max-[380px]:gap-2 max-[380px]:text-[12px] xl:gap-5 xl:overflow-visible"
                  aria-label="Categorias do catálogo"
                >
                  {['Todos os NFTs', 'Novos lançamentos', 'Em alta'].map((name) => (
                    <button
                      type="button"
                      key={name}
                      aria-pressed={tab === name}
                      onClick={() => {
                        update({
                          tab:
                            name === 'Novos lançamentos'
                              ? 'new'
                              : name === 'Em alta'
                                ? 'popular'
                                : 'all',
                        })
                      }}
                      className={`shrink-0 whitespace-nowrap border-b-2 pb-1 md:border-0 md:pb-0 ${tab === name ? 'border-catalog-accent text-catalog-accent' : 'border-transparent'}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <label className="relative hidden w-[300px] items-start md:flex">
                  <span className="w-[110px] shrink-0">Ordenar por:</span>
                  <select
                    aria-label="Ordenar NFTs"
                    value={sort}
                    onChange={(event) => {
                      update({ sort: event.target.value as typeof sort })
                    }}
                    className="w-[190px] appearance-none bg-background pr-3 text-[15px] leading-[18px]"
                  >
                    <option value="recent">Listados recentemente</option>
                    <option value="lowest">Menor preço</option>
                    <option value="highest">Maior preço</option>
                  </select>
                  <img
                    src="/images/catalog/imgArrowDown2.svg"
                    alt=""
                    className="pointer-events-none absolute right-[5px] top-[6px]"
                  />
                </label>
                <img
                  src="/images/catalog/imgLine3.svg"
                  alt=""
                  className="absolute top-[20px] hidden transition-all xl:top-[21px] md:block"
                  style={{
                    left: tab === 'Todos os NFTs' ? 0 : tab === 'Novos lançamentos' ? 138 : 312,
                  }}
                />
                <button
                  type="button"
                  onClick={onOpenFilters}
                  className="hidden rounded-md border border-border px-3 py-2 md:block xl:hidden"
                >
                  Filtros
                </button>
              </div>
              <div className="mt-[14px] md:mt-8 xl:min-h-[1200px]">
                {result.isPending ? (
                  <div
                    role="status"
                    aria-label="Carregando catálogo"
                    className="grid grid-cols-2 gap-6 md:grid-cols-3"
                  >
                    <span className="sr-only">Carregando NFTs…</span>
                    {Array.from({ length: pageSize }, (_, index) => (
                      <Skeleton key={index} className="aspect-[258/340] rounded-xl" />
                    ))}
                  </div>
                ) : result.isError ? (
                  <div role="alert">
                    <p>{getApiError(result.error).message}</p>
                    <button
                      type="button"
                      onClick={() => void result.refetch()}
                      className="mt-4 rounded bg-catalog-primary p-3 text-background"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : (
                  <NFTGrid
                    items={visible}
                    onSelect={selectNFT}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                  />
                )}
                {result.isFetching && !result.isPending && (
                  <p role="status" className="mt-3 text-sm text-catalog-muted">
                    Atualizando catálogo…
                  </p>
                )}
              </div>
              <div className="mt-12 flex flex-wrap gap-3 text-[12px] text-catalog-muted xl:absolute xl:bottom-[48px] xl:mt-0 xl:gap-4">
                <p role="status">
                  Catálogo demonstrativo · {result.data?.total ?? 0} resultados · Página{' '}
                  {currentPage} de {pageCount}
                  {favoritesOnly ? ' · Favoritos' : ''}
                </p>
                <button type="button" onClick={clear} className="text-catalog-accent underline">
                  Limpar filtros
                </button>
              </div>
            </div>
            <nav className="flex flex-wrap justify-end gap-2" aria-label="Paginação do catálogo">
              {paginationPages.map((number, index) => (
                <Fragment key={number}>
                  {index > 0 && number - paginationPages[index - 1] > 1 && (
                    <span className="flex items-center" aria-hidden="true">
                      …
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Página ${number}`}
                    aria-current={number === currentPage ? 'page' : undefined}
                    onClick={() => update({ page: number })}
                    className={`flex size-[35px] items-center justify-center rounded-[4px] text-[18px] leading-4 ${number === currentPage ? 'bg-catalog-primary font-bold text-background' : 'border border-catalog-border'}`}
                  >
                    {number}
                  </button>
                </Fragment>
              ))}
              <button
                type="button"
                aria-label="Próxima página"
                disabled={currentPage === pageCount}
                onClick={() => update({ page: currentPage + 1 })}
                className="flex size-[35px] items-center justify-center rounded-[4px] border border-catalog-border disabled:cursor-default disabled:opacity-40"
              >
                <img src="/images/catalog/imgArrowRight2.svg" alt="" className="-rotate-90" />
              </button>
            </nav>
          </div>
        </div>
      </Container>
      {filtersOpen && (
        <HomeDialog open title="Filtrar NFTs" onClose={onCloseFilters}>
          {filterPanel}
          <label className="mt-4 block text-[14px]">
            Ordenar NFTs
            <select
              aria-label="Ordenar NFTs nos filtros"
              value={sort}
              onChange={(event) => {
                update({ sort: event.target.value as typeof sort })
              }}
              className="mt-2 block w-full rounded border border-border bg-background p-3"
            >
              <option value="recent">Listados recentemente</option>
              <option value="lowest">Menor preço</option>
              <option value="highest">Maior preço</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onCloseFilters}
            className="mt-4 w-full rounded bg-primary p-3 font-bold text-background"
          >
            Ver resultados
          </button>
        </HomeDialog>
      )}
    </section>
  )
}
