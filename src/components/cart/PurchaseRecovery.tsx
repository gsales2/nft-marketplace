import { useIsMutating, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api, getApiError } from '../../lib/api'
import { saveCheckoutAttempt, useCheckoutAttempt } from '../../lib/checkoutAttempt'
import { usePurchase } from '../../lib/usePurchase'
import type { Order } from '../../lib/orderContracts'
import { Button } from '../ui/Button'

export function PurchaseRecovery({ userId }: { userId: string }) {
  const attempt = useCheckoutAttempt(userId)
  const busy = useIsMutating({ mutationKey: ['private', userId, 'purchase'] }) > 0
  const navigate = useNavigate()
  const purchase = usePurchase()
  const query = useQuery({
    queryKey: ['private', userId, 'attempt', attempt?.key],
    queryFn: async ({ signal }) => {
      try {
        return (
          await api.get<Order>(`/orders/attempts/${encodeURIComponent(attempt!.key)}`, { signal })
        ).data
      } catch (error) {
        if (getApiError(error).code === 'NOT_FOUND') return null
        throw error
      }
    },
    enabled: !!attempt && !busy,
    retry: false,
    staleTime: 0,
  })
  if (!attempt || busy) return null

  return (
    <section
      aria-labelledby="recovery-heading"
      className="mx-auto max-w-[600px] space-y-4 border border-catalog-border bg-surface p-6"
    >
      <h1 id="recovery-heading" className="text-xl font-bold">
        Recuperar tentativa de compra
      </h1>
      <p className="text-sm text-catalog-muted">
        A resposta anterior não foi recebida. Vamos consultar a mesma tentativa antes de enviar
        qualquer nova compra.
      </p>
      {query.isPending && <p role="status">Consultando pedido…</p>}
      {query.isError && (
        <div role="alert">
          <p>{getApiError(query.error).message}</p>
          <Button className="mt-3" onClick={() => void query.refetch()}>
            Consultar novamente
          </Button>
        </div>
      )}
      {query.data && (
        <>
          <p role="status">
            Pedido{' '}
            {query.data.status === 'pending'
              ? 'pendente'
              : query.data.status === 'confirmed'
                ? 'confirmado'
                : 'recusado'}{' '}
            · {query.data.cart.total} ETH
          </p>
          <Button
            onClick={async () => {
              await navigate({ to: '/checkout', search: { order: query.data!.id } })
              saveCheckoutAttempt(userId, null)
            }}
          >
            Acompanhar compra
          </Button>
        </>
      )}
      {query.isSuccess && query.data === null && (
        <>
          <p>Nenhum pedido foi criado para esta tentativa.</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => purchase.mutate(attempt.input)}>
              Reenviar a mesma tentativa
            </Button>
            <Button variant="outline" onClick={() => saveCheckoutAttempt(userId, null)}>
              Voltar à revisão
            </Button>
          </div>
        </>
      )}
      {purchase.isError && <p role="alert">{getApiError(purchase.error).message}</p>}
    </section>
  )
}
