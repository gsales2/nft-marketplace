import { useMediaQuery } from '../../lib/useMediaQuery'
import { SvgArtwork } from '../ui/SvgArtwork'
import imgSearch from '../../../public/images/mobile/imgSearch.svg?raw'
import imgFilter from '../../../public/images/mobile/imgFilter.svg?raw'
import { AccountControls } from '../auth/AccountControls'
import { CartCount } from '../cart/CartFeedback'

import { Link, useLocation } from '@tanstack/react-router'
import { Search, ShoppingCart, UserRound } from 'lucide-react'
import { Container } from './Container'
import { MobileHeader } from './MobileHeader'

export function Header({
  onSearch,
  onFilters,
  onLogin,
}: {
  onSearch: () => void
  onFilters: () => void
  onLogin: () => void
}) {
  const mobile = useMediaQuery('(max-width: 767px)')
  const pathname = useLocation().pathname
  const marketActive =
    pathname.startsWith('/nft/') || pathname === '/cart' || pathname === '/checkout'
  return (
    <Container>
      {mobile && <MobileHeader onLogin={onLogin} />}
      <div className="flex h-[45px] gap-2 md:hidden">
        <button
          type="button"
          onClick={onSearch}
          aria-label="Explorar coleções — Pesquisar NFTs"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-surface px-3 text-[14px] font-bold leading-4 text-catalog-secondary"
        >
          <SvgArtwork markup={imgSearch} />
          Explorar coleções
        </button>
        <button
          type="button"
          onClick={onFilters}
          aria-label="Abrir filtros"
          className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-catalog-primary/45 to-catalog-primary"
        >
          <SvgArtwork markup={imgFilter} />
        </button>
      </div>
      {!mobile && (
        <header className="relative hidden h-[45px] items-center justify-between after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-primary md:flex">
          <Link to="/" className="text-[14px] font-bold tracking-normal">
            KURIO
          </Link>

          <nav aria-label="Navegação principal" className="flex items-center gap-4 xl:gap-8">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{
                className: 'text-primary border-b-2 border-primary',
              }}
              inactiveProps={{ className: 'border-transparent' }}
              className="flex h-full items-center border-b-2 text-[12px] hover:text-primary"
            >
              Início
            </Link>
            <a
              href="/#catalogo"
              aria-current={marketActive ? 'page' : undefined}
              className={`border-b-2 text-[12px] hover:text-primary ${marketActive ? 'border-primary text-primary' : 'border-transparent'}`}
            >
              Mercado
            </a>
            <a href="/#criadores" className="text-[12px] hover:text-primary">
              Criadores
            </a>
            <a href="/#aprenda" className="text-[12px] hover:text-primary">
              Aprenda
            </a>
          </nav>

          <div className="flex items-center gap-3 xl:gap-5">
            <button type="button" aria-label="Pesquisar NFTs" onClick={onSearch}>
              <Search size={18} />
            </button>

            <Link to="/cart" aria-label="Abrir carrinho" className="relative">
              <ShoppingCart size={18} />
              <CartCount />
            </Link>

            <AccountControls onLogin={onLogin} />
          </div>

          <div className="hidden">
            <Link to="/cart" aria-label="Abrir carrinho">
              <ShoppingCart size={20} />
            </Link>
            <button type="button" onClick={onLogin} aria-label="Entrar">
              <UserRound size={20} />
            </button>
          </div>
        </header>
      )}
    </Container>
  )
}
