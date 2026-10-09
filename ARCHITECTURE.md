# Arquitetura e decisões

## Responsabilidades

TanStack Router controla rotas e parâmetros de busca. TanStack Query controla REST, cache, cancelamento e mutações. Axios transporta contratos tipados; regras e persistência fictícias ficam nos handlers MSW. A interface não fabrica sucesso de conta, carteira ou pedido. A interface monta com estados de carregamento enquanto o MSW inicia; Axios e Socket.IO aguardam a inicialização do transporte.

`src/lib/*Contracts.ts` descreve o transporte. Hooks reutilizam recursos entre desktop e mobile. `src/mocks` separa catálogo, autenticação, perfil, carrinho, carteiras, cotação e pedidos. A base local utiliza transações serializadas, incluindo proteção entre abas quando Web Locks está disponível.

## Sessão e cache

Sessão consultada por REST com token opaco. Senhas da simulação usam PBKDF2 e salt; dados públicos não expõem hash/salt. O banco local é inspecionável, portanto não oferece autenticação de produção.

Consultas privadas usam `['private', userId, recurso]`. Login, logout, troca de conta e expiração cancelam consultas e removem caches privados. Respostas tardias conferem o token capturado. AbortSignal cancela consultas Axios; mutações não têm retry automático. Favoritos usam atualização otimista com rollback.

Perfil e pagamento exigem sessão. Reautenticação preserva contexto, inclusive `/checkout?order=ID`. Retornos externos são rejeitados. Carrinho visitante é mesclado ao autenticar; logout não expõe o carrinho privado.

## Catálogo e tempo real

Busca, coleção, rede, máximo, ordenação, categoria, favoritos e página ficam na URL. Mudanças de critérios reiniciam a paginação. Cada combinação e tamanho de página compõe uma chave de cache; respostas antigas não substituem resultados atuais. API MSW filtra, ordena e pagina, com REST para detalhes e recomendações.

Socket.IO usa WebSocket com binding MSW. Eventos `nft.updated` e `order.updated` têm recurso, identificador e versão. O cliente descarta duplicatas/versões inferiores, invalida consultas e busca REST atualizado. Reconexão reconcilia catálogo, detalhe, carrinho e pedidos. Listeners são liberados ao trocar de sessão. Eventos internos de limpeza não substituem Socket.IO.

## Compra e recuperação

`CheckoutReview` consulta `/quote`, mostra itens, carteira, rede e valores e exige confirmação explícita. Nova revisão de cotação desmarca a confirmação. O servidor revalida conexão, disponibilidade, cupom, total e revisão ao criar o pedido.

`usePurchase` persiste chave de idempotência e corpo antes do POST. A tentativa é isolada por usuário e inclui fingerprint do conteúdo completo, inclusive colecionador. Repetição idêntica retorna o pedido; mesma chave/conteúdo diferente retorna 409. Falhas reconhecidas anteriores à criação liberam revisão; falhas ambíguas preservam a tentativa.

`PurchaseRecovery` consulta `/orders/attempts/:key` após refresh ou resposta perdida. Pedido encontrado abre acompanhamento. Somente 404 permite reenviar o mesmo corpo/chave ou abandonar a tentativa para revisar. HTTP 503/falha de rede não significa ausência.

Pedidos começam em `pending` e terminam em `confirmed` ou `refused`. Mudanças terminais são idempotentes. Confirmação remove apenas quantidades do snapshot, preservando acréscimos posteriores. Recusa mantém o carrinho. Comprovantes não acompanham mudanças futuras do catálogo. Conclusão agendada é recuperada após refresh; Socket.IO atualiza a tela, com consulta periódica como fallback.

ETH trafega como string e é calculado com BigInt em unidades de 18 casas. Apresentação conserva a precisão recebida. Nenhuma conexão externa, cobrança ou transferência real é executada.

## Interface e acessibilidade

Desktop usa container de 1200 px em 1440 px. Tabela permite rolagem interna no tablet. Mobile tem autenticação inteira, carrinho compacto, seleção de carteira e ação fixa inferior no detalhe. Os mesmos contratos alimentam ambos os layouts.

Roboto Mono vem de Fontsource e é servida pelo build. Skeletons compartilhados cobrem catálogo, detalhe e resumo; shimmer respeita `prefers-reduced-motion`. Controles têm foco visível; skip link foca conteúdo. Diálogos nativos bloqueiam fundo, mantêm Tab no conteúdo, tratam Escape e devolvem foco. Formulários de perfil/carteira associam erros por `aria-describedby` e `aria-invalid` e focam o primeiro campo inválido.

## Testes e limites

Playwright testa REST interceptado por MSW e fluxos pela interface. Cobertura inclui preço/estoque em tempo real, reconexão, eventos antigos, troca de conta, recusa, cupom expirado, resposta perdida, conflito de idempotência, acréscimos durante processamento e precisão decimal.

Axe verifica WCAG A/AA nas telas principais. Teclado, foco, skeletons, movimento reduzido e reflow têm testes específicos. Baselines PNG comparam início, detalhe, carrinho e pagamento em 390, 768 e 1440 px. Fontes/imagens são aguardadas e a data é fixa. Compare imagens no mesmo ambiente de renderização.

Testes não comprovam conformidade integral de acessibilidade ou integração com serviços reais. A auditoria Lighthouse usa o build completo, MSW no cenário padrão e armazenamento frio por medição. Google/Facebook, ofertas e downloads comunicam indisponibilidade. Banco local, API mock e conexão simulada devem ser substituídos antes de produção.

## Carregamento e distribuição

Os PNGs existentes foram substituídos por WebP de qualidade 90, sem baixar novas imagens. Vetores decorativos grandes são incorporados como SVG para evitar requisições adicionais. O hero renderiza apenas a versão do viewport atual. Fontes locais e imagens principais têm descoberta antecipada.

As rotas públicas de início e detalhe são carregadas com a entrada; as rotas privadas continuam divididas pelo TanStack Router. Loaders antecipam consultas públicas compartilhadas com os hooks. Documentos de NFTs conhecidos incluem título e preload da imagem; preço, disponibilidade e interações continuam provenientes do REST. O service worker é registrado antecipadamente no build, mas as requisições só iniciam após o MSW estar pronto.

O build pré-renderiza as páginas públicas em contextos anônimos de desktop e mobile. Exporta apenas consultas públicas de catálogo e NFTs e a sessão vazia. Perfil, carteiras, pedidos e identificadores de carrinho não entram no snapshot. A hidratação exige que a URL corresponda à rota capturada; o fallback de uma rota privada ou inexistente não reutiliza a home. Parâmetros de busca, dados persistidos ou uma sessão existente desativam essa hidratação e mantêm o carregamento normal. Depois de montar, a rota revalida os dados por REST. A cotação do pedido continua sendo conferida no servidor simulado.

O Tailwind procura classes apenas em `src` e `index.html`. Relatórios e cópias de validação não participam da geração do CSS.

O preview serve Brotli/gzip e usa o mesmo conteúdo completo do build. Lighthouse limpa armazenamento e caches a cada medição e utiliza o método DevTools, com as condições registradas no relatório. A medição local não comprova o desempenho da futura hospedagem. As 12 auditorias de 9 de outubro de 2026 estão em `reports/lighthouse`, com medianas e métricas em `summary.json`.

`tldts` está fixado em 7.0.19, compatível com o intervalo exigido por tough-cookie, para evitar o aumento de tamanho da versão 7.4.18 no runtime MSW. A biblioteca completa de cookies continua incluída. Seeds usam hashes PBKDF2 pré-calculados com os mesmos parâmetros do cadastro; autenticação e troca de senha continuam derivando hashes normalmente.
