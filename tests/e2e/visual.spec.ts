import { test, expect, type Page } from '@playwright/test'
import { seedCheckout } from '../helpers/checkout'

async function settleVisuals(page: Page) {
  await expect(page.locator('[data-realtime-state]')).toHaveAttribute(
    'data-realtime-state',
    'connected',
  )
  await expect(page.locator('[data-skeleton]')).toHaveCount(0)
  await expect(page.getByText('Atualizando catálogo…', { exact: true })).toHaveCount(0)
  await page.evaluate(async () => {
    await document.fonts.ready
    // A captura inclui a página inteira, inclusive imagens fora do viewport.
    for (const image of document.images) image.loading = 'eager'
  })
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.images]
          .filter((image) => image.getAttribute('src'))
          .every((image) => image.complete && image.naturalWidth > 0),
      ),
    )
    .toBe(true)
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((image) => image.getAttribute('src'))
        .map((image) => image.decode()),
    ),
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.setFixedTime(new Date('2026-07-29T12:00:00Z'))
})

test('início — baseline estável', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('region', { name: 'Catálogo de NFTs' }).locator('article').first(),
  ).toBeVisible()
  await settleVisuals(page)
  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true, animations: 'disabled' })
})

test('detalhe — baseline estável', async ({ page }) => {
  await page.goto('/nft/emerald')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Coleção página 1/ })).toBeVisible()
  await settleVisuals(page)
  await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true, animations: 'disabled' })
})

test('carrinho — baseline estável', async ({ page }) => {
  await seedCheckout(page)
  await page.goto('/cart')
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveText('1')
  await settleVisuals(page)
  await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true, animations: 'disabled' })
})

test('pagamento — baseline estável', async ({ page }) => {
  await seedCheckout(page)
  await settleVisuals(page)
  await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true, animations: 'disabled' })
})
