import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    // Bordas de SVG e imagens arredondadas variam alguns pixels entre máquinas Windows.
    toHaveScreenshot: { maxDiffPixels: 40 },
  },
  snapshotPathTemplate: '{testDir}/visual-baselines/{projectName}/{arg}{ext}',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5190',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'chromium-mobile',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 } },
    },
    {
      name: 'chromium-tablet',
      testMatch: /(?:visual|accessibility)\.spec\.ts/,
      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } },
    },
  ],
  webServer: {
    command: `${process.env.PLAYWRIGHT_PREVIEW === 'true' ? 'npm run preview' : 'npm run dev'} -- --host 127.0.0.1 --port 5190 --strictPort`,
    url: 'http://127.0.0.1:5190',
    reuseExistingServer: false,
  },
})
