import { Container } from '../layout/Container'
import { MobileHero } from './MobileHero'
import { useMediaQuery } from '../../lib/useMediaQuery'

export function Hero() {
  const mobile = useMediaQuery('(max-width: 767px)')
  if (mobile) return <MobileHero />
  return (
    <section className="hidden md:block">
      <Container>
        <div className="relative flex h-[340px] items-center justify-between gap-6 xl:h-[450px] xl:gap-10">
          <div className="min-w-0 flex-1 xl:max-w-[600px] xl:self-start xl:pt-[48px]">
            <p className="mb-[8px] text-[14px] text-white">Bem-vindo à Kurio</p>

            <h1 className="w-full max-w-[600px] text-[30px] font-bold leading-[42px] xl:text-[43px] xl:leading-[70px]">
              SEJA DONO DO FUTURO
              <br /> DA ARTE DIGITAL
            </h1>

            <p className="mt-[4px] w-full xl:max-w-[557px] text-[14px] font-normal leading-[24px] text-muted">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>

            <a
              href="#catalogo"
              className="
              mt-[32px]
              inline-flex
              h-[40px]
              w-[140px]
              items-center
              justify-center
              gap-[10px]
              rounded-[6px]
              bg-primary
              pt-[10px]
              pr-[36px]
              pb-[10px]
              pl-[28px]
              text-[14px]
              font-bold
              text-background
              transition-colors
              hover:brightness-110
            "
            >
              EXPLORAR
            </a>
          </div>

          <div className="size-[260px] shrink-0 min-[1000px]:size-[320px] xl:size-[450px]">
            <img
              width={450}
              height={450}
              fetchPriority="high"
              src="/images/hero-ape.webp"
              alt="Arte digital de um macaco, destaque da coleção Kurio"
              className="h-full w-full rounded-xl object-cover"
            />
          </div>

          <div
            className="absolute bottom-[40px] left-1/2 hidden -translate-x-1/2 items-center gap-[8px] xl:flex"
            aria-hidden="true"
          >
            <span className="h-[7px] w-[7px] rounded-full bg-primary" />
            <span className="h-[7px] w-[7px] rounded-full bg-primary/70" />
            <span className="h-[7px] w-[7px] rounded-full bg-primary/70" />
          </div>
        </div>
      </Container>
    </section>
  )
}
