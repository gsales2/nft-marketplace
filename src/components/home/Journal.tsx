import { Container } from '../layout/Container'
import type { HomeMessage } from '../../lib/catalogData'

export function Journal({ onAction }: { onAction: (message: HomeMessage) => void }) {
  const articles = [
    {
      title: 'Como funciona a propriedade de NFTs',
      body: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
      image: 'NeonVessel',
      date: '12',
      minutes: 6,
    },
    {
      title: '10 artistas digitais para acompanhar',
      body: 'Conheça criadores que moldam a cultura digital.',
      image: 'EmeraldApe',
      date: '13',
      minutes: 2,
    },
    {
      title: 'Raridade, atributos e procedência',
      body: 'Entenda raridade, procedência, direitos autorais e utilidade.',
      image: 'SageNomad',
      date: '15',
      minutes: 3,
    },
    {
      title: 'Como proteger sua carteira',
      body: 'Proteja sua carteira, seus ativos e sua identidade.',
      image: 'GoldenSignal',
      date: '15',
      minutes: 2,
    },
  ]
  return (
    <section
      id="aprenda"
      className="mt-12 scroll-mt-6 xl:mt-[96px]"
      aria-labelledby="journal-title"
    >
      <Container>
        <div className="text-center xl:h-[67px]">
          <h2
            id="journal-title"
            className="text-[24px] font-bold leading-8 md:text-[28px] md:leading-[37px]"
          >
            Diário da Cunhagem
          </h2>
          <p className="mt-3 text-[14px] leading-5 text-catalog-muted xl:leading-[18px]">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:flex">
          {articles.map((article) => (
            <article
              key={article.title}
              className="min-h-[369px] min-w-0 overflow-hidden rounded-lg bg-surface xl:h-[369px] xl:w-[268px]"
            >
              <img
                loading="lazy"
                decoding="async"
                src={`/images/nfts/${article.image}.webp`}
                alt={article.title}
                className="h-[195px] w-full object-cover"
              />
              <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
                <p className="h-8 text-[12px] font-medium leading-4 text-catalog-muted">
                  {article.date} de setembro&nbsp; | &nbsp;Leitura de {article.minutes} min
                </p>
                <h3 className="h-[42px] text-[16px] font-bold leading-[21px]">{article.title}</h3>
                <p className="h-8 text-[12px] font-medium leading-4 text-catalog-muted">
                  {article.body}
                </p>
                <button
                  type="button"
                  aria-label={`Ler mais: ${article.title}`}
                  onClick={() =>
                    onAction({
                      title: article.title,
                      body: `${article.body} O artigo completo será publicado em breve.`,
                      image: `/images/nfts/${article.image}.webp`,
                    })
                  }
                  className="w-fit text-[12px] font-bold leading-[14px] text-catalog-accent"
                >
                  Ler mais →
                </button>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
