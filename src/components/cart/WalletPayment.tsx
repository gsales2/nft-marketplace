import { useFormErrors } from '../../lib/useFormErrors'
import { CartItemsSkeleton, CartSummarySkeleton } from '../ui/Skeleton'
import { CheckoutReview } from './CheckoutReview'
import { WalletConnection } from './WalletConnection'
import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, MoreVertical, Wallet as WalletIcon } from 'lucide-react'
import { useWallets } from '../../lib/useWallets'
import { useCart } from '../../lib/useCart'
import { getApiError } from '../../lib/api'
import {
  walletTypes,
  walletNetworks,
  type Wallet,
  type WalletInput,
} from '../../lib/walletContracts'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { HomeDialog } from '../ui/HomeDialog'

const blank: WalletInput = {
  name: '',
  address: '',
  type: 'Coinbase Wallet',
  network: 'Ethereum',
  ens: '',
  secondaryAddress: '',
}
const radio =
  'size-4 shrink-0 appearance-none rounded-full border border-catalog-primary bg-clip-content p-[2px] checked:bg-catalog-primary focus-visible:outline-2 focus-visible:outline-catalog-accent'

function WalletPaymentContent() {
  const { user, wallets, query, mutation } = useWallets()
  const { cart, query: cartQuery } = useCart()
  const [form, setForm] = useState<WalletInput | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const selected = wallets?.items.find((wallet) => wallet.id === wallets.selectedId)
  const { formRef, fieldAttributes, fieldError } = useFormErrors(mutation.error)
  const busy = mutation.isPending
  const edit = (wallet?: Wallet) => {
    mutation.reset()
    setEditing(wallet?.id ?? null)
    setForm(
      wallet
        ? { ...wallet }
        : {
            ...blank,
            type: selected?.type ?? blank.type,
            network: selected?.network ?? blank.network,
          },
    )
  }
  const input = (name: keyof WalletInput, value: string) =>
    setForm((current) => (current ? { ...current, [name]: value } : null))
  if (!user)
    return (
      <main id="page-content" tabIndex={-1} className="p-7">
        <Link
          to="/login"
          search={{ returnTo: '/checkout' }}
          className="text-catalog-accent underline"
        >
          Entre novamente para continuar
        </Link>
      </main>
    )
  return (
    <main
      id="page-content"
      tabIndex={-1}
      className="mx-auto flex min-h-screen w-full max-w-[600px] flex-col px-7 pt-8 pb-[calc(32px+env(safe-area-inset-bottom))]"
    >
      <div className="relative mb-6 flex h-[35px] items-center justify-center">
        <Link
          to="/cart"
          aria-label="Voltar ao carrinho"
          className="absolute left-0 flex size-[35px] items-center justify-center rounded-full border border-catalog-border bg-[#321d14] text-catalog-secondary"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="pl-6 text-[clamp(14px,4.83vw,20px)] font-bold leading-6">
          Pagamento com carteira
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
      {wallets && (
        <>
          <div className="mb-4 flex justify-between gap-2 text-[clamp(12px,3.86vw,16px)] font-bold leading-4">
            <h2>
              {selected
                ? wallets.connectedId === selected.id
                  ? 'Carteira conectada'
                  : 'Carteira selecionada'
                : 'Nenhuma carteira selecionada'}
            </h2>
            {wallets.items.length > 0 && (
              <button
                type="button"
                onClick={() => edit()}
                className="whitespace-nowrap text-catalog-accent"
              >
                Trocar carteira
              </button>
            )}
          </div>
          <fieldset aria-label="Carteiras salvas" className="space-y-5">
            {wallets.items.map((wallet) => (
              <div
                key={wallet.id}
                className="relative flex min-h-[93px] items-center rounded-[14px] bg-surface px-[19px] shadow-[0_14px_18px_-10px_rgba(0,0,0,0.5)]"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-5">
                  <input
                    type="radio"
                    name="savedWallet"
                    aria-label={`Selecionar ${wallet.name}`}
                    className={radio}
                    checked={selected?.id === wallet.id}
                    disabled={busy}
                    onChange={() =>
                      mutation.mutate({
                        method: 'patch',
                        body: { id: wallet.id, selectOnly: true },
                      })
                    }
                  />
                  <span className="min-w-0 py-3 pr-5">
                    <span className="block truncate text-[16px] font-bold leading-4">
                      {wallet.name}
                    </span>
                    <span className="mt-2 block truncate text-[14px] leading-[22px] text-catalog-muted">
                      {wallet.ens || `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`}
                      <br />
                      {wallet.network === 'Ethereum'
                        ? 'Rede principal Ethereum'
                        : `Rede ${wallet.network}`}
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  aria-label={`Editar carteira ${wallet.name}`}
                  disabled={busy}
                  onClick={() => edit(wallet)}
                  className="absolute right-2 flex size-8 items-center justify-center text-catalog-secondary"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            ))}
          </fieldset>
          {!selected && (
            <Button
              variant="outline"
              onClick={() => edit()}
              className="mt-3 h-[50px] w-full rounded-full"
            >
              Conectar carteira
            </Button>
          )}
          <fieldset className="mt-4">
            <legend className="mb-4 flex w-full items-center justify-between gap-2 text-[16px] font-bold leading-4">
              <span>Carteira e rede</span>
              {selected && (
                <select
                  aria-label="Rede da carteira"
                  value={selected.network}
                  disabled={busy}
                  onChange={(event) =>
                    mutation.mutate({
                      method: 'patch',
                      body: { ...selected, network: event.target.value as WalletInput['network'] },
                    })
                  }
                  className="max-w-[40%] rounded bg-background p-1 text-[12px] font-normal text-catalog-muted"
                >
                  {walletNetworks.map((network) => (
                    <option key={network}>{network}</option>
                  ))}
                </select>
              )}
            </legend>
            <div className="space-y-4">
              {walletTypes.map((type) => (
                <label
                  key={type}
                  className="flex h-[65px] cursor-pointer items-center gap-3 rounded-[14px] bg-surface px-[14px] shadow-[0_14px_18px_-10px_rgba(0,0,0,0.5)]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-catalog-border bg-[#321d14] text-[16px] font-bold text-catalog-accent">
                    {type === 'Coinbase Wallet' ? <WalletIcon size={22} /> : type[0]}
                  </span>
                  <span className="flex-1 text-[14px]">{type}</span>
                  <input
                    className={radio}
                    type="radio"
                    name="walletProvider"
                    aria-label={type}
                    checked={selected?.type === type}
                    disabled={busy}
                    onChange={() =>
                      selected
                        ? mutation.mutate({ method: 'patch', body: { ...selected, type } })
                        : setForm({ ...blank, type })
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}
      <WalletConnection />
      {mutation.isError && !form && (
        <p role="alert" className="mt-3 text-sm text-[#ed7955]">
          {getApiError(mutation.error).message}
        </p>
      )}
      {cartQuery.isError && (
        <div role="alert" className="mt-4 text-sm">
          <p>{getApiError(cartQuery.error).message}</p>
          <Button onClick={() => void cartQuery.refetch()}>Tentar novamente</Button>
        </div>
      )}
      {cart?.count === 0 && (
        <p className="mt-4 text-sm">
          Seu carrinho está vazio.{' '}
          <Link to="/cart" className="underline">
            Voltar
          </Link>
        </p>
      )}
      {cartQuery.isPending && <CartSummarySkeleton />}
      <p className="mt-4 flex justify-end gap-7 text-[18px] font-bold leading-6">
        Total: <span className="text-catalog-accent">{cart?.total ?? '—'} ETH</span>
      </p>
      <Button
        disabled={!selected || !cart?.count || busy || query.isFetching || cartQuery.isFetching}
        onClick={() => setReviewOpen(true)}
        className="mt-auto h-[60px] w-full shrink-0 rounded-full bg-gradient-to-br from-catalog-primary to-[#ab7344] text-[16px] font-bold"
      >
        Confirmar compra
      </Button>
      {form && (
        <HomeDialog
          open
          title={editing ? 'Editar carteira' : 'Conectar carteira'}
          onClose={() => setForm(null)}
        >
          <form
            ref={formRef}
            className="space-y-4 text-sm"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate(
                {
                  method: editing ? 'patch' : 'post',
                  body: editing ? { ...form, id: editing } : form,
                },
                { onSuccess: () => setForm(null) },
              )
            }}
          >
            <p className="text-catalog-muted">Conexão simulada para este desafio.</p>
            <label className="block">
              Nome da carteira
              <Input
                autoFocus
                required
                maxLength={60}
                {...fieldAttributes('name')}
                aria-label="Nome da carteira"
                value={form.name}
                onChange={(event) => input('name', event.target.value)}
                placeholder="Principal ou Reserva"
                className="mt-1"
              />
              {fieldError('name')}
            </label>
            <label className="block">
              Endereço da carteira
              <Input
                required
                {...fieldAttributes('address')}
                aria-label="Endereço da carteira"
                value={form.address}
                onChange={(event) => input('address', event.target.value)}
                placeholder={
                  form.network === 'Solana' ? 'Endereço Solana' : 'Endereço 0x da carteira'
                }
                className="mt-1"
              />
              {fieldError('address')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                Tipo de carteira
                <select
                  aria-label="Tipo de carteira"
                  className="mt-1 w-full rounded border border-catalog-border bg-background p-2"
                  value={form.type}
                  onChange={(event) => input('type', event.target.value)}
                >
                  {walletTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label>
                Rede
                <select
                  aria-label="Rede"
                  className="mt-1 w-full rounded border border-catalog-border bg-background p-2"
                  value={form.network}
                  onChange={(event) => input('network', event.target.value)}
                >
                  {walletNetworks.map((network) => (
                    <option key={network}>{network}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              Nome ENS (opcional)
              <Input
                {...fieldAttributes('ens')}
                aria-label="Nome ENS (opcional)"
                value={form.ens}
                onChange={(event) => input('ens', event.target.value)}
                placeholder="nome.eth"
                className="mt-1"
              />
              {fieldError('ens')}
            </label>
            <label className="block">
              Carteira secundária (opcional)
              <Input
                {...fieldAttributes('secondaryAddress')}
                aria-label="Carteira secundária (opcional)"
                value={form.secondaryAddress}
                onChange={(event) => input('secondaryAddress', event.target.value)}
                placeholder="Endereço da carteira secundária"
                className="mt-1"
              />
              {fieldError('secondaryAddress')}
            </label>
            {mutation.isError && (
              <p role="alert" className="text-[#ed7955]">
                {getApiError(mutation.error).message}
              </p>
            )}
            <Button disabled={busy} className="w-full">
              {busy ? 'Conectando…' : editing ? 'Salvar carteira' : 'Conectar carteira'}
            </Button>
          </form>
        </HomeDialog>
      )}
      {reviewOpen && selected && (
        <CheckoutReview walletId={selected.id} onClose={() => setReviewOpen(false)} />
      )}
    </main>
  )
}

export function WalletPayment() {
  const { user } = useAuth()
  return user ? (
    <WalletPaymentContent key={user.id} />
  ) : (
    <main id="page-content" tabIndex={-1} className="p-7">
      <Link
        to="/login"
        search={{ returnTo: '/checkout' }}
        className="text-catalog-accent underline"
      >
        Entre novamente para continuar
      </Link>
    </main>
  )
}
