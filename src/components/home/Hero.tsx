
import { Container } from '../layout/Container'

export function Hero() {
  return (
    <section>
      <Container>
        <div className="relative flex flex-col gap-6 lg:h-[450px] lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1 lg:max-w-[600px] lg:self-start lg:pt-[48px]">
            <p className="mb-[8px] text-[14px] text-white">
              Bem-vindo à Kurio
            </p>


            <h1 className="w-full max-w-[600px] text-[43px] leading-[70px] font-bold">
              SEJA DONO DO FUTURO
              <br className="hidden lg:block" />
              {' '}DA ARTE DIGITAL
            </h1>



            <p className="mt-[4px] w-full lg:max-w-[557px] text-[14px] font-normal leading-[24px] text-muted">
              Descubra NFTs selecionados de criadores emergentes e consagrados.
              Colecione arte digital rara, apoie artistas e tenha uma parte da
              cultura da internet.
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

          <div className="w-full shrink-0 lg:h-[450px] lg:w-[450px]">
            <img
              src="/images/hero-ape.png"
              alt="Arte digital de um macaco, destaque da coleção Kurio"
              className="h-full w-full rounded-xl object-cover"
            />
          </div>

          <div
            className="absolute bottom-[40px] left-1/2 hidden -translate-x-1/2 items-center gap-[8px] lg:flex"
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
