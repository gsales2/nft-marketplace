import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { api, getApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import type { Order } from '../../lib/orderContracts'
import { Button } from '../ui/Button'
import { HomeDialog } from '../ui/HomeDialog'
export function PurchaseReceipt({ id }: { id: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [details, setDetails] = useState(false)
  const query = useQuery({
    queryKey: ['private', user?.id, 'order', id],
    queryFn: async ({ signal }) =>
      (await api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })).data,
    enabled: !!user,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2500 : false),
    retry: false,
  })
  const order = query.data
  if (order && order.status !== 'confirmed')
    return (
      <main
        id="page-content"
        tabIndex={-1}
        className="mx-auto flex min-h-screen max-w-[578px] flex-col justify-center px-7 py-16 text-center"
      >
        <h1 className="text-2xl font-bold">
          {order.status === 'pending' ? 'Compra em processamento' : 'Pagamento recusado'}
        </h1>
        <p role="status" className="mt-5 text-catalog-muted">
          {order.status === 'pending'
            ? 'Aguardando confirmação da compra fictícia. Você pode recarregar esta página para acompanhar o mesmo pedido.'
            : 'A compra não foi confirmada. Seus itens continuam no carrinho.'}
        </p>
        <p className="mt-4 break-all text-sm">Pedido: {order.id}</p>
        <p className="mt-3 text-catalog-accent">Total: {order.cart.total} ETH</p>
        <Button className="mt-6" onClick={() => void navigate({ to: '/cart' })}>
          Voltar ao carrinho
        </Button>
      </main>
    )
  return (
    <main id="page-content" tabIndex={-1} className="min-h-screen px-4 py-12 md:pt-[166px]">
      {query.isPending && (
        <p role="status" className="text-center">
          Carregando comprovante…
        </p>
      )}
      {query.isError && (
        <div role="alert" className="text-center">
          <p>{getApiError(query.error).message}</p>
          <Button onClick={() => void query.refetch()} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      )}
      {order && (
        <article className="relative mx-auto w-full max-w-[578px] border-b-[10px] border-catalog-primary bg-surface">
          <button
            aria-label="Fechar comprovante"
            onClick={() => void navigate({ to: '/', hash: 'catalogo' })}
            className="absolute right-3 top-3 p-1 text-catalog-primary"
          >
            <X size={20} />
          </button>
          <header className="px-5 pt-6 pb-5 text-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 70 84"
              className="mx-auto h-[80px] w-[70px] fill-none stroke-catalog-primary"
              strokeWidth="2.5"
              strokeLinejoin="round"
            >
              <path d="M4 30 35 3 66 30v49H4Z" />
              <path d="M9 45V9h52v36M4 79l26-29q5-6 10 0l26 29M4 30l20 23m42-23L46 53" />
              <text
                x="35"
                y="29"
                textAnchor="middle"
                className="fill-catalog-primary stroke-none"
                fontSize="12"
                fontWeight="bold"
              >
                THANK
              </text>
              <text
                x="35"
                y="42"
                textAnchor="middle"
                className="fill-catalog-primary stroke-none"
                fontSize="12"
                fontWeight="bold"
              >
                YOU
              </text>
            </svg>
            <h1 className="mt-4 text-[16px] font-bold text-catalog-muted">
              Seus NFTs agora estão na sua carteira
            </h1>
          </header>
          <dl className="grid grid-cols-2 gap-y-4 border-y border-catalog-primary px-5 py-4 text-[14px] leading-[18px] text-catalog-muted sm:grid-cols-[1.15fr_1fr_1fr_.8fr] sm:px-9">
            <div className="border-r border-catalog-primary pr-3">
              <dt className="font-bold">ID da transação</dt>
              <dd>
                {order.transactionId.slice(0, 6)}…{order.transactionId.slice(-4)}
              </dd>
            </div>
            <div className="px-4 sm:border-r sm:border-catalog-primary">
              <dt>Data</dt>
              <dd>
                {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </dd>
            </div>
            <div className="border-r border-catalog-primary pr-3 sm:px-4">
              <dt>Total</dt>
              <dd className="min-w-0 break-all">{order.cart.total} ETH</dd>
            </div>
            <div className="pl-4">
              <dt className="font-bold">Carteira</dt>
              <dd>{order.wallet.type}</dd>
            </div>
          </dl>
          <section className="px-5 pt-5 pb-12 sm:px-11">
            <h2 className="text-[14px] font-bold">Detalhes da transação</h2>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_65px_95px] border-b border-catalog-border pb-2 text-[14px] font-bold sm:grid-cols-[minmax(0,1fr)_85px_110px]">
              <span>NFTs</span>
              <span>Edições</span>
              <span className="text-right">Subtotal</span>
            </div>
            <ul className="mt-3 space-y-3">
              {order.cart.items.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_65px_95px] items-center sm:grid-cols-[minmax(0,1fr)_85px_110px]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={item.image}
                      alt=""
                      className="size-12 shrink-0 rounded-md object-cover sm:size-[70px]"
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold sm:text-[14px]">{item.name}</p>
                      <p className="mt-1 text-[11px] text-catalog-secondary sm:text-[12px]">
                        ID do token: #{item.name.match(/#(\d+)/)?.[1]?.padStart(4, '0')}
                      </p>
                    </div>
                  </div>
                  <span className="text-center text-[12px] text-catalog-muted">
                    (× {item.quantity})
                  </span>
                  <span className="break-all text-right text-[14px] font-bold text-catalog-accent sm:text-[18px]">
                    {item.total} ETH
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 ml-auto max-w-[320px] space-y-2 text-[14px] sm:text-[16px]">
              {order.cart.coupon && (
                <div className="flex justify-between gap-2">
                  <dt>Desconto</dt>
                  <dd>− {order.cart.discount} ETH</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Taxa de rede</dt>
                <dd>{order.cart.networkFee} ETH</dd>
              </div>
              <div className="flex justify-between gap-2 font-bold">
                <dt>Total</dt>
                <dd className="min-w-0 break-all text-right text-catalog-accent">
                  {order.cart.total} ETH
                </dd>
              </div>
            </dl>
            <p className="mt-2 border-t border-catalog-border pt-3 text-center text-[14px] leading-[22px] text-catalog-muted">
              Compra fictícia confirmada na rede {order.wallet.network}. Seus NFTs foram registrados
              na carteira simulada. Nenhum valor foi cobrado.
            </p>
            <div className="mt-5 text-center">
              <Button onClick={() => setDetails(true)} className="h-12 font-bold">
                Ver no Etherscan
              </Button>
            </div>
          </section>
        </article>
      )}
      {details && order && (
        <HomeDialog open title="Detalhes da transação simulada" onClose={() => setDetails(false)}>
          <p className="text-sm">Esta compra é fictícia e não possui registro no Etherscan.</p>
          <dl className="mt-4 space-y-3 break-all text-sm">
            <div>
              <dt>ID da transação</dt>
              <dd className="text-catalog-muted">{order.transactionId}</dd>
            </div>
            <div>
              <dt>Carteira</dt>
              <dd className="text-catalog-muted">{order.wallet.address}</dd>
            </div>
            <div>
              <dt>Rede</dt>
              <dd>{order.wallet.network}</dd>
            </div>
          </dl>
        </HomeDialog>
      )}
    </main>
  )
}
