import { queryClient } from '../lib/queryClient'
import { catalogOptions } from '../lib/catalogQueries'
import type { SearchSchemaInput } from '@tanstack/react-router'
import type { CatalogSearch } from '../lib/catalogContracts'
import { parseCatalogSearch } from '../lib/catalogContracts'

import { createFileRoute } from '@tanstack/react-router'
import { HomeLayout } from '../components/layout/HomeLayout'

export const Route = createFileRoute('/')({
  validateSearch: (input: SearchSchemaInput & Partial<CatalogSearch>) => parseCatalogSearch(input),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ deps }) => {
    if (!deps.search.favorites)
      void queryClient.prefetchQuery(
        catalogOptions(deps.search, window.matchMedia('(max-width: 767px)').matches ? 4 : 9),
      )
  },
  component: HomePage,
})

function HomePage() {
  return <HomeLayout />
}
