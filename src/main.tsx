import { StrictMode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import {
  QueryClientProvider,
  dehydrate,
  hydrate,
  type DehydratedState,
} from '@tanstack/react-query'

import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/queryClient'

import '@fontsource-variable/roboto-mono/wght.css'
import './index.css'
import { SessionLifecycle } from './components/auth/SessionLifecycle'
import { RealtimeLifecycle } from './components/auth/RealtimeLifecycle'
import { setNetworkReady } from './lib/networkReady'

const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function initializeNetwork() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    await (window as Window & { kurioWorkerReady?: Promise<void> }).kurioWorkerReady
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  }
}

const readiness = initializeNetwork()
setNetworkReady(readiness)
const container = document.getElementById('root')!
const profile = window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop'
const prerender = window as Window & {
  kurioPrerenderProfile?: string
  kurioRenderPublicPage?: () => Promise<{ html: string; state: DehydratedState }>
}
const snapshotElement = document.getElementById('kurio-public-state')
const canHydrate = snapshotElement && prerender.kurioPrerenderProfile === profile
if (canHydrate) {
  const snapshots = JSON.parse(snapshotElement.textContent ?? '{}') as Record<
    string,
    DehydratedState
  >
  const state = snapshots[profile]
  // Evita refetch durante a hidratação; a rota revalida o snapshot após montar.
  state.queries.forEach((query) => {
    query.state.dataUpdatedAt = Date.now()
  })
  hydrate(queryClient, state)
}
let root: Root

const application = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionLifecycle />
      <RealtimeLifecycle />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)

if (canHydrate) {
  await router.load()
  root = hydrateRoot(container, application)
} else {
  container.replaceChildren()
  root = createRoot(container)
  root.render(application)
}

// Build tooling obtains public markup from the real app and REST query cache.
// No sessions with users, private caches or guest cart identifiers are exported.
prerender.kurioRenderPublicPage = async () => {
  if (localStorage.getItem('kurio-session-token'))
    throw new Error('Only anonymous public pages can be prerendered.')
  const { renderToString } = await import('react-dom/server.browser')
  const state = dehydrate(queryClient, {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' &&
      (query.queryKey[0] === 'catalog' ||
        query.queryKey[0] === 'nfts' ||
        (query.queryKey[0] === 'session' &&
          (query.state.data as { session: unknown }).session === null)),
  })
  return { html: renderToString(application), state }
}
void readiness.catch(() => {
  root.render(
    <main role="alert" className="p-7">
      <h1>Não foi possível iniciar a simulação.</h1>
      <button
        type="button"
        className="mt-4 rounded border border-catalog-primary p-3"
        onClick={() => window.location.reload()}
      >
        Recarregar e tentar novamente
      </button>
    </main>,
  )
})
