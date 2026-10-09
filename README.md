# Kurio NFT Marketplace

[Demonstração publicada](https://kurio-nft-marketplace-blond.vercel.app) · [Código no GitHub](https://github.com/gsales2/nft-marketplace)

React e TypeScript com TanStack Router, TanStack Query, Axios, Tailwind CSS e componentes adaptados do shadcn/ui. Catálogo, contas, favoritos, carrinho, carteiras e pedidos usam REST simulado por MSW. Socket.IO informa mudanças de preço, disponibilidade e situação das compras.

Desktop mantém container de 1200 px e margens de 120 px em 1440 px. Tablet e mobile compartilham dados e regras. As imagens existentes são reutilizadas; Roboto Mono é servida localmente pelo pacote Fontsource.

## Como o projeto foi desenvolvido

O trabalho começou pela página inicial de desktop, usando o Figma como referência para o header, as cores, a tipografia e a distribuição dos cards. Depois vieram as adaptações para tablet e mobile. Como alguns estados e tamanhos de tela não tinham um frame próprio, as adaptações mantêm a identidade visual e os mesmos fluxos do desktop.

Login e cadastro foram implementados primeiro como interface e depois conectados à autenticação simulada. A sequência seguinte foi detalhe do NFT, carrinho, pagamento e comprovante. Perfil e carteiras foram adicionados para permitir que o usuário edite seus dados e cadastre uma carteira sem iniciar uma compra.

Uma revisão do enunciado orientou o trabalho de integração: filtros na URL, contratos REST, persistência, isolamento de contas, cenários de falha e atualizações por Socket.IO. A etapa de qualidade acrescentou testes de comportamento, comparação visual, acessibilidade e auditorias de carregamento.

Foi utilizada IA como apoio para acelerar implementação, revisão e testes. As referências visuais, prioridades e ajustes de comportamento foram definidos ao longo das revisões do projeto. Este documento descreve as decisões presentes no código e distingue as verificações realizadas das etapas ainda pendentes.

## Organização das pastas

```text
src/
  assets/mobile/ SVGs importados como markup pelos componentes mobile
  components/
    auth/       Sessão, conexão em tempo real e controles da conta
    cart/       Carrinho, pagamento, revisão, recuperação e comprovante
    home/       Hero, catálogo, filtros e seções da página inicial
    layout/     Header, footer, container e navegação mobile
    nft/        Cards, preço e página de detalhe
    profile/    Dados do perfil e cadastro de carteiras
    ui/         Botões, inputs, diálogos, skeletons e SVGs
  lib/          Contratos, cliente HTTP, cache, hooks e cálculos
  mocks/        Handlers REST, banco local, cenários e transporte de eventos
  routes/       Rotas e validação dos parâmetros de navegação
public/
  images/       Assets usados na interface
scripts/        Pré-renderização, compressão, preview e Lighthouse
tests/e2e/      Testes de comportamento, acessibilidade e baselines visuais
.github/        Automação das verificações no GitHub
```

`src/routeTree.gen.ts` é gerado pelo TanStack Router e não deve ser editado manualmente. `dist` é o resultado do build. Os relatórios de testes são gerados separadamente do código da aplicação.

## Tecnologias e responsabilidades

| Tecnologia              | Uso no projeto                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| React e TypeScript      | Componentes, estados locais e contratos tipados                      |
| TanStack Router         | Rotas por arquivo, filtros na URL e proteção de páginas privadas     |
| TanStack Query          | Consultas REST, mutations, cache, invalidação e favoritos otimistas  |
| Axios                   | Cliente HTTP, headers de sessão, cancelamento e tratamento de erros  |
| Tailwind CSS            | Layout responsivo e estilos da identidade Kurio                      |
| shadcn/ui               | Base dos componentes Button e Input, adaptados ao layout             |
| MSW                     | Interceptação de REST e simulação dos dados na camada de rede        |
| Socket.IO e binding MSW | Transporte WebSocket para preço, estoque e estado do pedido          |
| Vite                    | Desenvolvimento e geração dos arquivos de produção                   |
| Playwright e axe        | Testes de fluxos, comparação visual e verificações de acessibilidade |
| Lighthouse              | Medições de performance, acessibilidade, boas práticas e SEO         |
| Sharp e Fontsource      | Conversão das imagens existentes e fornecimento local da fonte       |

As regras de negócio simuladas ficam nos handlers MSW. Os componentes exibem o resultado das operações; não confirmam uma compra por conta própria.

## Executar

Requer Node.js 22.19+ ou 24.

```sh
npm ci
npm run dev:mocks
```

MSW está habilitado por padrão, inclusive no build de demonstração. A interface e os estados de carregamento aparecem enquanto o MSW inicia. Axios e Socket.IO aguardam o transporte estar pronto antes de enviar requisições. Copie `.env.example` para `.env.local` para configurar:

| Variável           | Padrão  | Uso                            |
| ------------------ | ------- | ------------------------------ |
| VITE_ENABLE_MOCKS  | true    | false exige uma API compatível |
| VITE_MOCK_SCENARIO | default | Cenário inicial                |
| VITE_API_URL       | /api    | Base do cliente Axios          |

## Testar uma compra

As contas `gabriel@kurio.test` e `nova@kurio.test` usam `Kurio123!`. Também é possível cadastrar uma conta. A sessão dura 30 minutos; autenticação retoma o contexto anterior. Google, Facebook e recuperação por e-mail informam sua indisponibilidade nesta demonstração.

1. Abra um NFT, escolha edição e quantidade e adicione ao carrinho.
2. Abra o carrinho, ajuste quantidades e, opcionalmente, aplique `KURIO10` para 10% de desconto.
3. Clique em **Conectar e finalizar** e autentique-se.
4. Cadastre uma carteira pelo pagamento ou por **Meu perfil → Carteiras**. Endereço fictício válido para Ethereum/Polygon: `0x1111111111111111111111111111111111111111`. ENS opcional: `teste.kurio.eth`.
5. Abra a revisão, confira itens, carteira, rede e valores e marque a confirmação antes de enviar o pedido.
6. Acompanhe o processamento e o comprovante. **Atividade** permite reabrir compras anteriores.

Não há pagamentos, conexão a extensões ou transferências reais. Dados da demonstração ficam no navegador; use dados fictícios. Carrinho visitante persiste após refresh e é mesclado ao entrar. Recursos privados ficam separados por conta.

Uma resposta perdida preserva a tentativa original, com a mesma chave e conteúdo. A tela permite localizar o pedido ou reenviar essa tentativa quando a API confirma sua ausência. Só confirmação remove as quantidades compradas; recusa preserva o carrinho. Itens adicionados durante o processamento permanecem disponíveis.

## Validação automatizada

O build pré-renderiza as páginas públicas usando um navegador headless. Instale o Chromium antes de executar o build, ou use um navegador instalado com `PLAYWRIGHT_CHANNEL`. No Windows, o script também procura o Edge no caminho padrão.

```sh
npm run typecheck
npm run lint
npx playwright install chromium
npm run build
npm run test:e2e
npm run test:checkout
npm run test:accessibility
npm run test:visual
npm run test:e2e:report
```

Os testes iniciam servidor na porta 5190. Para testar o build, execute `npm run build` e defina `PLAYWRIGHT_PREVIEW=true`. Para usar navegador instalado, defina `PLAYWRIGHT_CHANNEL=msedge` ou `chrome`. Em PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
$env:PLAYWRIGHT_PREVIEW='true'
npm run test:e2e
```

Fluxos funcionais rodam em 1440 e 390 px. Acessibilidade e comparação visual também rodam em 768 px. As 12 baselines de início, detalhe, carrinho e pagamento ficam em `tests/e2e/visual-baselines`. Compare usando o mesmo navegador e ambiente de geração. Atualize baselines somente após revisar uma mudança intencional: `npm run test:visual -- --update-snapshots`. Relatório: `playwright-report/index.html`; traces: `test-results`.

Axe verifica regras WCAG A/AA nas telas principais. Teclado, retorno do foco, skeletons, movimento reduzido e reflow têm verificações específicas. Automação não substitui revisão manual de acessibilidade.

## Dificuldades e verificações adicionais

### Referências e responsividade

Foi necessário corrigir a separação entre carrinho e pagamento no desktop depois de receber a referência correta do carrinho.

O mobile exigiu decisões próprias: autenticação em tela inteira, navegação retrátil e controles de compra fixos no detalhe. As comparações visuais em 390, 768 e 1440 px foram incluídas para verificar esses ajustes, especialmente espaçamentos, proporções e conteúdo que poderia ficar escondido pela ação inferior.

### Sessão e respostas atrasadas

Não bastava trocar o usuário mostrado no header. Consultas antigas e eventos de uma sessão anterior poderiam atingir o cache da nova conta. Por isso, consultas privadas incluem o usuário na chave, a troca de sessão cancela e remove esses dados e as respostas conferem o token atual. Os testes de logout, expiração e troca de conta verificam esse isolamento e a retomada do checkout.

### Compra e perda da resposta

Um timeout não permite concluir que o pedido falhou: o servidor simulado pode ter criado a compra antes de a resposta chegar. A tentativa guarda a chave de idempotência e o conteúdo enviado. A recuperação consulta a API antes de permitir um novo envio.

Esse comportamento exigiu cenários específicos de resposta perdida, clique repetido e refresh durante o processamento. Também foram acrescentadas verificações para garantir que a confirmação remova apenas as quantidades compradas e preserve itens adicionados depois. Os cálculos em ETH usam unidades inteiras com 18 casas, evitando diferenças causadas por ponto flutuante.

### Mudanças de preço e estoque

Atualizar o card não era suficiente: uma mudança de mercado também precisa atingir o carrinho e invalidar a revisão da compra. Os testes de tempo real exercitam o cliente Socket.IO, versões duplicadas ou antigas, desconexão e reconciliação com REST. A cotação é validada novamente no envio do pedido.

### Carregamento e performance

As primeiras auditorias mostraram que iniciar os mocks, carregar JavaScript e descobrir imagens atrasava a apresentação do conteúdo no mobile. Foram reutilizadas e convertidas imagens para WebP, antecipados recursos principais e separados os carregamentos das rotas privadas e do transporte de eventos.

O build passou a pré-renderizar início e detalhes públicos. Os snapshots são anônimos, não exportam dados privados e são revalidados por REST depois da hidratação. Durante essa alteração surgiram erros de hidratação, o que exigiu verificar o console e ajustar o momento da revalidação. As verificações anteriores não substituem uma nova execução completa após essa mudança.

Auditorias preliminares também mostraram diferenças entre os métodos de limitação de rede do Lighthouse. O script registra o método utilizado para que a medição seja reproduzível. Uma pontuação isolada não é tratada como resultado final do projeto.

## Cenários

Altere o cenário depois de carregar a aplicação. A escolha persiste e prevalece sobre o ambiente:

```js
await fetch('/api/mock/scenario', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'timeout-after-order' }),
})
```

| Cenário                                | Resultado                                                            |
| -------------------------------------- | -------------------------------------------------------------------- |
| default / slow                         | Latência de 180 / 1500 ms                                            |
| network-error / server-error           | Falha de conexão / HTTP 503                                          |
| session-expired                        | Novo login expira em três segundos                                   |
| registration-conflict / favorite-error | Conflito de cadastro / rollback de favorito                          |
| empty-catalog / out-of-order           | Catálogo vazio / buscas com latências diferentes                     |
| pending-order / payment-refused        | Compra pendente / recusada                                           |
| wallet-refused / wallet-disconnected   | Conexão recusada / carteira indisponível                             |
| price-changed / edition-sold-out       | Conflito ao enviar pedido; exige revisão                             |
| coupon-expired                         | Cupom aplicado perde validade                                        |
| timeout-after-order                    | Pedido criado; resposta atrasada 4500 ms; cliente espera até 3000 ms |

Para confirmar/recusar um pedido pendente ou atualizar o mercado:

```js
await fetch('/api/mock/realtime', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'order', orderId: 'ID_DO_PEDIDO', status: 'confirmed' }),
})
await fetch('/api/mock/realtime', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'nft',
    nftId: 'emerald',
    price: '2.19',
    edition: '1/50',
    available: 5,
  }),
})
```

Use `refused` para recusar. `{action:'disconnect'}` interrompe o socket para testar reconexão. Versões repetidas ou antigas são descartadas; mudanças de cotação exigem nova revisão.

Reset de contas, sessões, carteiras, carrinhos, pedidos e tentativas:

```js
await fetch('/api/mock/reset', { method: 'POST' })
location.reload()
```

## Contratos principais

Base `/api`; recursos privados exigem `Authorization: Bearer <token>`. Carrinho visitante usa `X-Guest-Cart`. Erros têm `{code, message, fields?}`; mutações não têm retry automático.

| Recurso                             | Operações                                                        |
| ----------------------------------- | ---------------------------------------------------------------- |
| /accounts, /session                 | Cadastro, login, consulta e encerramento da sessão               |
| /nfts, /nfts/:id, /nfts/:id/related | Catálogo filtrado/paginado, detalhe e recomendações              |
| /favorites, /favorites/:nftId       | Consulta, inclusão e remoção                                     |
| /cart                               | GET cotação; POST item; PATCH quantidade; DELETE item; PUT cupom |
| /profile                            | GET/PATCH dados, avatar e senha                                  |
| /wallets                            | GET/POST/PATCH carteiras e seleção                               |
| /wallets/connection                 | POST conexão simulada; DELETE desconexão                         |
| /quote                              | POST {walletId}; revalida cotação, disponibilidade e conexão     |
| /orders                             | GET histórico; POST criação com Idempotency-Key                  |
| /orders/:id                         | GET pedido da conta atual                                        |
| /orders/attempts/:key               | GET recuperação da tentativa da conta atual                      |

POST `/orders` recebe `walletId`, `expectedTotal`, `expectedRevision` e, no desktop, `collector` com os dados preenchidos. Mesma chave e conteúdo retornam o mesmo pedido; conteúdo diferente retorna 409. Pedidos preservam snapshots de itens, valores, carteira e colecionador. Preços são strings decimais; cálculos usam unidades inteiras com 18 casas.

GET `/wallets` retorna `{items, selectedId, connectedId}`. Ethereum/Polygon exigem `0x` e 40 dígitos hexadecimais; Solana usa base58 com 32 a 44 caracteres. ENS opcional termina em `.eth`. Carteiras do perfil podem ser reutilizadas no pagamento.

Perfil permite editar dados, avatar e senha. PNG/JPEG/WebP aceitam até 500 KB. Troca de senha exige senha atual e confirmação e encerra outras sessões.

## Auditoria e publicação

Execute `npm run audit:lighthouse` para medir início e detalhe em desktop e mobile, três vezes por tela. Os relatórios HTML/JSON e as medianas são gravados em `reports/lighthouse`. O comando falha se performance ficar abaixo de 90, acessibilidade abaixo de 95, boas práticas ou SEO abaixo de 100.

Em 9 de outubro de 2026, as 12 medições locais atingiram as metas:

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |
| ------- | ------- | ----------: | -------------: | ------------: | --: |
| Início  | Mobile  |          99 |            100 |           100 | 100 |
| Detalhe | Mobile  |          99 |            100 |           100 | 100 |
| Início  | Desktop |         100 |            100 |           100 | 100 |
| Detalhe | Desktop |         100 |             97 |           100 | 100 |

As pontuações são medianas de três execuções. Os relatórios, LCP, CLS, TBT e condições estão em [reports/README.md](reports/README.md) e [summary.json](reports/lighthouse/summary.json).

O método padrão é `devtools`, com as condições de rede e CPU dos perfis Lighthouse e limpeza do armazenamento entre medições. Para comparar com o método simulado, após o build execute `node scripts/lighthouse.mjs --throttling=simulate --output=reports/lighthouse-simulated`. Os relatórios registram versões, ambiente, configuração e LCP, CLS e TBT. Os valores dependem das condições registradas; não representam uma garantia para qualquer dispositivo ou ambiente.

A configuração de publicação está em `vercel.json`, com suporte a rotas diretas e atualização sem cache do service worker. Na Vercel, o comando de build instala NSS e Chromium antes de executar o build e a pré-renderização. Localmente, o build pode usar Edge com `PLAYWRIGHT_CHANNEL=msedge`. Se dois builds forem executados ao mesmo tempo, defina `KURIO_PRERENDER_PORT` com uma porta livre para cada um. A demonstração mantém o MSW habilitado. Não há backend ou blockchain de produção. Decisões e limites estão em `ARCHITECTURE.md`.

## Estado da entrega

Em 9 de outubro de 2026, a suíte completa passou: **105 testes em 7 minutos**, sem falhas. As 12 comparações visuais de início, detalhe, carrinho e pagamento passaram em desktop, mobile e tablet. O [relatório HTML](reports/playwright/index.html) está versionado; abra-o com `npx playwright show-report reports/playwright`.

A instalação com `npm ci`, a verificação de tipos, o lint e o build foram verificados em um checkout limpo. O deploy público passou por mais **22 testes em 1,1 minuto**, cobrindo catálogo REST, login e compra fictícia, persistência do comprovante, Socket.IO e acesso direto com refresh em desktop e mobile. O [relatório da publicação](reports/deployment/index.html) está versionado.

Para repetir a verificação da publicação: `npx playwright test --config playwright.deployment.config.ts`. A variável `DEPLOYMENT_URL` permite testar outro endereço. No Windows com Edge, use `PLAYWRIGHT_CHANNEL=msedge`.
