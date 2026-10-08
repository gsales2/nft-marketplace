
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <p className="mb-3 text-sm text-muted">
        Bem-vindo à Kurio
      </p>

      <h1 className="max-w-xl text-4xl font-bold leading-tight">
        SEJA DONO DO FUTURO DA ARTE DIGITAL
      </h1>

      <p className="mt-5 max-w-lg text-sm text-muted">
        Descubra NFTs selecionados de criadores emergentes e consagrados.
      </p>

      <button className="mt-6 rounded-md bg-primary px-6 py-3 text-sm font-bold text-background">
        EXPLORAR
      </button>
    </main>
  )
}
