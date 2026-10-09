import { AccountControls } from '../auth/AccountControls'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { CartCount } from '../cart/CartFeedback'

export function MobileHeader({ onLogin }: { onLogin: () => void }) {
  const pathname = useLocation().pathname
  const marketActive = pathname.startsWith('/nft/') || pathname === '/cart'
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const root = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const dismissOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const dismissEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    const desktop = window.matchMedia('(min-width: 768px)')
    const dismissDesktop = () => {
      if (desktop.matches) setOpen(false)
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissEscape)
    desktop.addEventListener('change', dismissDesktop)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissEscape)
      desktop.removeEventListener('change', dismissDesktop)
    }
  }, [open])

  return (
    <header
      ref={root}
      className="relative z-50 mb-4 grid h-[45px] grid-cols-[44px_1fr_44px] items-center border-b border-catalog-primary md:hidden"
    >
      <Link
        to="/cart"
        onClick={() => setOpen(false)}
        aria-label="Abrir carrinho"
        className="relative col-start-1 row-start-1 flex size-9 items-center justify-center"
      >
        <ShoppingCart size={18} />
        <CartCount />
      </Link>
      <Link
        to="/"
        onClick={() => setOpen(false)}
        aria-label="Kurio — Início"
        className="col-start-2 justify-self-center text-[14px] font-bold tracking-normal"
      >
        KURIO
      </Link>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        aria-expanded={open}
        aria-controls={menuId}
        className="flex size-11 items-center justify-center rounded-md text-catalog-accent hover:bg-surface focus-visible:outline-2 focus-visible:outline-catalog-primary"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav
        id={menuId}
        hidden={!open}
        aria-label="Navegação principal mobile"
        className="absolute right-0 top-[calc(100%+8px)] w-[240px] max-w-full rounded-lg border border-catalog-border bg-surface p-4 shadow-xl"
      >
        <div className="flex flex-col gap-1 text-[12px]">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            activeOptions={{ exact: true }}
            activeProps={{
              className: 'text-catalog-accent underline decoration-2 underline-offset-8',
            }}
            className="rounded px-3 py-3 hover:bg-background/40"
          >
            Início
          </Link>
          <a
            href="/#catalogo"
            onClick={() => setOpen(false)}
            aria-current={marketActive ? 'page' : undefined}
            className={`rounded px-3 py-3 hover:bg-background/40 hover:text-catalog-accent ${marketActive ? 'text-catalog-accent underline decoration-2 underline-offset-8' : ''}`}
          >
            Mercado
          </a>
          <a
            href="/#criadores"
            onClick={() => setOpen(false)}
            className="rounded px-3 py-3 hover:bg-background/40 hover:text-catalog-accent"
          >
            Criadores
          </a>
          <a
            href="/#aprenda"
            onClick={() => setOpen(false)}
            className="rounded px-3 py-3 hover:bg-background/40 hover:text-catalog-accent"
          >
            Aprenda
          </a>
        </div>
        <div className="mt-4">
          <AccountControls
            onLogin={() => {
              setOpen(false)
              trigger.current?.focus()
              onLogin()
            }}
          />
        </div>
      </nav>
    </header>
  )
}
