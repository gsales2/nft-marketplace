import { useFormErrors } from '../../lib/useFormErrors'
import { useState } from 'react'
import { useWallets } from '../../lib/useWallets'
import {
  walletNetworks,
  walletTypes,
  type Wallet,
  type WalletInput,
} from '../../lib/walletContracts'
import { getApiError } from '../../lib/api'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface Draft {
  name: string
  address: string
  type: string
  network: string
  ens: string
  secondaryAddress: string
  displayName: string
  profileName: string
  referralCode: string
  email: string
}
function WalletForm({
  wallet,
  secondary,
  onSaved,
}: {
  wallet?: Wallet
  secondary?: boolean
  onSaved: () => void
}) {
  const { user, mutation } = useWallets()
  const [draft, setDraft] = useState<Draft>({
    name: wallet?.name ?? '',
    address: wallet?.address ?? '',
    type: wallet?.type ?? '',
    network: wallet?.network ?? '',
    ens: wallet?.ens ?? '',
    secondaryAddress: wallet?.secondaryAddress ?? '',
    displayName: wallet?.displayName || user?.name || '',
    profileName: wallet?.profileName || user?.name || '',
    referralCode: wallet?.referralCode ?? '',
    email: wallet?.email || user?.email || '',
  })
  const { formRef, fieldAttributes, fieldError } = useFormErrors(mutation.error)
  const [saved, setSaved] = useState(false)
  const update = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
    mutation.reset()
  }
  const field = (key: keyof Draft, title: string, required = true, placeholder?: string) => (
    <label className="flex min-w-0 flex-col text-[15px] leading-5">
      <span>
        {title}
        {required && <span className="ml-1 text-[#ed7955]">*</span>}
      </span>
      <Input
        {...fieldAttributes(key)}
        name={key}
        aria-label={title}
        required={required}
        disabled={mutation.isPending}
        type={key === 'email' ? 'email' : 'text'}
        value={draft[key]}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-[2px] bg-background"
      />
      {fieldError(key)}
    </label>
  )
  return (
    <form
      ref={formRef}
      aria-label={secondary ? 'Carteira secundária' : 'Carteira principal'}
      className="mt-9"
      onSubmit={async (event) => {
        event.preventDefault()
        const body: WalletInput = {
          ...draft,
          type: draft.type as WalletInput['type'],
          network: draft.network as WalletInput['network'],
          ens: draft.ens && !draft.ens.endsWith('.eth') ? `${draft.ens}.eth` : draft.ens,
          secondaryAddress: draft.secondaryAddress.endsWith('.eth') ? '' : draft.secondaryAddress,
        }
        if (!body.ens && draft.secondaryAddress.endsWith('.eth')) body.ens = draft.secondaryAddress
        try {
          await mutation.mutateAsync({
            method: wallet ? 'patch' : 'post',
            body: wallet ? { ...body, id: wallet.id } : body,
          })
          setSaved(true)
          onSaved()
        } catch {
          /* API errors are shown below. */
        }
      }}
    >
      <div className="grid gap-x-7 gap-y-8 sm:grid-cols-2">
        {field('displayName', 'Nome de exibição')}
        {field('name', 'Apelido da carteira')}
        <label className="flex flex-col text-[15px] leading-5">
          <span>
            Rede <span className="text-[#ed7955]">*</span>
          </span>
          <select
            aria-label="Rede"
            required
            disabled={mutation.isPending}
            value={draft.network}
            onChange={(event) => update('network', event.target.value)}
            className="h-10 w-full rounded-[2px] border border-catalog-border bg-background px-3 text-catalog-secondary"
          >
            <option value="" disabled>
              Selecione uma rede
            </option>
            {walletNetworks.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {field('profileName', 'Nome do perfil')}
        {field(
          'address',
          'Endereço da carteira',
          true,
          draft.network === 'Solana' ? 'Endereço Solana' : 'Endereço 0x da carteira',
        )}
        <label className="flex flex-col justify-end">
          <span className="sr-only">ENS ou carteira secundária (opcional)</span>
          <Input
            {...fieldAttributes('secondaryAddress')}
            aria-label="ENS ou carteira secundária (opcional)"
            disabled={mutation.isPending}
            value={draft.secondaryAddress}
            onChange={(event) => update('secondaryAddress', event.target.value)}
            placeholder="ENS ou carteira secundária (opcional)"
            className="h-10 rounded-[2px] bg-background"
          />
          {fieldError('secondaryAddress')}
        </label>
        <label className="flex flex-col text-[15px] leading-5">
          <span>
            Tipo de carteira<span className="ml-1 text-[#ed7955]">*</span>
          </span>
          <select
            aria-label="Tipo de carteira"
            required
            disabled={mutation.isPending}
            value={draft.type}
            onChange={(event) => update('type', event.target.value)}
            className="h-10 w-full rounded-[2px] border border-catalog-border bg-background px-3 text-catalog-secondary"
          >
            <option value="" disabled>
              Selecione uma carteira
            </option>
            {walletTypes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {field('referralCode', 'Código de indicação', false)}
        {field('email', 'E-mail')}
        <label className="flex flex-col text-[15px] leading-5">
          <span>
            Nome ENS <span className="text-xs text-catalog-secondary">(opcional)</span>
          </span>
          <span className="flex gap-3">
            <span className="flex h-10 items-center rounded-[2px] border border-catalog-border px-3">
              .eth
            </span>
            <Input
              {...fieldAttributes('ens')}
              aria-label="Nome ENS"
              disabled={mutation.isPending}
              value={draft.ens}
              onChange={(event) => update('ens', event.target.value)}
              className="h-10 min-w-0 rounded-[2px] bg-background"
            />
          </span>
          {fieldError('ens')}
        </label>
      </div>
      {mutation.isError && (
        <p role="alert" className="mt-4 text-sm text-[#ed7955]">
          {getApiError(mutation.error).message}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-4 text-sm text-catalog-accent">
          Carteira salva com sucesso.
        </p>
      )}
      <Button disabled={mutation.isPending} className="mt-8 h-10 rounded-[2px] font-bold">
        {mutation.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
export function ProfileWallets() {
  const { user, query, wallets, mutation } = useWallets()
  const [adding, setAdding] = useState(false)
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const primary = wallets?.items[0]
  const others = wallets?.items.slice(1) ?? []
  const secondary = others.find((item) => item.id === editing)
  if (query.isPending) return <p role="status">Carregando carteiras…</p>
  if (query.isError)
    return (
      <div role="alert">
        <p>{getApiError(query.error).message}</p>
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
      </div>
    )
  return (
    <section key={user?.id}>
      <div className="flex justify-between gap-4">
        <h1 className="text-[17px] font-bold">Carteira principal</h1>
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => {
            setAdding(true)
            setEditing(null)
            setSecondaryOpen(true)
          }}
          className="text-[17px] font-bold text-catalog-accent"
        >
          Adicionar
        </button>
      </div>
      <p className="mt-1 text-[14px] leading-5 text-catalog-muted">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
      </p>
      <WalletForm key={primary?.id ?? 'primary-new'} wallet={primary} onSaved={() => undefined} />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[17px] font-bold">Carteira secundária</h2>
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="samePrimary"
              aria-label="Igual à carteira principal"
              checked={!!primary && wallets?.selectedId === primary.id}
              disabled={!primary || mutation.isPending}
              onChange={() =>
                primary &&
                mutation.mutate({ method: 'patch', body: { id: primary.id, selectOnly: true } })
              }
              className="accent-[#d28a4c]"
            />
            Igual à carteira principal
          </label>
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setEditing(null)
              setSecondaryOpen(true)
            }}
            className="text-[17px] font-bold text-catalog-accent"
          >
            Adicionar
          </button>
        </div>
      </div>
      {!others.length && (
        <p className="mt-2 text-[14px] text-catalog-muted">
          Você ainda não adicionou uma carteira secundária.
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {others.map((wallet) => (
          <li
            key={wallet.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-catalog-border bg-surface p-4"
          >
            <label className="flex min-w-0 items-center gap-3">
              <input
                type="radio"
                name="samePrimary"
                aria-label={`Selecionar ${wallet.name}`}
                checked={wallets?.selectedId === wallet.id}
                disabled={mutation.isPending}
                onChange={() =>
                  mutation.mutate({ method: 'patch', body: { id: wallet.id, selectOnly: true } })
                }
                className="accent-[#d28a4c]"
              />
              <span className="min-w-0">
                <strong>{wallet.name}</strong>
                <span className="mt-1 block break-all text-sm text-catalog-muted">
                  {wallet.ens || wallet.address} · {wallet.network}
                </span>
              </span>
            </label>
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setEditing(wallet.id)
                setSecondaryOpen(true)
              }}
              className="text-catalog-accent"
            >
              Editar {wallet.name}
            </button>
          </li>
        ))}
      </ul>
      {mutation.isError && (
        <p role="alert" className="mt-4 text-sm text-[#ed7955]">
          {getApiError(mutation.error).message}
        </p>
      )}
      {secondaryOpen && (
        <div className="mt-6 border-t border-catalog-border pt-4">
          <div className="flex justify-between gap-4">
            <h3 className="font-bold">
              {adding ? 'Adicionar carteira' : 'Editar carteira secundária'}
            </h3>
            <button
              type="button"
              onClick={() => setSecondaryOpen(false)}
              className="text-catalog-accent"
            >
              Cancelar
            </button>
          </div>
          <WalletForm
            key={adding ? 'secondary-new' : secondary?.id}
            wallet={adding ? undefined : secondary}
            secondary
            onSaved={() => setSecondaryOpen(false)}
          />
        </div>
      )}
    </section>
  )
}
