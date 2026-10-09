import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getApiError, readSessionToken } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { usePurchase } from '../../lib/usePurchase'
import type { CollectorDetails, QuoteResponse } from '../../lib/checkoutContracts'
import { Button } from '../ui/Button'
import { HomeDialog } from '../ui/HomeDialog'
import { realtimeNoticeEvent } from '../../lib/realtimeContracts'

interface Props {
  walletId: string
  collector?: CollectorDetails
  onClose: () => void
}

export function CheckoutReview({ walletId, collector, onClose }: Props) {
  const { user } = useAuth()
  const purchase = usePurchase()
  const client = useQueryClient()
  const [acceptedRevision, setAcceptedRevision] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['private', user?.id, 'quote', walletId],
    queryFn: async ({ signal }) =>
      (await api.post<QuoteResponse>('/quote', { walletId }, { signal })).data,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const review = query.data
  const accepted = !!review && acceptedRevision === review.cart.revision

  async function submit() {
    if (!review || !accepted || purchase.isPending || query.isFetching || query.isError) return
    sessionStorage.removeItem(`kurio-quote-review:${readSessionToken()}`)
    window.dispatchEvent(new CustomEvent(realtimeNoticeEvent, { detail: { message: '' } }))
    purchase.mutate(
      {
        walletId,
        expectedTotal: review.cart.total,
        expectedRevision: review.cart.revision,
        collector,
      },
      {
        onError: () => {
          setAcceptedRevision(null)
          void client.invalidateQueries({ queryKey: ['private', user?.id, 'cart'] })
          void query.refetch()
        },
      },
    )
  }

  return (
    <HomeDialog open title="Revisar compra" onClose={onClose} dismissible={!purchase.isPending}>
      {query.isPending && <p role="status">Revalidando valores e disponibilidade…</p>}
      {query.isError && (
        <div role="alert">
          <p>{getApiError(query.error).message}</p>
          <Button className="mt-3" onClick={() => void query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {review && (
        <div className="space-y-4 text-sm">
          <p className="break-words text-catalog-muted">
            {review.wallet.name} · {review.wallet.type} · {review.wallet.network}
            <br />
            {review.wallet.ens || review.wallet.address}
          </p>
          {collector && (
            <p>
              {collector.displayName} · {collector.email}
            </p>
          )}
          <ul className="space-y-2">
            {review.cart.items.map((item) => (
              <li key={item.id} className="flex flex-wrap justify-between gap-2">
                <span>
                  {item.name} · {item.edition} × {item.quantity}
                </span>
                <span>{item.total} ETH</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-catalog-border pt-3">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{review.cart.subtotal} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>Desconto{review.cart.coupon ? ` (${review.cart.coupon})` : ''}</dt>
              <dd>− {review.cart.discount} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd>{review.cart.networkFee} ETH</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>Total</dt>
              <dd className="text-catalog-accent">{review.cart.total} ETH</dd>
            </div>
          </dl>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={accepted}
              disabled={purchase.isPending || query.isFetching || query.isError}
              onChange={(event) =>
                setAcceptedRevision(event.target.checked ? review.cart.revision : null)
              }
              className="mt-1 size-4 shrink-0 accent-catalog-primary"
            />
            <span>Conferi os itens, a carteira, a rede e os valores desta compra fictícia.</span>
          </label>
          {query.isFetching && <p role="status">Atualizando a revisão…</p>}
          {acceptedRevision && !accepted && (
            <p role="status">
              A cotação mudou. Confira os valores atualizados e confirme a revisão novamente.
            </p>
          )}
          {purchase.isError && <p role="alert">{getApiError(purchase.error).message}</p>}
          <Button
            disabled={!accepted || purchase.isPending || query.isFetching || query.isError}
            onClick={() => void submit()}
            className="w-full"
          >
            {purchase.isPending ? 'Enviando pedido…' : 'Enviar pedido'}
          </Button>
        </div>
      )}
    </HomeDialog>
  )
}
