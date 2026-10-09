import { PurchaseReceipt } from '../components/cart/PurchaseReceipt'
import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '../lib/auth'
import { WalletPayment } from '../components/cart/WalletPayment'
import { DesktopPayment } from '../components/cart/DesktopPayment'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useAuth } from '../lib/auth'
import { PurchaseRecovery } from '../components/cart/PurchaseRecovery'
import { useCheckoutAttempt } from '../lib/checkoutAttempt'
import { useIsMutating } from '@tanstack/react-query'
import { LoginModal } from '../components/ui/LoginModal'
import { readSessionToken } from '../lib/api'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>): { order?: string } => ({
    order: typeof search.order === 'string' ? search.order : undefined,
  }),
  beforeLoad: ({ location }) => requireSession(location.href),
  component: CheckoutPage,
})

function CheckoutPage() {
  const mobile = useMediaQuery('(max-width: 767px)')
  const { order } = Route.useSearch()
  const { user } = useAuth()
  const navigate = useNavigate()
  const attempt = useCheckoutAttempt(user?.id ?? '')
  const busy = useIsMutating({ mutationKey: ['private', user?.id, 'purchase'] }) > 0
  if (!user)
    return (
      <main id="page-content" tabIndex={-1} className="min-h-screen p-7">
        <p>Entre novamente para retomar sua compra.</p>
        <LoginModal
          notice="Sua sessão expirou. Entre novamente para continuar."
          onClose={() => {
            if (!readSessionToken()) void navigate({ to: '/cart' })
          }}
        />
      </main>
    )
  if (order) return <PurchaseReceipt id={order} />
  if (user && attempt && !busy)
    return (
      <main id="page-content" tabIndex={-1} className="min-h-screen px-6 py-16">
        <PurchaseRecovery key={user.id} userId={user.id} />
      </main>
    )
  return mobile ? <WalletPayment /> : <DesktopPayment />
}
