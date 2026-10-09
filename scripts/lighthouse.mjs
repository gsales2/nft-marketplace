import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { pages, profiles, targets } from './lighthouse.config.mjs'

const runs = Number(process.argv.find((arg) => arg.startsWith('--runs='))?.split('=')[1] ?? 3)
const selectedProfile = process.argv.find((arg) => arg.startsWith('--profile='))?.split('=')[1]
const throttlingMethod =
  process.argv.find((arg) => arg.startsWith('--throttling='))?.split('=')[1] ?? 'devtools'
if (!['simulate', 'devtools'].includes(throttlingMethod))
  throw new Error('Método de throttling inválido.')
if (selectedProfile && !(selectedProfile in profiles)) throw new Error('Perfil desconhecido.')
const directory =
  process.argv.find((arg) => arg.startsWith('--output='))?.split('=')[1] ?? 'reports/lighthouse'
if (!Number.isInteger(runs) || runs < 1 || runs > 5) throw new Error('Use entre 1 e 5 medições.')
const baseURL = process.env.LIGHTHOUSE_URL ?? 'http://127.0.0.1:5195'
const browserPath =
  process.env.CHROME_PATH ??
  (process.platform === 'win32'
    ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    : undefined)
const server = process.env.LIGHTHOUSE_URL
  ? null
  : spawn(
      process.execPath,
      ['scripts/preview.mjs', '--host', '127.0.0.1', '--port', '5195', '--strictPort'],
      { stdio: 'ignore', windowsHide: true },
    )
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
let chrome
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(baseURL)).ok) break
    } catch {
      /* Preview may still be starting. */
    }
    if (attempt === 49) throw new Error('O servidor de preview não iniciou.')
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  await fs.mkdir(directory, { recursive: true })
  chrome = await chromeLauncher.launch({
    chromePath: browserPath,
    chromeFlags: ['--headless=new', '--disable-gpu', '--no-first-run'],
  })
  const results = []
  const configurations = {}
  let browserVersion
  for (const [profile, settings] of Object.entries(profiles)) {
    if (selectedProfile && selectedProfile !== profile) continue
    for (const page of pages) {
      const measurements = []
      for (let run = 1; run <= runs; run++) {
        const config = {
          extends: 'lighthouse:default',
          settings: {
            ...(profile === 'desktop' ? desktopConfig.settings : {}),
            ...settings,
            onlyCategories: Object.keys(targets),
            throttlingMethod,
            clearStorageTypes: [
              'file_systems',
              'shader_cache',
              'service_workers',
              'cache_storage',
              'local_storage',
              'indexeddb',
            ],
          },
        }
        const result = await lighthouse(
          new URL(page.path, baseURL).href,
          { port: chrome.port, output: ['html', 'json'], logLevel: 'error' },
          config,
        )
        if (!result || result.lhr.runtimeError)
          throw new Error(result?.lhr.runtimeError?.message ?? 'Auditoria sem resultado.')
        configurations[profile] = result.lhr.configSettings
        browserVersion = result.lhr.environment.hostUserAgent
        const prefix = path.join(directory, `${page.name}-${profile}-${run}`)
        await fs.writeFile(`${prefix}.html`, result.report[0])
        await fs.writeFile(`${prefix}.json`, result.report[1])
        const scores = Object.fromEntries(
          Object.entries(result.lhr.categories).map(([name, category]) => [
            name,
            Math.round(category.score * 100),
          ]),
        )
        const metrics = {
          lcp: result.lhr.audits['largest-contentful-paint'].numericValue,
          cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
          tbt: result.lhr.audits['total-blocking-time'].numericValue,
        }
        measurements.push({ scores, metrics })
        console.log(JSON.stringify({ page: page.name, profile, run, scores, metrics }))
      }
      results.push({
        page: page.name,
        profile,
        measurements,
        median: {
          scores: Object.fromEntries(
            Object.keys(targets).map((category) => [
              category,
              median(measurements.map((item) => item.scores[category])),
            ]),
          ),
          metrics: Object.fromEntries(
            ['lcp', 'cls', 'tbt'].map((metric) => [
              metric,
              median(measurements.map((item) => item.metrics[metric])),
            ]),
          ),
        },
      })
    }
  }
  const lighthousePackage = JSON.parse(
    await fs.readFile('node_modules/lighthouse/package.json', 'utf8'),
  )
  const environment = {
    date: new Date().toISOString(),
    baseURL,
    node: process.version,
    platform: os.platform(),
    release: os.release(),
    cpu: os.cpus()[0]?.model,
    cpuCount: os.cpus().length,
    memoryGB: Math.round(os.totalmem() / 1024 ** 3),
    lighthouse: lighthousePackage.version,
    browserPath,
    browserVersion,
    configurations,
    mocks: {
      scenario: 'default',
      baselineLatencyMs: 180,
      realtime: 'Socket.IO over MSW WebSocket',
    },
    server: 'production preview, Brotli/gzip compression; browser cache reset every run',
    runs,
    throttling: `Lighthouse ${throttlingMethod}; desktop/mobile defaults; cold storage per run`,
    targets,
  }
  await fs.writeFile(
    path.join(directory, 'summary.json'),
    JSON.stringify({ environment, results }, null, 2),
  )
  const failed = results.filter((result) =>
    Object.entries(targets).some(([category, target]) => result.median.scores[category] < target),
  )
  if (failed.length) {
    console.error(
      'Metas não atingidas:',
      JSON.stringify(failed.map(({ page, profile, median }) => ({ page, profile, median }))),
    )
    process.exitCode = 1
  }
} finally {
  await chrome?.kill()
  server?.kill()
}
