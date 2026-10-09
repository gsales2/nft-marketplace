# Evidências de validação

## Lighthouse

Auditoria realizada em 9 de outubro de 2026. Três medições por página e perfil, com medianas calculadas separadamente para cada pontuação e métrica. Todas as metas configuradas foram atingidas.

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |     LCP |     CLS |      TBT |
| ------- | ------- | ----------: | -------------: | ------------: | --: | ------: | ------: | -------: |
| Início  | mobile  |          99 |            100 |           100 | 100 | 1.732 s | 0.00243 | 44.57 ms |
| Detalhe | mobile  |          97 |            100 |           100 | 100 | 2.085 s | 0.01028 | 14.93 ms |
| Início  | desktop |         100 |            100 |           100 | 100 | 0.091 s | 0.00000 |  0.00 ms |
| Detalhe | desktop |         100 |             97 |           100 | 100 | 0.100 s | 0.00039 |  0.00 ms |

Condições: Node v24.20.0, Lighthouse 13.5.0, Windows 10.0.26200, Edge/Chromium 154, CPU 12th Gen Intel(R) Core(TM) i5-12400F, 32 GB de RAM. Método DevTools, perfis de rede e CPU registrados em [summary.json](lighthouse/summary.json). Mobile 390 × 844, desktop 1440 × 1000, DPR 1.

O servidor local entrega o build com Brotli/gzip. O armazenamento é limpo a cada medição. MSW permanece habilitado no cenário padrão, com latência de 180 ms e transporte Socket.IO. A pré-renderização pública pertence ao build normal da aplicação. Os resultados são locais; a hospedagem pública ainda precisa ser validada.

- inicio mobile: [HTML 1](lighthouse/inicio-mobile-1.html) / [JSON 1](lighthouse/inicio-mobile-1.json), [HTML 2](lighthouse/inicio-mobile-2.html) / [JSON 2](lighthouse/inicio-mobile-2.json), [HTML 3](lighthouse/inicio-mobile-3.html) / [JSON 3](lighthouse/inicio-mobile-3.json)
- detalhe mobile: [HTML 1](lighthouse/detalhe-mobile-1.html) / [JSON 1](lighthouse/detalhe-mobile-1.json), [HTML 2](lighthouse/detalhe-mobile-2.html) / [JSON 2](lighthouse/detalhe-mobile-2.json), [HTML 3](lighthouse/detalhe-mobile-3.html) / [JSON 3](lighthouse/detalhe-mobile-3.json)
- inicio desktop: [HTML 1](lighthouse/inicio-desktop-1.html) / [JSON 1](lighthouse/inicio-desktop-1.json), [HTML 2](lighthouse/inicio-desktop-2.html) / [JSON 2](lighthouse/inicio-desktop-2.json), [HTML 3](lighthouse/inicio-desktop-3.html) / [JSON 3](lighthouse/inicio-desktop-3.json)
- detalhe desktop: [HTML 1](lighthouse/detalhe-desktop-1.html) / [JSON 1](lighthouse/detalhe-desktop-1.json), [HTML 2](lighthouse/detalhe-desktop-2.html) / [JSON 2](lighthouse/detalhe-desktop-2.json), [HTML 3](lighthouse/detalhe-desktop-3.html) / [JSON 3](lighthouse/detalhe-desktop-3.json)

## Testes E2E

Execução final em 9 de outubro de 2026: **93 testes passaram em 6,7 minutos**, sem falhas. Inclui fluxos desktop/mobile e acessibilidade e regressão visual em tablet. Chromium via Edge, Playwright 1.64.0, build de produção, fixtures isoladas e relógio controlado.

[Relatório HTML completo](playwright/index.html). Para abrir localmente: `npx playwright show-report reports/playwright`. O relatório usa as configurações versionadas em `playwright.config.ts`. Traces e screenshots são retidos quando ocorre falha; esta execução final não produziu falhas.
