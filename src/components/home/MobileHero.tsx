import { SvgArtwork } from '../ui/SvgArtwork'
import imgArrowRight from '../../assets/mobile/imgArrowRight.svg?raw'
import { Container } from '../layout/Container'
import pageIndicator from '../../assets/mobile/imgFrame4.svg?raw'
import heroTexture from '../../assets/mobile/imgMaskGroup.svg?raw'

export function MobileHero() {
  return (
    <section className="md:hidden" aria-label="Boas-vindas à Kurio">
      <Container>
        <div className="relative h-[190px] overflow-hidden rounded-[12px] bg-background p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 w-full [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: heroTexture }}
          />
          <div className="relative -top-[10px] flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium leading-4 text-white">Bem-vindo à Kurio</p>
              <h1 className="mt-[6px] text-[18px] font-bold leading-[29px]">
                SEJA DONO DA
                <br />
                CULTURA DIGITAL
              </h1>
              <p className="mt-[6px] text-[12px] leading-[18px] text-catalog-muted">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
              <a
                href="#catalogo"
                className="flex w-fit items-center gap-2 text-[12px] font-bold leading-[14px] text-catalog-accent"
              >
                EXPLORAR
                <SvgArtwork markup={imgArrowRight} className="-rotate-90" />
              </a>
            </div>
            <div className="relative h-[146px] w-[138px] shrink-0 max-[380px]:w-[110px]">
              <img
                width={138}
                height={138}
                fetchPriority="high"
                src="/images/nfts/EmeraldApe.webp"
                alt="Emerald Ape"
                className="size-[138px] rounded-[16px] object-cover max-[380px]:size-[110px]"
              />
              <img
                src="/images/nfts/SageNomad.webp"
                alt="Sage Nomad"
                className="absolute left-[14px] top-[88px] size-[58px] rounded-[16px] object-cover"
              />
            </div>
          </div>
          <SvgArtwork
            markup={pageIndicator}
            className="absolute bottom-[6px] left-1/2 -translate-x-1/2"
          />
        </div>
      </Container>
    </section>
  )
}
