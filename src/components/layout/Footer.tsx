import { useNavigate } from '@tanstack/react-router'
import { Container } from './Container'
import { NewsLetter } from '../home/NewsLetter'
import type { HomeMessage } from '../../lib/catalogData'

interface Props {
  onAction: (message: HomeMessage) => void
  onCollection: (name: string) => void
}
export function Footer({ onAction, onCollection }: Props) {
  const navigate = useNavigate()
  const features = [
    [
      'W',
      'Segurança da carteira',
      'Proteja sua carteira e colecione arte digital verificada com confiança.',
    ],
    [
      'C',
      'Criadores em destaque',
      'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
    ],
    [
      'D',
      'Alertas de lançamentos',
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
    ],
  ]
  const groups = [
    [
      'Meu perfil',
      ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
    ],
    [
      'Central de ajuda',
      [
        'Central de ajuda',
        'Como comprar NFTs',
        'Carteira e segurança',
        'Política do mercado',
        'Denunciar item',
      ],
    ],
    ['Coleções', ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']],
  ] as const
  const show = (title: string) =>
    onAction({
      title,
      body: 'Esta área está em preparação. Em breve você poderá acessar este conteúdo na Kurio.',
    })
  return (
    <footer className="mt-12 pb-6 xl:mt-[96px]">
      <Container>
        <div className="bg-surface p-5 md:p-8 xl:h-[250px]">
          <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 xl:flex xl:w-[1154px] xl:gap-0">
            {features.map(([letter, title, body]) => (
              <section
                key={letter}
                id={letter === 'C' ? 'criadores' : undefined}
                className="min-w-0 scroll-mt-6 xl:w-[264.667px] xl:border-r xl:border-catalog-primary xl:px-4"
              >
                <button
                  type="button"
                  onClick={() => show(title)}
                  aria-label={title}
                  className="flex size-[74px] items-center justify-center rounded-full bg-catalog-primary text-[24px] font-bold text-background"
                >
                  {letter}
                </button>
                <h2 className="mt-3 text-[17px] font-bold leading-4">{title}</h2>
                <p className="mt-3 text-[14px] leading-[22px] text-catalog-muted xl:w-[204px]">
                  {body}
                </p>
              </section>
            ))}
            <div className="min-w-0 xl:w-[357px] xl:px-4">
              <NewsLetter onAction={onAction} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 items-center gap-4 bg-[#38220f] p-5 text-[14px] leading-[22px] md:grid-cols-2 md:px-8 xl:flex xl:h-[88px] xl:justify-between xl:py-0">
          <a href="#" className="font-bold tracking-[1.4px]">
            KURIO
          </a>
          <p>
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <button type="button" onClick={() => show('Contato')}>
            contato@email.com
          </button>
          <button type="button" onClick={() => show('Atendimento')}>
            +55 11 4002 8922
          </button>
        </div>
        <div className="grid grid-cols-1 gap-8 bg-surface p-5 sm:grid-cols-2 md:p-8 xl:flex xl:h-[236px] xl:gap-[124px]">
          {groups.map(([title, links]) => (
            <section key={title} className="min-w-0 flex-1">
              <h2 className="text-[18px] font-bold leading-4">{title}</h2>
              <ul className="mt-2 text-[14px] leading-[30px]">
                {links.map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      className="text-left hover:text-catalog-accent"
                      onClick={() =>
                        link === 'Meu perfil'
                          ? void navigate({ to: '/profile' })
                          : title === 'Coleções'
                            ? onCollection(link)
                            : show(link)
                      }
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section className="min-w-0 xl:w-[228px] xl:shrink-0">
            <h2 className="text-[18px] font-bold leading-4">Redes sociais</h2>
            <div className="mt-5 flex gap-[8px]">
              {['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube'].map((name, index) => (
                <button type="button" key={name} aria-label={name} onClick={() => show(name)}>
                  <img src={`/images/catalog/imgFrame${108 + index}.svg`} alt="" />
                </button>
              ))}
            </div>
            <h2 className="mt-8 text-[18px] font-bold leading-4">Carteiras compatíveis</h2>
            <button
              type="button"
              onClick={() => show('Conectar carteira')}
              className="mt-3 flex h-[26px] w-full items-center justify-center rounded-md border border-[#55321f] bg-[#38220f] text-[9px] font-bold text-catalog-accent"
            >
              METAMASK • WALLETCONNECT • COINBASE
            </button>
          </section>
        </div>
        <p className="mt-[6px] text-center text-[12px] leading-[30px] md:text-[14px]">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </Container>
    </footer>
  )
}
