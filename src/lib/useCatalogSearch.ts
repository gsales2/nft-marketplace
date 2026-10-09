import { useNavigate, useSearch } from '@tanstack/react-router'
import { parseCatalogSearch, type CatalogSearch } from './catalogContracts'
export function useCatalogSearch() {
  const raw = useSearch({ strict: false })
  const search = parseCatalogSearch(raw as Record<string, unknown>)
  const navigate = useNavigate()
  const update = (patch: Partial<CatalogSearch>, replace = false) =>
    void navigate({
      to: '/',
      search: { ...search, ...patch, page: patch.page ?? 1 },
      hash: 'catalogo',
      replace,
    })
  return { search, update }
}
