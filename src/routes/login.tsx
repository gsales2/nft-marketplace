import { safeReturnTo } from '../lib/auth'
import { HomeLayout } from '../components/layout/HomeLayout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: safeReturnTo(search.returnTo),
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { returnTo } = Route.useSearch()
  return <HomeLayout initialLoginOpen returnTo={returnTo} />
}
