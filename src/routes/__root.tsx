import {
  createRootRoute,
  Link,
  Outlet,
} from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-xl font-bold"
          >
            NFT Marketplace
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="[&.active]:text-purple-400"
            >
              Início
            </Link>

            <Link
              to="/cart"
              className="[&.active]:text-purple-400"
            >
              Carrinho
            </Link>

            <Link
              to="/login"
              className="[&.active]:text-purple-400"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}