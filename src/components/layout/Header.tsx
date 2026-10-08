
import { Link } from '@tanstack/react-router'
import { Search, ShoppingCart, UserRound } from 'lucide-react'
import { Container } from './Container'

export function Header() {
    return (
        <Container>
            <header className="relative flex h-[45px] items-center justify-between after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-primary">
                <Link
                    to="/"
                    className="text-[14px] font-bold tracking-normal"
                >
                    KURIO
                </Link>

                <nav
                    aria-label="Navegação principal"
                    className="hidden items-center gap-8 lg:flex"
                >
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
                    <a href="/#catalogo" className="text-[12px] hover:text-primary">
                        Mercado
                    </a>
                    <a href="/#criadores" className="text-[12px] hover:text-primary">
                        Criadores
                    </a>
                    <a href="/#aprenda" className="text-[12px] hover:text-primary">
                        Aprenda
                    </a>
                </nav>

                <div className="hidden items-center gap-5 lg:flex">
                    <button type="button" aria-label="Pesquisar NFTs">
                        <Search size={18} />
                    </button>

                    <Link to="/cart" aria-label="Abrir carrinho">
                        <ShoppingCart size={18} />
                    </Link>

                    <Link
                        to="/login"
                        className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-[12px]"
                    >
                        <UserRound size={16} />
                        Entrar
                    </Link>
                </div>

                <div className="flex items-center gap-4 lg:hidden">
                    <Link to="/cart" aria-label="Abrir carrinho">
                        <ShoppingCart size={20} />
                    </Link>
                    <Link to="/login" aria-label="Entrar">
                        <UserRound size={20} />
                    </Link>
                </div>
            </header>
        </Container>
    )
}
