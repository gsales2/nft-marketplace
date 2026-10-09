import { createRootRoute, Outlet } from '@tanstack/react-router'
import { CartFeedback } from '../components/cart/CartFeedback'
import { Link } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <main id="page-content" tabIndex={-1} className="mx-auto max-w-[1200px] px-7 py-20">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-4">Confira o endereço ou volte para o mercado.</p>
      <Link to="/" className="mt-6 inline-block text-catalog-accent underline">
        Voltar ao início
      </Link>
    </main>
  ),
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#page-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <Outlet />
      <CartFeedback />
    </div>
  )
}
