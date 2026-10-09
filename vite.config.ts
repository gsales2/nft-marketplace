import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { catalogItems } from './src/lib/catalogData.ts'

function nftDocumentMetadata(): Plugin {
  const escape = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  return {
    name: 'nft-document-metadata',
    async writeBundle(options, bundle) {
      const document = bundle['index.html']
      if (document?.type !== 'asset') return
      const directory = path.join(options.dir ?? 'dist', 'nft')
      await mkdir(directory, { recursive: true })
      await Promise.all(
        catalogItems.map((nft) => {
          const html = String(document.source)
            .replace(/<link rel="preload" href="\/images\/[^"]+"[^>]*>/g, '')
            .replace(
              /<title>[^<]*<\/title>/,
              `<title>${escape(nft.name ?? 'Obra digital')} — Kurio</title>`,
            )
            .replace(
              '</head>',
              `<link rel="preload" as="image" fetchpriority="high" href="${escape(nft.image)}" /></head>`,
            )
          return writeFile(path.join(directory, `${nft.id}.html`), html)
        }),
      )
    },
  }
}

function preloadMockRuntime(): Plugin {
  return {
    name: 'preload-mock-runtime',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (process.env.VITE_ENABLE_MOCKS === 'false') return []
        const runtime = Object.values(context.bundle ?? {}).find(
          (item) => item.type === 'chunk' && item.facadeModuleId?.endsWith('/src/mocks/browser.ts'),
        )
        if (!runtime || runtime.type !== 'chunk') return []
        const files = new Set<string>()
        const collect = (file: string) => {
          if (files.has(file)) return
          files.add(file)
          const chunk = context.bundle?.[file]
          if (chunk?.type === 'chunk') chunk.imports.forEach(collect)
        }
        collect(runtime.fileName)

        const preloads = [...files]
          .filter((file) => !html.includes(`href="/${file}"`))
          .map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'modulepreload',
              href: `/${file}`,
              crossorigin: '',
              fetchpriority: 'high',
            },
            injectTo: 'head' as const,
          }))
        return [
          ...preloads,
          {
            tag: 'script',
            children: `if ('serviceWorker' in navigator) {
            window.kurioWorkerReady = navigator.serviceWorker.register('/mockServiceWorker.js').then(async () => {
              await navigator.serviceWorker.ready;
              if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
            });
            window.kurioWorkerReady.catch(() => {});
          }`,
            injectTo: 'head' as const,
          },
        ]
      },
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      codeSplittingOptions: {
        splitBehavior: ({ routeId }) =>
          routeId === '/' || routeId === '/nft/$nftId' ? [] : undefined,
      },
    }),
    react(),
    tailwindcss(),
    preloadMockRuntime(),
    nftDocumentMetadata(),
  ],
})
