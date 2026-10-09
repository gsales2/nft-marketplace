# Ambiente das baselines

Capturas de início, detalhe, carrinho e pagamento em 390×844, 768×1024 e 1440×1000, geradas no Windows com Microsoft Edge 154.0.4258.62, Playwright 1.64.0 e Roboto Mono Variable 5.3.0 servida localmente.

Data fixa: 29/07/2026. Movimento reduzido, imagens decodificadas e fontes carregadas antes da captura. Dados partem de contextos independentes e fixtures REST estáveis.

A referência de início mobile foi revisada após incorporar SVGs locais à interface. A comparação mostrou 40 pixels de diferença nas bordas de ícones, sem alteração de composição. Para capturas de página inteira, o teste também carrega imagens fora do viewport antes de comparar.

Execute `npm run test:visual` com `PLAYWRIGHT_CHANNEL=msedge` para comparar. Diferenças de navegador, versão ou sistema podem alterar rasterização. Inspecione relatório e diff antes de atualizar imagens com `--update-snapshots`; não atualize para ocultar uma regressão.
