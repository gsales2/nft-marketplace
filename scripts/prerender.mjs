import { spawn } from 'node:child_process'
import { readFile, writeFile, readdir, access } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { loadEnv } from 'vite'

const port = Number(process.env.KURIO_PRERENDER_PORT ?? 5196)
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('Porta de pré-renderização inválida.')
}
const baseURL = `http://127.0.0.1:${port}`
const environment = loadEnv('production', process.cwd(), 'VITE_')
if (
  !(await readFile('dist/index.html', 'utf8')).includes('kurioWorkerReady') ||
  (environment.VITE_MOCK_SCENARIO && environment.VITE_MOCK_SCENARIO !== 'default')
) {
  console.log('Prerender skipped: only the default mock build exports public snapshots.')
  process.exit(0)
}
const server = spawn(process.execPath, ['scripts/preview.mjs', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
})
let listening = false
let startupError
server.stdout.on('data', (chunk) => {
  if (chunk.toString().includes('Production preview:')) listening = true
})
server.on('error', (error) => {
  startupError = error
})
server.on('exit', (code) => {
  if (!listening) startupError = new Error(`O preview encerrou antes de iniciar (código ${code}).`)
})
let browser
const requestedPage = process.argv.find((arg) => arg.startsWith('--page='))?.slice(7)
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (startupError) throw startupError
    try {
      if (listening && (await fetch(baseURL)).ok) break
    } catch {
      /* Preview starts asynchronously. */
    }
    if (attempt === 49) throw new Error('Preview de pré-renderização indisponível.')
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  let channel = process.env.PLAYWRIGHT_CHANNEL
  if (!channel && process.platform === 'win32') {
    try {
      await access('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
      channel = 'msedge'
    } catch {
      /* Use installed Playwright Chromium. */
    }
  }
  browser = await chromium.launch({ channel, headless: true })
  const routes = [
    { url: '/', file: 'dist/index.html' },
    ...(await readdir('dist/nft'))
      .filter((file) => file.endsWith('.html'))
      .map((file) => ({
        url: `/nft/${file.slice(0, -5)}`,
        file: path.join('dist/nft', file),
      })),
  ].filter((route) => !requestedPage || route.url === requestedPage)
  // Capture every page before writing, so no route consumes another snapshot.
  const documents = []
  for (const route of routes) {
    const snapshots = {}
    for (const [profile, width] of [
      ['desktop', 1440],
      ['mobile', 390],
    ]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } })
      const page = await context.newPage()
      try {
        await page.goto(new URL(route.url, baseURL).href)
        await page.locator('[data-realtime-state="connected"]').waitFor({ state: 'attached' })
        await page.waitForFunction(() => !document.querySelector('[data-skeleton]'))
        await page.waitForFunction(() => typeof window.kurioRenderPublicPage === 'function')
        snapshots[profile] = await page.evaluate(() => window.kurioRenderPublicPage())
      } finally {
        await context.close()
      }
    }
    documents.push({ route, snapshots })
    console.log(`Prerender: ${route.url} (desktop/mobile)`)
  }
  for (const { route, snapshots } of documents) {
    const original = await readFile(route.file, 'utf8')
    const state = JSON.stringify({
      desktop: snapshots.desktop.state,
      mobile: snapshots.mobile.state,
    }).replaceAll('<', '\\u003c')
    const body = `<div id="root">${snapshots.desktop.html}</div>
      <template id="kurio-mobile-page">${snapshots.mobile.html}</template>
      <script id="kurio-public-state" type="application/json">${state}</script>
      <script>
        if ((location.pathname === ${JSON.stringify(route.url)} || location.pathname === ${JSON.stringify(route.url === '/' ? '/' : `${route.url}/`)}) &&
            !location.search && !localStorage.getItem('kurio-session-token') &&
            !localStorage.getItem('kurio-mock-database-v1') &&
            (!localStorage.getItem('kurio-mock-scenario') || localStorage.getItem('kurio-mock-scenario') === 'default')) {
          window.kurioPrerenderProfile = matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
          if (window.kurioPrerenderProfile === 'mobile') document.getElementById('root').replaceChildren(document.getElementById('kurio-mobile-page').content.cloneNode(true));
        } else document.getElementById('root').replaceChildren();
        document.getElementById('kurio-mobile-page').remove();
      </script>`
    await writeFile(route.file, original.replace('<div id="root"></div>', body))
  }
} finally {
  await browser?.close()
  server.kill()
}
