import { SvgArtwork } from '../ui/SvgArtwork'
import imgHome from '../../../public/images/mobile/imgHome.svg?raw'
import imgVector1 from '../../../public/images/mobile/imgVector1.svg?raw'
import imgEllipse39 from '../../../public/images/mobile/imgEllipse39.svg?raw'
import imgVector2 from '../../../public/images/mobile/imgVector2.svg?raw'
import imgVector3 from '../../../public/images/mobile/imgVector3.svg?raw'
import imgVector4 from '../../../public/images/mobile/imgVector4.svg?raw'
import imgVector5 from '../../../public/images/mobile/imgVector5.svg?raw'
import imgVector6 from '../../../public/images/mobile/imgVector6.svg?raw'
import imgShop from '../../../public/images/mobile/imgShop.svg?raw'
import imgUser from '../../../public/images/mobile/imgUser.svg?raw'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../lib/auth'
import { CartCount } from '../cart/CartFeedback'
import navigationShape from '../../../public/images/mobile/imgVector.svg?raw'

interface Props {
  onLogin: () => void
  onFavorites: () => void
  onScan: () => void
  favoritesOnly: boolean
}
export function MobileBottomNav({ onFavorites, onScan, favoritesOnly, onLogin }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  return (
    <nav
      aria-label="Navegação mobile"
      className="fixed inset-x-0 bottom-0 z-40 h-[calc(126px+env(safe-area-inset-bottom))] overflow-hidden md:hidden"
    >
      <div className="absolute inset-x-0 bottom-0 top-[31px] rounded-t-[28px] bg-surface" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[9px] left-1/2 w-[474px] max-w-full -translate-x-1/2 [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: navigationShape }}
      />
      <Link
        to="/"
        aria-label="Início"
        className="absolute left-6 top-[59px] flex size-11 items-center justify-center"
      >
        <SvgArtwork markup={imgHome} />
      </Link>
      <button
        type="button"
        onClick={onFavorites}
        aria-label="Meus favoritos"
        aria-pressed={favoritesOnly}
        className={`absolute left-[23%] top-[59px] flex size-11 items-center justify-center rounded-full ${favoritesOnly ? 'bg-catalog-primary/25' : ''}`}
      >
        <SvgArtwork markup={imgVector1} />
      </button>
      <button
        type="button"
        onClick={onScan}
        aria-label="Escanear coleção"
        className="absolute left-1/2 top-0 flex size-[65px] -translate-x-1/2 items-center justify-center"
      >
        <SvgArtwork markup={imgEllipse39} className="absolute inset-0" />
        <span className="relative block h-[25px] w-[27px]" aria-hidden="true">
          <SvgArtwork markup={imgVector2} className="absolute left-0 top-[11px]" />
          <SvgArtwork markup={imgVector3} className="absolute bottom-0 left-0" />
          <SvgArtwork markup={imgVector4} className="absolute right-0 top-0" />
          <SvgArtwork markup={imgVector5} className="absolute bottom-0 right-0" />
          <SvgArtwork markup={imgVector6} className="absolute left-0 top-0" />
        </span>
      </button>
      <Link
        to="/cart"
        aria-label="Abrir carrinho"
        className="absolute right-[22%] top-[59px] flex size-11 items-center justify-center"
      >
        <SvgArtwork markup={imgShop} />
        <CartCount />
      </Link>
      <button
        type="button"
        onClick={() => (user ? void navigate({ to: '/profile' }) : onLogin())}
        aria-label={user ? 'Minha conta' : 'Entrar'}
        className="absolute right-6 top-[59px] flex size-11 items-center justify-center"
      >
        <SvgArtwork markup={imgUser} />
      </button>
    </nav>
  )
}
