import { useRelatedNFTs } from '../../lib/useCatalog'
import { usePublicSnapshotRevalidation } from '../../lib/usePublicSnapshotRevalidation'
import { ChevronLeft, Heart, ShoppingCart, Star } from 'lucide-react'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { useCart } from '../../lib/useCart'
import { useFavorites } from '../../lib/useFavorites'
import { getApiError } from '../../lib/api'
import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Container } from '../layout/Container'
import { Header } from '../layout/Header'
import { Footer } from '../layout/Footer'
import { LoginModal } from '../ui/LoginModal'
import { HomeDialog } from '../ui/HomeDialog'
import { type HomeMessage } from '../../lib/catalogData'
import { type nftView } from '../../lib/catalogContracts'

const editions = ['1/1', '1/10', '1/50', 'ABERTA'] as const
const icons = '/images/details/'

export function NFTDetailsPage({ nft }: { nft: ReturnType<typeof nftView> }) {
  usePublicSnapshotRevalidation()
  const { mutation: cartMutation, query: cartQuery } = useCart()
  const navigate = useNavigate()
  const mobile = useMediaQuery('(max-width: 767px)')
  const [loginOpen, setLoginOpen] = useState(false)
  const [message, setMessage] = useState<HomeMessage | null>(null)
  const [zoom, setZoom] = useState(false)
  const [thumbnail, setThumbnail] = useState(1)
  const [edition, setEdition] = useState<string>('1/50')
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<'details' | 'reviews'>('details')
  const [relatedPage, setRelatedPage] = useState(1)
  const { favorites, user, mutation: favoriteMutation, query: favoritesQuery } = useFavorites()
  const name = nft.name ?? 'Obra digital'
  const token = name.match(/#(\d+)/)?.[1]?.padStart(4, '0') ?? nft.id
  const favorite = favorites.includes(nft.id)
  const available = (value: string) =>
    nft.editions.find((item) => item.name === value)?.available ?? 0
  const maximum = available(edition)
  const collectionName = nft.collection === 'Arte digital' ? 'Kurio Apes' : nft.collection
  const attributes = nft.image.includes('Emerald')
    ? 'Óculos, Esmeralda, Raro'
    : nft.image.includes('Sage')
      ? 'Chapéu, Violeta, Explorador'
      : nft.image.includes('Neon')
        ? 'Marfim, Elegante, Raro'
        : 'Fones, Dourado, Música'
  const relatedQuery = useRelatedNFTs(nft.id)
  const candidates = relatedQuery.data ?? []
  const relatedItems = candidates.slice(
    ((relatedPage + 2) % 3) * 5,
    (((relatedPage + 2) % 3) + 1) * 5,
  )
  const toggleFavorite = () => {
    if (!user) {
      setLoginOpen(true)
      return
    }
    if (favoriteMutation.isPending || favoritesQuery.isPending) return
    favoriteMutation.mutate(
      { id: nft.id, remove: favorite },
      {
        onError: (error) =>
          setMessage({
            title: 'Não foi possível atualizar favoritos',
            body: getApiError(error).message,
          }),
      },
    )
  }
  const share = async (destination: string) => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setMessage({
        title: 'Link copiado',
        body: `O link de ${name} foi copiado para compartilhar ${destination}.`,
      })
    } catch {
      setMessage({
        title: 'Compartilhar NFT',
        body: `Copie este endereço: ${window.location.href}`,
      })
    }
  }
  return (
    <div className="text-[#f5f1eb]">
      {mobile ? (
        <main
          id="page-content"
          tabIndex={-1}
          className="min-h-screen overflow-x-clip pb-[calc(175px+env(safe-area-inset-bottom))] bg-[radial-gradient(ellipse_at_top,#321f17_0%,#140d0a_65%)] pt-[23px]"
        >
          <div className="mx-7 flex h-[35px] items-center justify-between">
            <Link
              to="/"
              hash="catalogo"
              aria-label="Voltar ao mercado"
              className="flex size-[35px] items-center justify-center rounded-full border border-catalog-border bg-[#321d14] text-catalog-muted"
            >
              <ChevronLeft size={21} />
            </Link>
            <button
              type="button"
              aria-label={favorite ? 'Favoritado' : 'Favoritar'}
              aria-pressed={favorite}
              disabled={!!user && (favoriteMutation.isPending || favoritesQuery.isPending)}
              onClick={toggleFavorite}
              className="flex size-[35px] items-center justify-center rounded-full border border-catalog-border bg-[#321d14] text-catalog-accent disabled:opacity-50"
            >
              <Heart size={20} fill={favorite ? 'currentColor' : 'none'} strokeWidth={1.5} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Ampliar imagem do NFT"
            onClick={() => setZoom(true)}
            className="mx-7 mt-2 block w-[calc(100%-56px)] overflow-hidden rounded-t-[24px]"
          >
            <img
              width={414}
              height={414}
              fetchPriority="high"
              src={nft.image}
              alt={name}
              className="aspect-square w-full object-cover"
            />
          </button>
          <section
            aria-label="NFT selecionado"
            className="relative -mt-[34px] rounded-t-[32px] bg-surface px-6 pt-8 pb-[37px]"
          >
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 text-[clamp(16px,4.83vw,20px)] font-bold leading-7">{name}</h1>
              <button
                type="button"
                onClick={() =>
                  setMessage({
                    title: 'Avaliações de colecionadores',
                    body: 'Ainda não há avaliações disponíveis para este NFT no catálogo demonstrativo. A nota e a contagem seguem a referência visual.',
                  })
                }
                aria-label="4.8(19) — Ver avaliações de colecionadores"
                className="flex h-[27px] shrink-0 items-center gap-1 rounded-full border border-catalog-primary px-1.5 text-[14px]"
              >
                <Star size={14} className="fill-catalog-accent text-catalog-accent" />
                <span>
                  4.8<span className="text-catalog-muted">(19)</span>
                </span>
              </button>
            </div>
            <p className="mt-4 text-[14px] leading-6 text-catalog-muted">
              Um colecionável digital {edition} finalizado à mão da coleção Kurio Editions,
              verificado na {nft.network}.
            </p>
            <fieldset className="mt-3">
              <legend className="mb-2 text-[15px] font-bold leading-5">Edição:</legend>
              <div className="flex flex-wrap gap-3">
                {editions.map((value) => (
                  <button
                    type="button"
                    key={value}
                    disabled={available(value) === 0}
                    aria-pressed={edition === value}
                    onClick={() => {
                      setEdition(value)
                      setQuantity((count) => Math.min(count, available(value)))
                    }}
                    className={`flex h-7 items-center justify-center rounded-[50%] border px-2 text-[14px] ${edition === value ? 'border-catalog-primary text-catalog-accent' : 'border-catalog-border text-catalog-muted'}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-3 space-y-3 text-[15px] leading-[20px] text-catalog-secondary">
              <p>ID do token: #{token}</p>
              <p>Coleção: {collectionName}</p>
              <p>Atributos: {attributes}</p>
            </div>
          </section>
          <section aria-labelledby="mobile-related-heading" className="px-6 pt-6 pb-8">
            <h2
              id="mobile-related-heading"
              className="border-b border-catalog-border pb-3 text-[17px] font-bold text-catalog-accent"
            >
              Mais desta coleção
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6">
              {relatedItems.map((item) => (
                <Link
                  key={item.id}
                  to="/nft/$nftId"
                  params={{ nftId: item.id }}
                  className="min-w-0"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="aspect-square w-full rounded-[14px] object-cover"
                  />
                  <h3 className="mt-2 text-[13px] leading-5">{item.name}</h3>
                  <p className="mt-1 text-[14px] font-bold text-catalog-accent">
                    {item.displayPrice ?? item.price.toFixed(2)} ETH
                  </p>
                </Link>
              ))}
            </div>
            <nav
              aria-label="Páginas de NFTs relacionados"
              className="mt-6 flex justify-center gap-3"
            >
              {[0, 1, 2].map((page) => (
                <button
                  key={page}
                  type="button"
                  aria-label={`Coleção página ${page + 1}`}
                  aria-current={page === relatedPage ? 'page' : undefined}
                  onClick={() => setRelatedPage(page)}
                  className={`size-3 rounded-full border border-catalog-primary ${page === relatedPage ? 'bg-catalog-primary' : 'bg-background'}`}
                />
              ))}
            </nav>
          </section>
          <section
            aria-label="Comprar NFT"
            className="fixed inset-x-0 bottom-0 z-30 rounded-t-[40px] bg-surface px-6 pt-5 pb-[calc(34px+env(safe-area-inset-bottom))] shadow-[0_-10px_24px_rgba(0,0,0,0.2)]"
          >
            {maximum === 0 && (
              <p role="status" className="mb-3 text-sm text-catalog-accent">
                Esta edição está esgotada. Selecione outra edição.
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3" aria-label="Quantidade">
                <span className="text-[15px] font-bold text-catalog-muted">Qtd.</span>
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  disabled={quantity === 1}
                  onClick={() => setQuantity((count) => Math.max(1, count - 1))}
                  className="flex h-[29px] w-5 items-center justify-center rounded-full border border-background bg-catalog-primary text-[22px] text-background"
                >
                  −
                </button>
                <output aria-label="Quantidade selecionada" className="text-[18px]">
                  {quantity}
                </output>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  disabled={quantity >= maximum}
                  onClick={() => setQuantity((count) => Math.min(maximum, count + 1))}
                  className="flex h-[29px] w-5 items-center justify-center rounded-full border border-background bg-catalog-primary text-[22px] text-background"
                >
                  +
                </button>
              </div>
              <p className="min-w-0 break-all text-right text-[clamp(17px,4.83vw,20px)] font-bold text-catalog-accent">
                {nft.displayPrice ?? nft.price.toFixed(2)} ETH
              </p>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                aria-label={cartMutation.isPending ? 'Adicionando…' : 'Comprar NFT'}
                disabled={cartMutation.isPending || cartQuery.isPending || quantity > maximum}
                onClick={() =>
                  cartMutation.mutate(
                    { method: 'post', body: { nftId: nft.id, edition, quantity } },
                    {
                      onError: (error) =>
                        setMessage({
                          title: 'Não foi possível adicionar ao carrinho',
                          body: getApiError(error).message,
                        }),
                    },
                  )
                }
                className="flex h-[60px] w-[196px] max-w-[calc(100%-72px)] items-center justify-center rounded-full bg-gradient-to-br from-catalog-primary to-[#ab7344] text-[16px] font-bold text-background disabled:opacity-50"
              >
                {cartMutation.isPending ? 'Adicionando…' : 'Comprar NFT'}
              </button>
              <Link
                to="/cart"
                aria-label="Abrir carrinho"
                className="flex size-[60px] shrink-0 items-center justify-center rounded-full border border-catalog-border bg-[#321d14] text-catalog-secondary"
              >
                <ShoppingCart size={21} fill="currentColor" />
              </Link>
            </div>
          </section>
        </main>
      ) : (
        <>
          <div className="pt-10 md:pt-8 xl:pt-6">
            <Header
              onLogin={() => setLoginOpen(true)}
              onSearch={() =>
                setMessage({
                  title: 'Explorar NFTs',
                  body: 'Volte ao mercado para pesquisar e filtrar a coleção.',
                })
              }
              onFilters={() => void navigate({ to: '/', hash: 'catalogo' })}
            />
          </div>
          <main id="page-content" tabIndex={-1}>
            <Container>
              <div className="mt-8">
                <nav
                  aria-label="Caminho da página"
                  className="mb-3 flex gap-2 text-[15px] font-bold leading-4"
                >
                  <Link to="/">Início</Link>
                  <span aria-hidden="true">/</span>
                  <Link to="/" hash="catalogo">
                    Mercado
                  </Link>
                </nav>
                <section aria-label="NFT selecionado" className="flex flex-col gap-8 xl:flex-row">
                  <div className="relative flex min-w-0 flex-col-reverse items-center gap-4 sm:flex-row sm:gap-7 xl:h-[448px] xl:w-[573px] xl:shrink-0">
                    <div
                      className="flex w-full justify-center gap-3 sm:w-[100px] sm:shrink-0 sm:flex-col sm:gap-4"
                      aria-label="Galeria do NFT"
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setThumbnail(index)}
                          aria-label={`Visualização ${index + 1} de ${name}`}
                          aria-pressed={thumbnail === index}
                          className={`aspect-square min-w-0 flex-1 overflow-hidden rounded-lg bg-surface sm:size-[100px] sm:flex-none ${thumbnail === index ? 'ring-1 ring-catalog-primary' : ''}`}
                        >
                          <img
                            src={nft.image}
                            alt=""
                            className="size-full rounded-lg object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <div className="relative flex aspect-square w-full min-w-0 items-center justify-center rounded-[6px] bg-surface p-5 sm:max-w-[444px] xl:size-[444px] xl:shrink-0">
                      <img
                        src={nft.image}
                        alt={name}
                        className="aspect-square w-full rounded-[24px] object-cover xl:size-[404px]"
                      />
                      <button
                        type="button"
                        onClick={() => setZoom(true)}
                        aria-label="Ampliar imagem do NFT"
                        className="absolute right-3 top-3 flex size-[30px] items-center justify-center"
                      >
                        <img src={`${icons}imgFrame238.svg`} alt="" />
                      </button>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-5 xl:h-[448px] xl:justify-between xl:gap-0">
                    <div className="relative pb-[13px] xl:max-w-[573px]">
                      <h1 className="text-[28px] font-bold leading-[37px]">{name}</h1>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[22px] font-bold leading-4 text-catalog-accent">
                          {nft.displayPrice ?? nft.price.toFixed(2)} ETH
                        </p>
                        <button
                          type="button"
                          onClick={() => setTab('reviews')}
                          aria-label="Ver 19 avaliações de colecionadores"
                          className="flex items-center gap-1 text-[15px]"
                        >
                          <span className="flex gap-1" aria-label="4 de 5 estrelas">
                            {[0, 1, 2, 3, 4].map((index) => (
                              <span
                                key={index}
                                className="flex size-[15px] items-center justify-center"
                              >
                                <img
                                  src={`${icons}${index === 4 ? 'imgStar1' : 'imgStar'}.svg`}
                                  alt=""
                                />
                              </span>
                            ))}
                          </span>
                          <span>19 avaliações de colecionadores</span>
                        </button>
                      </div>
                      <span className="absolute inset-x-0 bottom-0 overflow-hidden">
                        <img src="/images/details/imgLine2.svg" alt="" className="max-w-none" />
                      </span>
                    </div>
                    <div className="text-[14px] leading-6 text-catalog-muted xl:max-w-[574px]">
                      <h2 className="mb-3 text-[15px] font-bold leading-4 text-[#f5f1eb]">
                        Sobre este NFT:
                      </h2>
                      <p>
                        Um colecionável digital finalizado à mão da coleção Kurio Editions,
                        verificado na {nft.network}, com arte desbloqueável e acesso para
                        colecionadores.
                      </p>
                    </div>
                    <fieldset>
                      <legend className="mb-3 text-[15px] font-bold leading-4">Edição:</legend>
                      <div className="flex gap-[6px]">
                        {editions.map((value, index) => (
                          <button
                            type="button"
                            key={value}
                            disabled={available(value) === 0}
                            aria-pressed={edition === value}
                            onClick={() => {
                              setEdition(value)
                              setQuantity((count) => Math.min(count, available(value)))
                            }}
                            className={`relative flex h-7 items-center justify-center px-1 text-[14px] leading-4 ${edition === value ? 'text-catalog-accent' : 'text-catalog-muted'}`}
                          >
                            <img src={`${icons}imgEllipse${24 + index}.svg`} alt="" />
                            <span
                              className={`absolute inset-0 flex items-center justify-center rounded-[50%] ${edition === value && value !== '1/50' ? 'ring-1 ring-catalog-primary' : ''}`}
                            >
                              {value}
                            </span>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3" aria-label="Quantidade">
                        <button
                          type="button"
                          onClick={() => setQuantity((count) => Math.max(1, count - 1))}
                          disabled={quantity === 1}
                          aria-label="Diminuir quantidade"
                          className="flex h-[49.5px] w-[33px] items-center justify-center rounded-[33px] border border-background bg-catalog-primary text-background disabled:cursor-default"
                        >
                          <img src={`${icons}imgFrame.svg`} alt="" />
                        </button>
                        <output
                          aria-label="Quantidade selecionada"
                          className="text-[20px] leading-7"
                        >
                          {quantity}
                        </output>
                        <button
                          type="button"
                          onClick={() => setQuantity((count) => Math.min(maximum, count + 1))}
                          disabled={quantity >= maximum}
                          aria-label="Aumentar quantidade"
                          className="flex h-[49.5px] w-[33px] items-center justify-center rounded-[33px] border border-background bg-catalog-primary text-background disabled:cursor-default"
                        >
                          <img src={`${icons}imgFrame1.svg`} alt="" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={
                            cartMutation.isPending || cartQuery.isPending || quantity > maximum
                          }
                          onClick={() =>
                            cartMutation.mutate(
                              { method: 'post', body: { nftId: nft.id, edition, quantity } },
                              {
                                onError: (error) =>
                                  setMessage({
                                    title: 'Não foi possível adicionar ao carrinho',
                                    body: getApiError(error).message,
                                  }),
                              },
                            )
                          }
                          className="flex h-10 w-[130px] items-center justify-center rounded-[6px] bg-catalog-primary text-[14px] font-bold text-background disabled:opacity-50"
                        >
                          {cartMutation.isPending ? 'ADICIONANDO…' : 'COMPRAR'}
                        </button>
                        <button
                          type="button"
                          disabled={
                            !!user && (favoriteMutation.isPending || favoritesQuery.isPending)
                          }
                          onClick={toggleFavorite}
                          aria-pressed={favorite}
                          className={`flex h-10 w-[130px] items-center justify-center gap-2 rounded-[6px] border border-catalog-primary text-[14px] font-medium ${favorite ? 'bg-catalog-primary/20' : ''} text-catalog-accent`}
                        >
                          <img src={`${icons}imgHeart1.svg`} alt="" />
                          {favorite ? 'Favoritado' : 'Favoritar'}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 text-[15px] leading-[20px] text-catalog-secondary">
                      <p>ID do token: #{token}</p>
                      <p>Coleção: {collectionName}</p>
                      <p>Atributos: {attributes}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[#f5f1eb]">
                        <span className="font-bold leading-4">Compartilhar este NFT:</span>
                        <button
                          type="button"
                          onClick={() => void share('no LinkedIn')}
                          aria-label="Copiar link para LinkedIn"
                        >
                          <img src={`${icons}imgLinkedin.svg`} alt="" />
                        </button>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(window.location.href)}`}
                          aria-label="Compartilhar por e-mail"
                        >
                          <img src={`${icons}imgMessage.svg`} alt="" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void share('no Twitter')}
                          aria-label="Copiar link para Twitter"
                        >
                          <img src={`${icons}imgTwitter.svg`} alt="" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              <section className="mt-12 xl:mt-24" aria-label="Informações do NFT">
                <div
                  role="tablist"
                  aria-label="Detalhes e avaliações"
                  className="relative flex flex-wrap gap-8 pb-px text-[17px] leading-4"
                >
                  <button
                    id="nft-details-tab"
                    type="button"
                    role="tab"
                    aria-selected={tab === 'details'}
                    aria-controls="nft-description"
                    onClick={() => setTab('details')}
                    className={`relative border-b-[3px] border-transparent pb-2 ${tab === 'details' ? 'font-bold text-catalog-accent' : ''}`}
                  >
                    Detalhes do NFT
                    {tab === 'details' && (
                      <img
                        src="/images/catalog/imgLine6.svg"
                        alt=""
                        className="pointer-events-none absolute -bottom-[3px] left-0 max-w-none"
                      />
                    )}
                  </button>
                  <button
                    id="nft-reviews-tab"
                    type="button"
                    role="tab"
                    aria-selected={tab === 'reviews'}
                    aria-controls="nft-reviews"
                    onClick={() => setTab('reviews')}
                    className={`border-b-[3px] pb-2 ${tab === 'reviews' ? 'border-catalog-primary font-bold text-catalog-accent' : 'border-transparent'}`}
                  >
                    Avaliações de colecionadores (19)
                  </button>
                  <span className="absolute inset-x-0 bottom-0 overflow-hidden">
                    <img src="/images/details/imgLine5.svg" alt="" className="max-w-none" />
                  </span>
                </div>
                {tab === 'details' ? (
                  <div
                    id="nft-description"
                    role="tabpanel"
                    aria-labelledby="nft-details-tab"
                    className="mt-3 text-[14px] leading-6 text-catalog-muted"
                  >
                    <p>
                      {name} é uma obra digital {edition} finalizada à mão da coleção Kurio
                      Editions. Cada atributo fica armazenado nos metadados do token e verificado na{' '}
                      {nft.network}. A obra explora identidade, movimento e luz em um mundo digital
                      sem fronteiras.
                    </p>
                    <p className="mt-6">
                      A propriedade inclui a arte em alta resolução, lançamentos exclusivos para
                      colecionadores e um registro permanente de procedência registrada na rede.
                      Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando
                      novos trabalhos e lançamentos da comunidade.
                    </p>
                    <h3 className="mt-3 font-bold text-[#f5f1eb]">Rede:</h3>
                    <p>
                      Cunhado na {nft.network} com procedência imutável e metadados armazenados no
                      IPFS.
                    </p>
                    <h3 className="mt-3 font-bold text-[#f5f1eb]">Contrato:</h3>
                    <p>
                      Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente
                      pelos mercados compatíveis.
                    </p>
                    <h3 className="mt-3 font-bold text-[#f5f1eb]">Direitos autorais:</h3>
                    <p>0x7A42...19E8 • Contrato inteligente ERC-721 verificado.</p>
                  </div>
                ) : (
                  <div
                    id="nft-reviews"
                    role="tabpanel"
                    aria-labelledby="nft-reviews-tab"
                    className="mt-3 min-h-[312px] text-[14px] leading-6 text-catalog-muted"
                  >
                    <p>
                      Ainda não há avaliações disponíveis para este NFT no catálogo demonstrativo. A
                      contagem e as estrelas seguem a referência visual.
                    </p>
                    <button
                      type="button"
                      onClick={() => setLoginOpen(true)}
                      className="mt-6 rounded-md border border-catalog-primary px-4 py-2 text-catalog-accent"
                    >
                      Entrar para avaliar
                    </button>
                  </div>
                )}
              </section>
              <section className="mt-12 xl:mt-24" aria-label="Mais desta coleção">
                <h2 className="relative pb-3 text-[17px] font-bold leading-4 text-catalog-accent">
                  Mais desta coleção
                  <span className="absolute inset-x-0 bottom-0 overflow-hidden">
                    <img src={`${icons}imgLine5.svg`} alt="" className="max-w-none" />
                  </span>
                </h2>
                <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 xl:flex xl:justify-between">
                  {relatedItems.map((item, index) => (
                    <Link
                      key={item.id}
                      to="/nft/$nftId"
                      params={{ nftId: item.id }}
                      className="min-w-0 xl:w-[219px]"
                    >
                      <div
                        className={`flex aspect-[219/255] items-start justify-center bg-surface xl:h-[255px] ${index === 1 || index === 2 ? 'pt-5' : 'pt-4'}`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`rounded-[13px] object-cover ${index === 0 ? 'mt-[-12px] aspect-[190/243] w-[87%] xl:h-[243px] xl:w-[190px]' : 'aspect-square w-[calc(100%-8px)]'}`}
                        />
                      </div>
                      <h3 className="mt-3 text-[15px] leading-[20px]">{item.name}</h3>
                      <p className="text-[16px] font-bold leading-4 text-catalog-accent">
                        {item.displayPrice ?? item.price.toFixed(2)} ETH
                      </p>
                    </Link>
                  ))}
                </div>
                <nav
                  aria-label="Páginas de NFTs relacionados"
                  className="relative mx-auto mt-8 flex h-3 w-[52px] justify-center gap-2"
                >
                  {relatedPage === 1 && (
                    <img
                      src={`${icons}imgCarouselDots.svg`}
                      alt=""
                      className="pointer-events-none absolute inset-0"
                    />
                  )}
                  {[0, 1, 2].map((page) => (
                    <button
                      key={page}
                      type="button"
                      aria-label={`Coleção página ${page + 1}`}
                      aria-current={page === relatedPage ? 'page' : undefined}
                      onClick={() => setRelatedPage(page)}
                      className={`relative size-3 shrink-0 rounded-full ${relatedPage === 1 ? '' : `border border-catalog-primary ${page === relatedPage ? 'bg-catalog-primary' : 'bg-background'}`}`}
                    />
                  ))}
                </nav>
              </section>
            </Container>
          </main>
          <Footer
            onAction={setMessage}
            onCollection={() => void navigate({ to: '/', hash: 'catalogo' })}
          />
        </>
      )}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      <HomeDialog open={zoom} title={name} onClose={() => setZoom(false)}>
        <img src={nft.image} alt={name} className="w-full rounded-[24px]" />
      </HomeDialog>
      <HomeDialog open={!!message} title={message?.title ?? ''} onClose={() => setMessage(null)}>
        <p className="text-[14px] leading-6 text-catalog-muted">{message?.body}</p>
      </HomeDialog>
    </div>
  )
}
