# Evidências de validação

## Lighthouse

Auditoria realizada em 9 de outubro de 2026. Três medições por página e perfil, com medianas calculadas separadamente para cada pontuação e métrica. Todas as metas configuradas foram atingidas.

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |     LCP |     CLS |      TBT |
| ------- | ------- | ----------: | -------------: | ------------: | --: | ------: | ------: | -------: |
| Início  | mobile  |          99 |            100 |           100 | 100 | 1.756 s | 0.00243 | 51.14 ms |
| Detalhe | mobile  |          99 |            100 |           100 | 100 | 1.608 s | 0.02463 | 15.74 ms |
| Início  | desktop |         100 |            100 |           100 | 100 | 0.122 s | 0.00000 |  0.00 ms |
| Detalhe | desktop |         100 |             97 |           100 | 100 | 0.127 s | 0.00000 |  0.00 ms |

Condições: Node v24.20.0, Lighthouse 13.5.0, Windows 10.0.26200, Edge/Chromium 154, CPU 12th Gen Intel(R) Core(TM) i5-12400F, 32 GB de RAM. Método DevTools, perfis de rede e CPU registrados em [summary.json](lighthouse/summary.json). Mobile 390 × 844, desktop 1440 × 1000, DPR 1.

O servidor local entrega o build com Brotli/gzip. O armazenamento é limpo a cada medição. MSW permanece habilitado no cenário padrão, com latência de 180 ms e transporte Socket.IO. A pré-renderização pública pertence ao build normal da aplicação. As pontuações são medições locais; a validação funcional da hospedagem está descrita abaixo.

- inicio mobile: [HTML 1](lighthouse/inicio-mobile-1.html) / [JSON 1](lighthouse/inicio-mobile-1.json), [HTML 2](lighthouse/inicio-mobile-2.html) / [JSON 2](lighthouse/inicio-mobile-2.json), [HTML 3](lighthouse/inicio-mobile-3.html) / [JSON 3](lighthouse/inicio-mobile-3.json)
- detalhe mobile: [HTML 1](lighthouse/detalhe-mobile-1.html) / [JSON 1](lighthouse/detalhe-mobile-1.json), [HTML 2](lighthouse/detalhe-mobile-2.html) / [JSON 2](lighthouse/detalhe-mobile-2.json), [HTML 3](lighthouse/detalhe-mobile-3.html) / [JSON 3](lighthouse/detalhe-mobile-3.json)
- inicio desktop: [HTML 1](lighthouse/inicio-desktop-1.html) / [JSON 1](lighthouse/inicio-desktop-1.json), [HTML 2](lighthouse/inicio-desktop-2.html) / [JSON 2](lighthouse/inicio-desktop-2.json), [HTML 3](lighthouse/inicio-desktop-3.html) / [JSON 3](lighthouse/inicio-desktop-3.json)
- detalhe desktop: [HTML 1](lighthouse/detalhe-desktop-1.html) / [JSON 1](lighthouse/detalhe-desktop-1.json), [HTML 2](lighthouse/detalhe-desktop-2.html) / [JSON 2](lighthouse/detalhe-desktop-2.json), [HTML 3](lighthouse/detalhe-desktop-3.html) / [JSON 3](lighthouse/detalhe-desktop-3.json)

## Testes E2E

Execução final em 9 de outubro de 2026: **105 testes passaram em 7 minutos**, sem falhas. Inclui fluxos desktop/mobile, acesso direto com refresh, acessibilidade e regressão visual em tablet. Chromium via Edge, Playwright 1.64.0, build de produção, fixtures isoladas e relógio controlado.

[Relatório HTML completo](playwright/index.html). Para abrir localmente: `npx playwright show-report reports/playwright`. O relatório usa as configurações versionadas em `playwright.config.ts`. Traces e screenshots são retidos quando ocorre falha; esta execução final não produziu falhas.

As comparações visuais permitem até 40 pixels diferentes por captura, sem tolerância percentual. A primeira execução no GitHub passou nos 99 testes restantes e apresentou seis diferenças visuais de 2 a 33 pixels, restritas às bordas arredondadas e ícones. Os diffs foram examinados antes de configurar esse limite; os baselines foram preservados. O detalhe também aguarda os cinco itens relacionados antes da captura.

A execução seguinte confirmou os 105 testes no GitHub. Nela, o Lighthouse identificou performance 84 na home mobile do runner compartilhado, com tarefas longas de layout. O bootstrap foi ajustado para inserir diretamente o snapshot do viewport, evitando renderizar primeiro o desktop no mobile. As condições da auditoria e as metas foram mantidas.

## Publicação e checkout limpo

[Site público](https://kurio-nft-marketplace-blond.vercel.app), hospedado na Vercel. Em 9 de outubro de 2026, **22 testes passaram em 1,1 minuto**, sem falhas, usando a URL pública em desktop e mobile. Foram verificados filtros REST, recuperação de erros, login, compra fictícia, comprovante após refresh, eventos Socket.IO e acesso direto às rotas privadas e inexistentes.

[Relatório da publicação](deployment/index.html). Para repetir: `npx playwright test --config playwright.deployment.config.ts`; no Windows, `PLAYWRIGHT_CHANNEL=msedge` usa o Edge instalado. As mesmas especificações funcionais da suíte local são reutilizadas.

Um clone separado, sem `node_modules` ou arquivos locais do projeto, recebeu `npm ci`: 387 pacotes instalados e nenhuma vulnerabilidade reportada. Typecheck, lint e build passaram. A pré-renderização utilizou a porta 5194 para não disputar a porta do build principal.
