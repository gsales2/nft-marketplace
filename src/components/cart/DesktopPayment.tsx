import { CartItemsSkeleton, CartSummarySkeleton } from '../ui/Skeleton'
import { CheckoutReview } from './CheckoutReview'
import { WalletConnection } from './WalletConnection'
import type { CollectorDetails } from '../../lib/checkoutContracts'
import { useWallets } from '../../lib/useWallets'
import type { WalletInput } from '../../lib/walletContracts'
import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Header } from '../layout/Header'
import { Container } from '../layout/Container'
import { Footer } from '../layout/Footer'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoginModal } from '../ui/LoginModal'
import { HomeDialog } from '../ui/HomeDialog'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/useCart'
import { getApiError } from '../../lib/api'
import type { HomeMessage } from '../../lib/catalogData'

export function DesktopPayment() {
  const { cart, query, mutation } = useCart()
  const { user } = useAuth()
  const [review, setReview] = useState<{ walletId: string; collector: CollectorDetails } | null>(
    null,
  )
  const [formError, setFormError] = useState('')
  const savedWallets = useWallets()
  const selected = savedWallets.wallets?.items.find(
    (item) => item.id === savedWallets.wallets?.selectedId,
  )
  const navigate = useNavigate()
  const [login, setLogin] = useState(false)

  const [message, setMessage] = useState<HomeMessage | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [couponOpen, setCouponOpen] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [walletChoice, setWallet] = useState<string | null>(null)
  const wallet = walletChoice ?? selected?.type ?? 'Coinbase Wallet'
  const [otherWallet, setOtherWallet] = useState(false)
  const action = (value: Parameters<typeof mutation.mutate>[0]) => mutation.mutate(value)
  const fieldClass = 'h-10 rounded-[2px] border-catalog-border bg-background text-[14px]'
  const labelClass = 'flex min-w-0 flex-col gap-1 text-[14px] leading-5'
  return (
    <>
      <div className="pt-10 md:pt-8 xl:pt-6">
        <Header
          onLogin={() => setLogin(true)}
          onSearch={() => void navigate({ to: '/', hash: 'catalogo' })}
          onFilters={() => void navigate({ to: '/', hash: 'catalogo' })}
        />
      </div>
      <Container>
        <main id="page-content" tabIndex={-1} className="mt-8">
          <nav aria-label="Caminho da página" className="text-[14px] font-bold leading-4">
            <Link to="/">Início</Link> / <a href="/#catalogo">Mercado</a> /{' '}
            <Link to="/cart">Carrinho</Link> / Pagamento
          </nav>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
            <section aria-labelledby="collector-heading">
              <h1 id="collector-heading" className="mb-4 text-[16px] font-bold leading-4">
                Perfil do colecionador
              </h1>
              <div className="mb-6">
                {savedWallets.wallets?.items.length ? (
                  <label className={labelClass}>
                    Carteira salva
                    <select
                      aria-label="Carteira salva"
                      value={selected?.id ?? ''}
                      onChange={(event) =>
                        savedWallets.mutation.mutate({
                          method: 'patch',
                          body: { id: event.target.value, selectOnly: true },
                        })
                      }
                      className={`${fieldClass} border px-3`}
                    >
                      {savedWallets.wallets.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.network}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <WalletConnection />
              </div>
              <form
                id="collector-form"
                key={`${user?.id}:${selected?.id ?? 'new'}`}
                onSubmit={async (event) => {
                  event.preventDefault()
                  if (!user) {
                    setLogin(true)
                    return
                  }
                  if (!cart || savedWallets.mutation.isPending) return
                  setFormError('')
                  const values = new FormData(event.currentTarget)
                  const address = String(
                    values.get(otherWallet ? 'otherWallet' : 'walletAddress') ?? '',
                  ).trim()
                  const network = String(values.get('network')) as WalletInput['network']
                  const type = String(values.get('walletType')) as WalletInput['type']
                  const existing = savedWallets.wallets?.items.find(
                    (item) =>
                      item.address.toLowerCase() === address.toLowerCase() &&
                      item.network === network,
                  )
                  try {
                    if (existing && savedWallets.wallets?.connectedId !== existing.id)
                      throw new Error('Reconecte a carteira selecionada antes de comprar.')
                    const ens = String(values.get('ens') ?? '').trim()
                    const secondary = String(values.get('secondaryWallet') ?? '').trim()
                    const collector: CollectorDetails = {
                      displayName: String(values.get('displayName')).trim(),
                      username: String(values.get('username')).trim(),
                      profileName: String(values.get('profileName')).trim(),
                      email: String(values.get('email')).trim(),
                      referralCode: String(values.get('referralCode')).trim(),
                      notes: String(values.get('notes') ?? '').trim(),
                    }
                    const input: WalletInput = {
                      name: collector.profileName,
                      address,
                      network,
                      type,
                      ens: ens
                        ? ens.endsWith('.eth')
                          ? ens
                          : `${ens}.eth`
                        : secondary.endsWith('.eth')
                          ? secondary
                          : '',
                      secondaryAddress: secondary.startsWith('0x') ? secondary : '',
                      ...collector,
                    }
                    const wallets = await savedWallets.mutation.mutateAsync({
                      method: existing ? 'patch' : 'post',
                      body: existing ? { ...input, id: existing.id } : input,
                    })
                    setReview({ walletId: wallets.selectedId!, collector })
                  } catch (error) {
                    setFormError(getApiError(error).message)
                  }
                }}
              >
                <div className="grid gap-x-6 gap-y-[17px] sm:grid-cols-2">
                  <label className={labelClass}>
                    <span>
                      Nome de exibição<span className="text-[#ed7955]">*</span>
                    </span>
                    <Input
                      name="displayName"
                      autoComplete="name"
                      required
                      key={user?.id ?? 'guest-name'}
                      defaultValue={user?.name ?? ''}
                      className={fieldClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span>
                      Nome de usuário<span className="text-[#ed7955]">*</span>
                    </span>
                    <Input
                      name="username"
                      defaultValue={user?.name.toLowerCase().replaceAll(' ', '') ?? ''}
                      required
                      className={fieldClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span>
                      Rede <span className="text-[#ed7955]">*</span>
                    </span>
                    <select
                      name="network"
                      required
                      defaultValue={selected?.network ?? ''}
                      className={`${fieldClass} w-full border px-3 text-catalog-secondary`}
                    >
                      <option value="" disabled>
                        Selecione uma rede
                      </option>
                      <option>Ethereum</option>
                      <option>Polygon</option>
                      <option>Solana</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span>
                      Nome do perfil<span className="text-[#ed7955]">*</span>
                    </span>
                    <Input
                      name="profileName"
                      defaultValue={selected?.profileName || selected?.name || ''}
                      required
                      className={fieldClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span>
                      Endereço da carteira<span className="text-[#ed7955]">*</span>
                    </span>
                    <Input
                      name="walletAddress"
                      defaultValue={selected?.address ?? ''}
                      required
                      placeholder="Endereço 0x da carteira"
                      className={fieldClass}
                    />
                  </label>
                  <label className={`${labelClass} sm:pt-6`}>
                    <span className="sr-only">ENS ou carteira secundária (opcional)</span>
                    <Input
                      name="secondaryWallet"
                      placeholder="ENS ou carteira secundária (opcional)"
                      className={fieldClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span>
                      Tipo de carteira<span className="text-[#ed7955]">*</span>
                    </span>
                    <select
                      name="walletType"
                      required
                      value={wallet}
                      onChange={(event) => setWallet(event.target.value)}
                      className={`${fieldClass} w-full border px-3 text-catalog-secondary`}
                    >
                      <option value="" disabled>
                        Selecione uma carteira
                      </option>
                      <option>MetaMask</option>
                      <option>WalletConnect</option>
                      <option>Coinbase Wallet</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span>
                      Código de indicação<span className="text-[#ed7955]">*</span>
                    </span>
                    <Input
                      name="referralCode"
                      defaultValue={selected?.referralCode ?? ''}
                      required
                      className={fieldClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span>
                      E-mail<span className="text-[#ed7955]">*</span>
                    </span>
                    <Input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      key={user?.email ?? 'guest-email'}
                      defaultValue={user?.email ?? ''}
                      className={fieldClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span>Nome ENS (opcional)</span>
                    <div className="flex gap-2">
                      <Input
                        name="ens"
                        defaultValue={selected?.ens ?? ''}
                        placeholder="nome.eth"
                        className={fieldClass}
                      />
                      <select name="ensSuffix" className={`${fieldClass} w-[78px] border px-2`}>
                        <option>.eth</option>
                      </select>
                    </div>
                  </label>
                </div>
                <label className="mt-6 flex items-center gap-2 text-[14px]">
                  <input
                    type="checkbox"
                    checked={otherWallet}
                    onChange={(event) => setOtherWallet(event.target.checked)}
                    className="size-4 shrink-0 appearance-none rounded-full border border-catalog-primary bg-clip-content p-[2px] checked:bg-catalog-primary focus-visible:outline-2 focus-visible:outline-catalog-accent"
                  />
                  Usar outra carteira?
                </label>
                {otherWallet && (
                  <label className={`${labelClass} mt-4`}>
                    <span>Outra carteira</span>
                    <Input
                      name="otherWallet"
                      required
                      placeholder="Informe o endereço da outra carteira"
                      className={fieldClass}
                    />
                  </label>
                )}
                <label className={`${labelClass} mt-6`}>
                  <span>Observação do colecionador (opcional)</span>
                  <textarea
                    name="notes"
                    maxLength={1000}
                    className="h-[152px] w-full rounded-[2px] border border-catalog-border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-catalog-primary sm:w-[350px]"
                  />
                </label>
              </form>
            </section>
            <section aria-labelledby="nfts-heading" className="min-w-0">
              <h2 id="nfts-heading" className="text-[16px] font-bold leading-4">
                Seus NFTs
              </h2>
              <div className="mt-3 flex justify-between border-b border-catalog-border pb-2 text-[16px] leading-5">
                <span>NFTs</span>
                <span>Subtotal</span>
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
                <div className="py-6 text-sm">
                  <p>Seu carrinho está vazio.</p>
                  <Link
                    to="/"
                    hash="catalogo"
                    className="mt-3 inline-block text-catalog-accent underline"
                  >
                    Explorar NFTs
                  </Link>
                </div>
              )}
              <ul className="mt-3 space-y-3">
                {cart?.items.map((item) => (
                  <li key={item.id} className="bg-surface">
                    <div className="flex min-h-[70px] items-center gap-2 pr-3">
                      <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-[70px] rounded-[6px] object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/nft/$nftId"
                          params={{ nftId: item.nftId }}
                          className="block truncate text-[14px] font-bold"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditing(editing === item.id ? null : item.id)}
                          aria-expanded={editing === item.id}
                          aria-label={`Editar ${item.name}, edição ${item.edition}`}
                          className="mt-1 text-left text-[12px] text-catalog-secondary underline-offset-2 hover:underline"
                        >
                          ID do token: #
                          {item.name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? item.nftId}
                        </button>
                      </div>
                      <button
                        type="button"
                        title="Editar quantidade"
                        onClick={() => setEditing(editing === item.id ? null : item.id)}
                        aria-label={`Editar quantidade de ${item.name}`}
                        aria-expanded={editing === item.id}
                        className="whitespace-nowrap text-[12px] text-catalog-secondary hover:underline"
                      >
                        (× {item.quantity})
                      </button>
                      <span className="whitespace-nowrap text-[18px] font-bold text-catalog-accent">
                        {item.total} ETH
                      </span>
                    </div>
                    {editing === item.id && (
                      <div className="flex flex-wrap items-center gap-3 border-t border-catalog-border p-3 text-xs">
                        <span>Edição: {item.edition}</span>
                        <Button
                          size="icon"
                          aria-label={`Diminuir ${item.name}`}
                          disabled={mutation.isPending || item.quantity === 1}
                          onClick={() =>
                            action({
                              method: 'patch',
                              body: { id: item.id, quantity: item.quantity - 1 },
                            })
                          }
                        >
                          −
                        </Button>
                        <output aria-label={`Quantidade de ${item.name}`}>{item.quantity}</output>
                        <Button
                          size="icon"
                          aria-label={`Aumentar ${item.name}`}
                          disabled={mutation.isPending || item.quantity >= item.maximum}
                          onClick={() =>
                            action({
                              method: 'patch',
                              body: { id: item.id, quantity: item.quantity + 1 },
                            })
                          }
                        >
                          +
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={mutation.isPending}
                          onClick={() => action({ method: 'delete', body: { id: item.id } })}
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setCouponOpen(!couponOpen)}
                aria-expanded={couponOpen}
                className="mt-3 w-full text-center text-[14px]"
              >
                Tem um código promocional? Aplique aqui
              </button>
              {couponOpen && (
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    action({ method: 'put', body: { coupon } })
                  }}
                >
                  <Input
                    aria-label="Código promocional"
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder="Código promocional"
                  />
                  <Button disabled={mutation.isPending || !cart?.count}>Aplicar</Button>
                </form>
              )}
              {cart?.coupon && (
                <p className="mt-2 text-xs text-catalog-accent">
                  {cart.coupon} aplicado{' '}
                  <button
                    disabled={mutation.isPending}
                    onClick={() => action({ method: 'put', body: { coupon: '' } })}
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
              <dl className={query.isPending ? 'hidden' : 'mt-3 space-y-3 text-[14px] leading-5'}>
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="text-[18px] leading-5">{cart?.subtotal ?? '—'} ETH</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Desconto do lançamento</dt>
                  <dd>(-) {cart?.discount ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Taxa de rede</dt>
                  <dd className="text-[18px] leading-5">{cart?.networkFee ?? '—'} ETH</dd>
                </div>
                <div className="text-center text-[12px] text-catalog-primary">
                  <dt className="sr-only">Estimativa da taxa</dt>
                  <dd>Taxa estimada</dd>
                </div>
                <div className="flex justify-between border-t border-catalog-border px-10 pt-3 text-[16px] font-bold">
                  <dt>Total</dt>
                  <dd className="text-catalog-accent">{cart?.total ?? '—'} ETH</dd>
                </div>
              </dl>
              <fieldset className="mt-3">
                <legend className="mb-4 w-full text-center text-[16px] font-bold leading-4">
                  Carteira e rede
                </legend>
                <div className="space-y-4">
                  {['WalletConnect', 'MetaMask', 'Coinbase Wallet'].map((value) => (
                    <label
                      key={value}
                      className={`flex h-[45px] cursor-pointer items-center gap-3 rounded-[2px] border px-3 text-[14px] ${wallet === value ? 'border-catalog-primary' : 'border-catalog-border'}`}
                    >
                      <input
                        type="radio"
                        name="paymentWallet"
                        value={value}
                        checked={wallet === value}
                        onChange={() => setWallet(value)}
                        className="size-4 shrink-0 appearance-none rounded-full border border-catalog-primary bg-clip-content p-[2px] checked:bg-catalog-primary focus-visible:outline-2 focus-visible:outline-catalog-accent"
                      />
                      {value === 'WalletConnect' ? (
                        <span className="rounded border border-catalog-border bg-[#38220f] px-2 py-1 text-[9px] font-bold text-catalog-primary">
                          METAMASK · WALLETCONNECT · COINBASE
                        </span>
                      ) : (
                        value
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
              {formError && (
                <p role="alert" className="mt-3 text-sm text-[#ed7955]">
                  {formError}
                </p>
              )}
              {savedWallets.mutation.isError && !formError && (
                <p role="alert" className="mt-3 text-sm text-[#ed7955]">
                  {getApiError(savedWallets.mutation.error).message}
                </p>
              )}
              <Button
                type={user ? 'submit' : 'button'}
                form={user ? 'collector-form' : undefined}
                onClick={user ? undefined : () => setLogin(true)}
                disabled={
                  !cart?.count ||
                  mutation.isPending ||
                  query.isFetching ||
                  savedWallets.mutation.isPending
                }
                className="mt-6 h-[45px] w-full font-bold"
              >
                {savedWallets.mutation.isPending ? 'Preparando…' : 'Confirmar compra'}
              </Button>
            </section>
          </div>
        </main>
      </Container>
      <Footer
        onAction={setMessage}
        onCollection={() => void navigate({ to: '/', hash: 'catalogo' })}
      />
      {review && <CheckoutReview {...review} onClose={() => setReview(null)} />}
      {login && <LoginModal onClose={() => setLogin(false)} />}
      {message && (
        <HomeDialog open title={message.title} onClose={() => setMessage(null)}>
          <p>{message.body}</p>
        </HomeDialog>
      )}
    </>
  )
}
