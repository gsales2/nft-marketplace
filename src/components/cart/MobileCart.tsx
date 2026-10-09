import { CartItemsSkeleton, CartSummarySkeleton } from '../ui/Skeleton'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { getApiError } from '../../lib/api'
import type { useCart } from '../../lib/useCart'

interface Props extends ReturnType<typeof useCart> {
  onCheckout: () => void
}

export function MobileCart({ cart, query, mutation, onCheckout }: Props) {
  const [coupon, setCoupon] = useState('')
  const busy = mutation.isPending
  const change = (id: string, quantity: number) =>
    mutation.mutate({ method: 'patch', body: { id, quantity } })
  const quantityButton =
    'flex size-6 shrink-0 items-center justify-center rounded-full border border-catalog-border bg-[#321d14] text-[22px] leading-none outline-none focus-visible:ring-2 focus-visible:ring-catalog-accent disabled:cursor-default disabled:text-catalog-border'
  return (
    <main id="page-content" tabIndex={-1} className="flex min-h-screen flex-col bg-background">
      <section className="px-7 pt-8 pb-[6px]" aria-labelledby="cart-heading">
        <div className="relative mb-[21px] flex h-[35px] items-center justify-center">
          <Link
            to="/"
            hash="catalogo"
            aria-label="Voltar ao mercado"
            className="absolute left-0 flex size-[35px] items-center justify-center rounded-full border border-catalog-border bg-[#321d14] text-catalog-secondary focus-visible:outline-2 focus-visible:outline-catalog-accent"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 id="cart-heading" className="pl-7 text-[clamp(16px,4.83vw,20px)] font-bold leading-6">
            Carrinho de NFTs
          </h1>
        </div>
        {query.isPending && <CartItemsSkeleton />}
        {query.isError && (
          <div role="alert" className="py-6 text-sm">
            <p>{getApiError(query.error).message}</p>
            <Button className="mt-3" onClick={() => void query.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {cart?.items.length === 0 && (
          <div className="py-8 text-center text-sm">
            <p>Seu carrinho está vazio.</p>
            <Link
              to="/"
              hash="catalogo"
              className="mt-4 inline-block text-catalog-accent underline"
            >
              Explorar NFTs
            </Link>
          </div>
        )}
        <ul className="space-y-5">
          {cart?.items.map((item) => (
            <li
              key={item.id}
              className="relative h-[100px] rounded-[14px] bg-surface shadow-[0_14px_18px_-10px_rgba(0,0,0,0.5)] max-[360px]:h-[110px]"
            >
              <Link
                to="/nft/$nftId"
                params={{ nftId: item.nftId }}
                className="absolute inset-y-0 left-0 w-[100px] max-[360px]:w-20"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full rounded-[14px] object-cover"
                />
              </Link>
              <Link
                to="/nft/$nftId"
                params={{ nftId: item.nftId }}
                className="absolute left-[109px] right-8 top-[13px] truncate text-[clamp(12px,3.62vw,15px)] font-bold leading-4 max-[360px]:left-[89px]"
              >
                {item.name}
              </Link>
              <p className="absolute left-[109px] top-[35px] text-[14px] leading-4 text-catalog-muted max-[360px]:left-[89px] max-[360px]:text-[12px]">
                Edição: {item.edition}
              </p>
              <p
                style={item.total.length > 10 ? { fontSize: 12, lineHeight: '14px' } : undefined}
                className="absolute left-[109px] right-4 top-[69px] break-all text-[18px] font-bold leading-6 text-catalog-accent max-[360px]:left-[89px] max-[360px]:top-[82px] max-[360px]:text-[16px]"
              >
                {item.total} ETH
              </p>
              <div className="absolute right-4 top-[38px] flex items-center gap-3 max-[360px]:top-[52px]">
                <button
                  type="button"
                  className={quantityButton}
                  aria-label={`Diminuir ${item.name}`}
                  disabled={busy || item.quantity === 1}
                  onClick={() => change(item.id, item.quantity - 1)}
                >
                  −
                </button>
                <output
                  aria-label={`Quantidade de ${item.name}`}
                  className="min-w-[10px] text-center text-[16px] leading-[22px]"
                >
                  {item.quantity}
                </output>
                <button
                  type="button"
                  className={quantityButton}
                  aria-label={`Aumentar ${item.name}`}
                  disabled={busy || item.quantity >= item.maximum}
                  onClick={() => change(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                aria-label={`Remover ${item.name}`}
                title="Remover NFT"
                disabled={busy}
                onClick={() => mutation.mutate({ method: 'delete', body: { id: item.id } })}
                className="absolute right-2 top-1 flex size-7 items-center justify-center rounded-full text-catalog-primary focus-visible:outline-2 focus-visible:outline-catalog-accent disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section
        aria-label="Resumo do carrinho"
        className="mt-auto rounded-t-[48px] bg-surface px-6 pt-6 pb-[calc(36px+env(safe-area-inset-bottom))]"
      >
        <form
          className="relative flex h-[50px] rounded-full border border-catalog-border"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate({ method: 'put', body: { coupon } })
          }}
        >
          <Input
            aria-label="Código promocional"
            value={coupon}
            onChange={(event) => setCoupon(event.target.value)}
            placeholder="Digite o código promocional..."
            className="h-full min-w-0 rounded-full border-0 bg-transparent pl-4 pr-[100px] text-[14px] placeholder:text-catalog-secondary"
          />
          <Button
            type="submit"
            disabled={busy || !cart?.count}
            className="absolute -right-px -top-px h-[50px] w-[97px] rounded-full bg-gradient-to-br from-[#825431] to-catalog-primary text-[16px] font-bold text-background"
          >
            Aplicar
          </Button>
        </form>
        {cart?.coupon && (
          <p className="mt-3 text-xs text-catalog-accent">
            {cart.coupon} aplicado{' '}
            <button
              disabled={busy}
              onClick={() => mutation.mutate({ method: 'put', body: { coupon: '' } })}
              className="underline"
            >
              Remover cupom
            </button>
          </p>
        )}
        {mutation.isError && (
          <p role="alert" className="mt-3 text-sm text-[#ed7955]">
            {getApiError(mutation.error).message}
          </p>
        )}
        {query.isPending && <CartSummarySkeleton />}
        <dl
          className={
            query.isPending ? 'hidden' : 'mt-3 space-y-3 text-[clamp(12px,3.86vw,16px)] leading-5'
          }
        >
          <div className="flex justify-between gap-2">
            <dt>Subtotal</dt>
            <dd className="min-w-0 break-all text-right">{cart?.subtotal ?? '—'} ETH</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Desconto do lançamento</dt>
            <dd className="min-w-0 break-all text-right">
              (-) {cart?.discount === '0.00' ? '00.00' : (cart?.discount ?? '—')}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Taxa de rede</dt>
            <dd className="min-w-0 break-all text-right text-right">
              {cart?.networkFee ?? '—'} ETH
              <span className="block text-[12px] leading-4 text-catalog-accent">Taxa estimada</span>
            </dd>
          </div>
          <div className="flex justify-between gap-2 text-[18px] font-bold leading-4">
            <dt>Total</dt>
            <dd className="min-w-0 break-all text-right text-catalog-accent">
              {cart?.total ?? '—'} ETH
            </dd>
          </div>
        </dl>
        <Button
          type="button"
          disabled={!cart?.count || busy || query.isFetching}
          onClick={onCheckout}
          className="mt-8 h-[60px] w-full rounded-full bg-gradient-to-br from-catalog-primary to-[#ab7344] text-[clamp(14px,3.86vw,16px)] font-bold"
        >
          Conectar e finalizar
        </Button>
      </section>
    </main>
  )
}
