import { useRelatedNFTs } from '../../lib/useCatalog'
import { CartItemsSkeleton, CartSummarySkeleton } from '../ui/Skeleton'
import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { Header } from '../layout/Header'
import { Container } from '../layout/Container'
import { Footer } from '../layout/Footer'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { getApiError } from '../../lib/api'
import { type HomeMessage } from '../../lib/catalogData'
import type { useCart } from '../../lib/useCart'

interface Props extends ReturnType<typeof useCart> {
  onCheckout: () => void
  onLogin: () => void
  onMessage: (message: HomeMessage) => void
}
const columns =
  'grid grid-cols-[minmax(230px,1fr)_90px_100px_110px_48px] xl:grid-cols-[312px_138px_136px_142px_54px]'

export function DesktopCart({ cart, query, mutation, onCheckout, onLogin, onMessage }: Props) {
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState('')
  const [page, setPage] = useState(1)
  const relatedQuery = useRelatedNFTs(cart?.items[0]?.nftId ?? 'emerald')
  const related = relatedQuery.data?.slice(((page + 2) % 3) * 5, (((page + 2) % 3) + 1) * 5) ?? []
  const busy = mutation.isPending
  const quantityButton =
    'flex h-7 w-[18px] items-center justify-center rounded-full bg-catalog-primary text-[16px] leading-none text-background focus-visible:outline-2 focus-visible:outline-catalog-accent disabled:opacity-50'
  return (
    <>
      <div className="pt-8 xl:pt-6">
        <Header
          onLogin={onLogin}
          onSearch={() => void navigate({ to: '/', hash: 'catalogo' })}
          onFilters={() => void navigate({ to: '/', hash: 'catalogo' })}
        />
      </div>
      <Container>
        <main id="page-content" tabIndex={-1} className="mt-8">
          <nav aria-label="Caminho da página" className="text-[14px] font-bold leading-4">
            <Link to="/">Início</Link> / <a href="/#catalogo">Mercado</a> / Carrinho
          </nav>
          <div className="mt-3 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[782px_332px] xl:gap-[86px]">
            <section aria-label="Carrinho de NFTs" className="min-w-0 overflow-x-auto">
              <div role="table" aria-label="NFTs no carrinho" className="min-w-[650px] xl:min-w-0">
                <div
                  role="row"
                  className={`${columns} border-b border-catalog-border pb-[11px] text-[16px] leading-4`}
                >
                  <span role="columnheader">NFTs</span>
                  <span role="columnheader">Preço</span>
                  <span role="columnheader">Edições</span>
                  <span role="columnheader">Total</span>
                  <span role="columnheader" className="sr-only">
                    Remover
                  </span>
                </div>
                {query.isPending && <CartItemsSkeleton table />}
                {query.isError && (
                  <div role="alert" className="py-6 text-sm">
                    <p>{getApiError(query.error).message}</p>
                    <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
                  </div>
                )}
                {cart?.count === 0 && <p className="py-6 text-sm">Seu carrinho está vazio.</p>}
                <div role="rowgroup" className="mt-3 space-y-3">
                  {cart?.items.map((item) => (
                    <div
                      role="row"
                      key={item.id}
                      className={`${columns} h-[70px] items-center bg-surface`}
                    >
                      <div role="cell" className="flex min-w-0 items-center gap-4">
                        <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-[70px] rounded-[6px] object-cover"
                          />
                        </Link>
                        <div className="min-w-0 pr-2">
                          <Link
                            to="/nft/$nftId"
                            params={{ nftId: item.nftId }}
                            className="block truncate text-[15px] font-bold leading-5"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 truncate text-[14px] leading-4 text-catalog-secondary">
                            ID do token: #
                            {item.name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? item.nftId}
                          </p>
                        </div>
                      </div>
                      <span
                        role="cell"
                        className="break-all text-[16px] font-bold text-catalog-muted"
                      >
                        {item.unitPrice} ETH
                      </span>
                      <div role="cell" className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label={`Diminuir ${item.name}`}
                          disabled={busy || item.quantity === 1}
                          onClick={() =>
                            mutation.mutate({
                              method: 'patch',
                              body: { id: item.id, quantity: item.quantity - 1 },
                            })
                          }
                          className={quantityButton}
                        >
                          −
                        </button>
                        <output
                          aria-label={`Quantidade de ${item.name}`}
                          title={`Edição ${item.edition}`}
                          className="text-[18px] leading-5"
                        >
                          {item.quantity}
                        </output>
                        <button
                          type="button"
                          aria-label={`Aumentar ${item.name}`}
                          disabled={busy || item.quantity >= item.maximum}
                          onClick={() =>
                            mutation.mutate({
                              method: 'patch',
                              body: { id: item.id, quantity: item.quantity + 1 },
                            })
                          }
                          className={quantityButton}
                        >
                          +
                        </button>
                      </div>
                      <span
                        role="cell"
                        className="break-all text-[16px] font-bold text-catalog-accent"
                      >
                        {item.total} ETH
                      </span>
                      <div role="cell">
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={`Remover ${item.name}`}
                          onClick={() =>
                            mutation.mutate({ method: 'delete', body: { id: item.id } })
                          }
                          className="flex size-9 items-center justify-center text-catalog-secondary disabled:opacity-50"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section aria-labelledby="cart-summary-heading">
              <h1
                id="cart-summary-heading"
                className="border-b border-catalog-border pb-[11px] text-[17px] font-bold leading-4"
              >
                Resumo da carteira
              </h1>
              <form
                className="mt-6"
                onSubmit={(event) => {
                  event.preventDefault()
                  mutation.mutate({ method: 'put', body: { coupon } })
                }}
              >
                <label
                  htmlFor="desktop-cart-coupon"
                  className="block text-[14px] font-bold leading-4"
                >
                  Código promocional
                </label>
                <div className="mt-2 flex h-10">
                  <Input
                    id="desktop-cart-coupon"
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder="Digite o código promocional..."
                    className="h-10 min-w-0 flex-1 rounded-r-none border-catalog-primary bg-background px-2 text-[12px]"
                  />
                  <Button
                    disabled={busy || !cart?.count}
                    className="h-10 w-[102px] rounded-l-none text-[14px] font-bold"
                  >
                    Aplicar
                  </Button>
                </div>
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
              <dl className={query.isPending ? 'hidden' : 'mt-6 space-y-3 text-[14px] leading-5'}>
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="text-[18px]">{cart?.subtotal ?? '—'} ETH</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Desconto do lançamento</dt>
                  <dd>(-) {cart?.discount === '0.00' ? '00.00' : (cart?.discount ?? '—')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Taxa de rede</dt>
                  <dd className="text-right text-[18px]">
                    {cart?.networkFee ?? '—'} ETH
                    <span className="mt-3 block text-[12px] leading-4 text-catalog-primary">
                      Taxa estimada
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between pt-3 text-[16px] font-bold">
                  <dt>Total</dt>
                  <dd className="text-catalog-accent">{cart?.total ?? '—'} ETH</dd>
                </div>
              </dl>
              <Button
                onClick={onCheckout}
                disabled={!cart?.count || busy || query.isFetching}
                className="mt-6 h-10 w-full rounded-[2px] font-bold"
              >
                Conectar e finalizar
              </Button>
              <Link
                to="/"
                hash="catalogo"
                className="mt-3 block text-center text-[14px] leading-5 text-catalog-primary"
              >
                Continuar explorando
              </Link>
            </section>
          </div>
          <section aria-labelledby="cart-related-heading" className="mt-16 xl:mt-[96px]">
            <h2
              id="cart-related-heading"
              className="border-b border-catalog-border pb-2 text-[17px] font-bold leading-4 text-catalog-accent"
            >
              Colecionadores também viram
            </h2>
            <div className="mt-8 grid grid-cols-3 gap-6 xl:flex xl:justify-between">
              {related.map((item, index) => (
                <Link
                  key={item.id}
                  to="/nft/$nftId"
                  params={{ nftId: item.id }}
                  className="min-w-0 xl:w-[219px]"
                >
                  <div
                    className={`flex aspect-[219/255] justify-center bg-surface xl:h-[255px] ${index === 0 ? 'pt-[6px]' : 'pt-5'}`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`rounded-[13px] object-cover ${index === 0 ? 'aspect-[190/243] w-[87%] xl:h-[243px] xl:w-[190px]' : 'aspect-square h-fit w-[calc(100%-8px)]'}`}
                    />
                  </div>
                  <h3 className="mt-3 text-[15px] leading-5">{item.name}</h3>
                  <p className="mt-1 text-[16px] font-bold leading-4 text-catalog-accent">
                    {item.displayPrice ?? item.price.toFixed(2)} ETH
                  </p>
                </Link>
              ))}
            </div>
            <nav aria-label="Sugestões de NFTs" className="mx-auto mt-8 flex w-fit gap-2">
              {[0, 1, 2].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-label={`Sugestões página ${value + 1}`}
                  aria-current={page === value ? 'page' : undefined}
                  onClick={() => setPage(value)}
                  className={`size-3 rounded-full border border-catalog-primary ${page === value ? 'bg-catalog-primary' : 'bg-background'}`}
                />
              ))}
            </nav>
          </section>
        </main>
      </Container>
      <Footer
        onAction={onMessage}
        onCollection={() => void navigate({ to: '/', hash: 'catalogo' })}
      />
    </>
  )
}
