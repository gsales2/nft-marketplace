import { useFavorites } from '../../lib/useFavorites'
import { usePublicSnapshotRevalidation } from '../../lib/usePublicSnapshotRevalidation'
import { useCatalogSearch } from '../../lib/useCatalogSearch'
import { getApiError } from '../../lib/api'
import { LoginModal } from '../ui/LoginModal'
import { useNavigate } from '@tanstack/react-router'
import { Header } from './Header'
import { Hero } from '../home/Hero'
import { Catalog } from '../home/Catalog'
import { useState } from 'react'
import { PromoBanner } from '../home/PromoBanner'
import { Journal } from '../home/Journal'
import { Footer } from './Footer'
import { HomeDialog } from '../ui/HomeDialog'
import type { HomeMessage } from '../../lib/catalogData'
import { MobileBottomNav } from './MobileBottomNav'

export function HomeLayout({
  initialLoginOpen = false,
  returnTo = '/',
}: {
  initialLoginOpen?: boolean
  returnTo?: string
}) {
  usePublicSnapshotRevalidation()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(initialLoginOpen)
  const closeLogin = () => {
    setLoginOpen(false)
    if (initialLoginOpen) void navigate({ to: returnTo, replace: true })
  }
  const [message, setMessage] = useState<HomeMessage | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { search, update } = useCatalogSearch()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const favoritesOnly = search.favorites
  const { favorites, user, mutation: favoriteMutation, query: favoritesQuery } = useFavorites()
  const toggleFavorite = (id: string) => {
    if (!user) {
      setLoginOpen(true)
      return
    }
    if (favoriteMutation.isPending || favoritesQuery.isPending) return
    favoriteMutation.mutate(
      { id, remove: favorites.includes(id) },
      {
        onError: (error) =>
          setMessage({
            title: 'Não foi possível atualizar favoritos',
            body: getApiError(error).message,
          }),
      },
    )
  }
  const explore = (name = 'Arte digital') => {
    update({ collection: name, q: '', favorites: false })
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div className="pb-[calc(126px+env(safe-area-inset-bottom))] md:pb-0">
      <div className="pt-10 md:pt-8 xl:pt-[24px]">
        <Header
          onLogin={() => setLoginOpen(true)}
          onSearch={() => {
            setQuery(search.q)
            setSearchOpen(true)
          }}
          onFilters={() => setFiltersOpen(true)}
        />
      </div>

      <main id="page-content" tabIndex={-1}>
        <div className="mt-4 md:mt-[32px]">
          <Hero />
        </div>
        <Catalog
          filtersOpen={filtersOpen}
          onOpenFilters={() => setFiltersOpen(true)}
          onCloseFilters={() => setFiltersOpen(false)}
          favorites={favorites}
          favoritesOnly={favoritesOnly}
          onToggleFavorite={toggleFavorite}
        />
        <PromoBanner onExplore={() => explore()} />
        <Journal onAction={setMessage} />
      </main>
      <Footer onAction={setMessage} onCollection={explore} />
      <MobileBottomNav
        onLogin={() => setLoginOpen(true)}
        favoritesOnly={favoritesOnly}
        onFavorites={() => {
          if (!user) {
            setLoginOpen(true)
            return
          }
          update({ favorites: !favoritesOnly })
          document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
        }}
        onScan={() =>
          setMessage({
            title: 'Escanear coleção',
            body: 'A leitura de códigos de coleções estará disponível em breve.',
          })
        }
      />
      {loginOpen && <LoginModal onClose={closeLogin} />}
      <HomeDialog open={searchOpen} title="Pesquisar NFTs" onClose={() => setSearchOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            update({ q: query })
            setSearchOpen(false)
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <label className="block" htmlFor="nft-search">
            Nome do NFT
          </label>
          <input
            id="nft-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background p-3"
            placeholder="Ex.: Emerald Ape"
          />
          <div className="mt-4 flex gap-3">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-background">
              Pesquisar
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                update({ q: '' })
              }}
              className="rounded-md border border-border px-4 py-2"
            >
              Limpar busca
            </button>
          </div>
        </form>
      </HomeDialog>
      <HomeDialog open={!!message} title={message?.title ?? ''} onClose={() => setMessage(null)}>
        {message?.image && (
          <img
            src={message.image}
            alt=""
            className="mx-auto mb-5 size-[250px] rounded-lg object-cover"
          />
        )}
        <p className="text-[14px] leading-6 text-catalog-muted">{message?.body}</p>
      </HomeDialog>
    </div>
  )
}
