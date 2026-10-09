import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['direct-routes.spec.ts', 'purchase.spec.ts', 'realtime.spec.ts', 'catalog.spec.ts'],
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'reports/deployment' }]],
  outputDir: 'test-results/deployment',
  use: {
    baseURL: process.env.DEPLOYMENT_URL ?? 'https://kurio-nft-marketplace-blond.vercel.app',
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-publico', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-publico', use: { viewport: { width: 390, height: 844 } } },
  ],
})
