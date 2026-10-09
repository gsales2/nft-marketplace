import { Container } from '../layout/Container'
import type { CSSProperties } from 'react'

export function PromoBanner({ onExplore }: { onExplore: () => void }) {
  const promos = [
    {
      title: (
        <>
          Lançamentos gênesis
          <br />
          de edição limitada
        </>
      ),
      description:
        'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
      image: 'EmeraldApe',
      imageWidth: 292,
      left: -5,
      right: 30,
    },
    {
      title: (
        <>
          Arte digital selecionada
          <br />e muito mais
        </>
      ),
      description:
        'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
      image: 'NeonVessel',
      imageWidth: 287,
      left: 2,
      right: 35,
    },
  ]
  return (
    <section aria-label="Coleções selecionadas">
      <Container>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:flex xl:justify-between xl:gap-0">
          {promos.map((promo) => (
            <article
              key={promo.image}
              className="relative min-h-[220px] min-w-0 overflow-hidden rounded-lg bg-surface xl:h-[250px] xl:w-[586px]"
              style={
                {
                  '--promo-image-width': `${promo.imageWidth}px`,
                  '--promo-left': `${promo.left}px`,
                  '--promo-right': `${promo.right}px`,
                } as CSSProperties
              }
            >
              <img
                loading="lazy"
                decoding="async"
                src={`/images/nfts/${promo.image}.webp`}
                alt=""
                className="absolute left-0 top-0 h-full w-[48%] rounded-[18px] object-cover xl:left-[var(--promo-left)] xl:h-[250px] xl:w-[var(--promo-image-width)]"
              />
              <img
                src="/images/catalog/imgMaskGroup.svg"
                alt=""
                className="pointer-events-none absolute left-0 top-0"
              />
              <div className="relative ml-auto mr-4 w-[calc(52%-24px)] py-6 text-right xl:absolute xl:right-[var(--promo-right)] xl:top-[37px] xl:mr-0 xl:w-[263px] xl:py-0">
                <h2 className="text-[14px] font-bold leading-5 xl:text-[18px] xl:leading-6">
                  {promo.title}
                </h2>
                <p className="mt-[9px] text-[12px] leading-[18px] text-catalog-muted xl:h-[70px] xl:text-[14px] xl:leading-6">
                  {promo.description}
                </p>
                <button
                  type="button"
                  onClick={onExplore}
                  className="ml-auto mt-4 flex h-10 w-[120px] max-w-full items-center justify-center gap-1 rounded-md bg-catalog-primary text-[14px] font-medium text-background xl:mt-0 xl:w-[140px]"
                >
                  Explorar
                  <img src="/images/catalog/imgArrowRight.svg" alt="" className="-rotate-90" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
