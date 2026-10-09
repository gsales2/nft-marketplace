import { useFormErrors } from '../../lib/useFormErrors'
import { useQuery } from '@tanstack/react-query'
import { api, getApiError } from '../../lib/api'
import type { Order } from '../../lib/orderContracts'
import { useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  UserRound,
  MapPin,
  ShoppingCart,
  Heart,
  Image as ImageIcon,
  Download,
  TriangleAlert,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Header } from '../layout/Header'
import { Container } from '../layout/Container'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useProfile } from '../../lib/useProfile'
import { useAuth } from '../../lib/auth'
import { useFavorites } from '../../lib/useFavorites'
import { ProfileWallets } from './ProfileWallets'
import { catalogItems } from '../../lib/catalogData'
import type { Profile, ProfileUpdate } from '../../lib/profileContracts'

const sections = [
  { name: 'Dados do perfil', icon: UserRound },
  { name: 'Carteiras', icon: MapPin },
  { name: 'Atividade', icon: ShoppingCart },
  { name: 'Lista de interesse', icon: Heart },
  { name: 'Ofertas', icon: ImageIcon },
  { name: 'Arquivos baixados', icon: Download },
  { name: 'Suporte', icon: TriangleAlert },
]
function ProfileForm({ profile }: { profile: Profile }) {
  const { mutation } = useProfile()
  const { formRef, fieldAttributes, fieldError } = useFormErrors(mutation.error)
  const [values, setValues] = useState<ProfileUpdate>({
    ...profile,
    currentPassword: '',
    newPassword: '',
    confirmation: '',
  })
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const update = (key: keyof ProfileUpdate, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setFeedback('')
    mutation.reset()
  }
  const field = (key: keyof ProfileUpdate, label: string, required = true, type = 'text') => (
    <label className="flex min-w-0 flex-col gap-[14px] text-[15px] leading-5">
      <span>
        {label}
        {required && <span className="ml-1 text-[#ed7955]">*</span>}
      </span>
      <Input
        {...fieldAttributes(key)}
        name={key}
        type={type}
        required={required}
        disabled={mutation.isPending}
        value={values[key]}
        onChange={(event) => update(key, event.target.value)}
        className="h-10 rounded-[2px] bg-background"
      />
      {fieldError(key)}
    </label>
  )
  const upload = async (image?: File) => {
    if (!image) return
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(image.type) ||
      image.size > 500 * 1024
    ) {
      setFeedback('Use uma imagem PNG, JPEG ou WebP de até 500 KB.')
      return
    }
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(image)
      })
      update('avatar', result)
    } catch {
      setFeedback('Não foi possível ler a imagem. Tente novamente.')
    }
  }
  return (
    <form
      ref={formRef}
      onSubmit={async (event) => {
        event.preventDefault()
        setFeedback('')
        try {
          await mutation.mutateAsync(values)
          setValues((current) => ({
            ...current,
            currentPassword: '',
            newPassword: '',
            confirmation: '',
          }))
          setFeedback('Perfil salvo com sucesso.')
        } catch {
          /* API errors are displayed below. */
        }
      }}
    >
      <h1 className="mb-9 text-[17px] font-bold leading-5">Perfil do colecionador</h1>
      <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
        {field('name', 'Nome de exibição')}
        {field('username', 'Nome de usuário')}
        {field('email', 'E-mail', true, 'email')}
        <label className="flex flex-col gap-[14px] text-[15px] leading-5">
          <span>
            Nome ENS <span className="text-xs text-catalog-secondary">(opcional)</span>
          </span>
          <div className="flex gap-3">
            <span className="flex h-10 items-center rounded-[2px] border border-catalog-border px-3">
              .eth
            </span>
            <Input
              aria-label="Nome ENS"
              {...fieldAttributes('ens')}
              value={values.ens}
              disabled={mutation.isPending}
              onChange={(event) => update('ens', event.target.value)}
              placeholder="nome.eth"
              className="h-10 min-w-0 rounded-[2px] bg-background"
            />
          </div>
          {fieldError('ens')}
        </label>
        {field('walletNickname', 'Apelido da carteira')}
        <div>
          <p className="mb-2 text-[15px]">Avatar</p>
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex size-[50px] items-center justify-center overflow-hidden rounded-full border border-catalog-border bg-[#321d14] text-catalog-primary">
              {values.avatar ? (
                <img
                  src={values.avatar}
                  alt="Avatar do perfil"
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon size={24} />
              )}
            </span>
            <input
              ref={file}
              aria-label="Imagem do avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={mutation.isPending}
              onChange={(event) => {
                void upload(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <Button
              type="button"
              disabled={mutation.isPending}
              onClick={() => file.current?.click()}
              className="h-10 rounded-[2px] px-6 font-bold"
            >
              Alterar
            </Button>
            <button
              type="button"
              disabled={!values.avatar || mutation.isPending}
              onClick={() => update('avatar', '')}
              className="text-[14px] disabled:opacity-50"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
      <h2 className="mt-8 mb-5 text-[17px] font-bold">Alterar senha</h2>
      <div className="space-y-6 sm:w-[calc(50%-14px)]">
        {(
          [
            { key: 'currentPassword', title: 'Senha atual', autocomplete: 'current-password' },
            { key: 'newPassword', title: 'Nova senha', autocomplete: 'new-password' },
            { key: 'confirmation', title: 'Confirmar nova senha', autocomplete: 'new-password' },
          ] as const
        ).map(({ key, title, autocomplete }) => (
          <label key={key} className="block text-[15px]">
            <span>{title}</span>
            <span className="relative mt-2 block">
              <Input
                {...fieldAttributes(key)}
                aria-label={title}
                name={key}
                autoComplete={autocomplete}
                type={visible[key] ? 'text' : 'password'}
                required={!!(values.currentPassword || values.newPassword || values.confirmation)}
                minLength={key === 'currentPassword' ? undefined : 8}
                disabled={mutation.isPending}
                value={values[key]}
                onChange={(event) => update(key, event.target.value)}
                className="h-10 rounded-[2px] bg-background pr-12"
              />
              <button
                type="button"
                aria-label={`${visible[key] ? 'Ocultar' : 'Mostrar'} ${title.toLowerCase()}`}
                onClick={() => setVisible((current) => ({ ...current, [key]: !current[key] }))}
                className="absolute right-3 top-0 flex h-10 items-center text-catalog-secondary"
              >
                {visible[key] ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </span>
            {fieldError(key)}
          </label>
        ))}
      </div>
      {mutation.isError && (
        <p role="alert" className="mt-5 text-sm text-[#ed7955]">
          {getApiError(mutation.error).message}
        </p>
      )}
      {feedback && (
        <p role="status" className="mt-5 text-sm text-catalog-accent">
          {feedback}
        </p>
      )}
      <Button disabled={mutation.isPending} className="mt-8 h-10 w-[132px] rounded-[2px] font-bold">
        {mutation.isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}
function ProfileSections({ section }: { section: string }) {
  const favorites = useFavorites()

  if (section === 'Lista de interesse')
    return (
      <section>
        <h1 className="mb-6 text-lg font-bold">Lista de interesse</h1>
        {favorites.query.isPending && <p role="status">Carregando…</p>}
        {favorites.query.isError && (
          <p role="alert">{getApiError(favorites.query.error).message}</p>
        )}
        {!favorites.favorites.length && !favorites.query.isPending && (
          <p>Você ainda não favoritou NFTs.</p>
        )}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {catalogItems
            .filter((item) => favorites.favorites.includes(item.id))
            .map((item) => (
              <Link key={item.id} to="/nft/$nftId" params={{ nftId: item.id }}>
                <img
                  src={item.image}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <p className="mt-2">{item.name}</p>
                <p className="text-catalog-accent">{item.price.toFixed(2)} ETH</p>
              </Link>
            ))}
        </div>
      </section>
    )
  if (section === 'Carteiras') return <ProfileWallets />
  return (
    <section>
      <h1 className="mb-6 text-lg font-bold">{section}</h1>
      <p className="text-catalog-muted">
        {section === 'Suporte'
          ? 'Para dúvidas sobre sua conta, entre em contato: contato@email.com.'
          : section === 'Ofertas'
            ? 'Você ainda não tem ofertas. O envio de ofertas será disponibilizado em uma próxima etapa.'
            : 'Não há arquivos disponíveis para download nesta demonstração.'}
      </p>
    </section>
  )
}
function Activity() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['private', user?.id, 'orders'],
    queryFn: async ({ signal }) => (await api.get<Order[]>('/orders', { signal })).data,
    enabled: !!user,
    retry: false,
  })
  return (
    <section>
      <h1 className="mb-6 text-lg font-bold">Atividade</h1>
      {query.isPending && <p role="status">Carregando compras…</p>}
      {query.isError && (
        <div role="alert">
          <p>{getApiError(query.error).message}</p>
          <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        </div>
      )}
      {query.data?.length === 0 && <p>Você ainda não realizou compras.</p>}
      <ul className="space-y-4">
        {query.data?.map((order) => (
          <li key={order.id} className="rounded border border-catalog-border bg-surface p-4">
            <p className="font-bold">
              Compra fictícia · {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </p>
            <p className="mt-2 text-catalog-muted">
              {order.cart.count} NFTs · {order.cart.total} ETH · {order.wallet.type}
            </p>
            <Link
              to="/checkout"
              search={{ order: order.id }}
              className="mt-3 inline-block text-catalog-accent underline"
            >
              Ver comprovante
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
export function ProfilePage() {
  const { user, query } = useProfile()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState('Dados do perfil')

  if (!user)
    return (
      <main id="page-content" tabIndex={-1} className="p-7">
        <Link to="/login" search={{ returnTo: '/profile' }}>
          Entre para acessar seu perfil
        </Link>
      </main>
    )
  return (
    <>
      <div className="pt-6">
        <Header
          onLogin={() => void navigate({ to: '/profile' })}
          onSearch={() => void navigate({ to: '/', hash: 'catalogo' })}
          onFilters={() => void navigate({ to: '/', hash: 'catalogo' })}
        />
      </div>
      <Container>
        <main
          id="page-content"
          tabIndex={-1}
          className="mt-8 grid items-start gap-7 pb-16 md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)] xl:gap-7"
        >
          <aside className="min-w-0 bg-surface">
            <h2 className="px-3 pt-4 text-[18px] font-bold">Meu perfil</h2>
            <nav aria-label="Seções do perfil" className="mt-2 flex overflow-x-auto md:block">
              {sections.map(({ name, icon: Icon }) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => setSection(name)}
                  aria-current={section === name ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-4 border-l-[6px] px-3 py-3 text-left text-[15px] text-catalog-accent md:w-full ${section === name ? 'border-catalog-primary' : 'border-transparent'}`}
                >
                  <Icon size={18} />
                  {name}
                </button>
              ))}
            </nav>
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() =>
                void logout
                  .mutateAsync()
                  .then(() => navigate({ to: '/' }))
                  .catch(() => undefined)
              }
              className="flex w-full items-center gap-4 border-t border-catalog-border px-4 py-3 text-[15px] font-bold text-catalog-accent"
            >
              <LogOut size={18} />
              {logout.isPending ? 'Saindo…' : 'Sair'}
            </button>
            {logout.isError && (
              <p role="alert" className="p-4 text-sm">
                {getApiError(logout.error).message}
              </p>
            )}
          </aside>
          <div className="min-w-0">
            {section === 'Dados do perfil' ? (
              <>
                {query.isPending && <p role="status">Carregando perfil…</p>}
                {query.isError && (
                  <div role="alert">
                    <p>{getApiError(query.error).message}</p>
                    <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
                  </div>
                )}
                {query.data && <ProfileForm key={user.id} profile={query.data} />}
              </>
            ) : section === 'Atividade' ? (
              <Activity />
            ) : (
              <ProfileSections section={section} />
            )}
          </div>
        </main>
      </Container>
    </>
  )
}
