import { expect, type Page } from '@playwright/test'

export async function mockRequest(
  page: Page,
  path: string,
  method = 'GET',
  body?: unknown,
  extraHeaders: Record<string, string> = {},
) {
  return page.evaluate(
    async ({ path, method, body, extraHeaders }) => {
      const token = localStorage.getItem('kurio-session-token')
      const response = await fetch(`/api/${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Cart': localStorage.getItem('kurio-guest-cart') ?? '',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...extraHeaders,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      return {
        status: response.status,
        data: response.status === 204 ? null : await response.json(),
      }
    },
    { path, method, body, extraHeaders },
  )
}

export async function setScenario(page: Page, scenario: string) {
  expect((await mockRequest(page, 'mock/scenario', 'PUT', { scenario })).status).toBe(200)
}

export async function loginForCheckout(page: Page) {
  await page.goto('/checkout')
  const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await dialog.getByLabel('E-mail', { exact: true }).fill('gabriel@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(dialog).toHaveCount(0)
  await expect
    .poll(() => page.evaluate(() => !!localStorage.getItem('kurio-session-token')))
    .toBe(true)
}

export async function seedCheckout(page: Page) {
  await page.goto('/nft/emerald')
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page.locator('aside[role=status]')).toContainText('NFT adicionado')
  await loginForCheckout(page)
  const wallets = await mockRequest(page, 'wallets', 'POST', {
    name: 'Principal',
    profileName: 'Principal',
    displayName: 'Gabriel Sales',
    type: 'Coinbase Wallet',
    network: 'Ethereum',
    address: `0x${'a'.repeat(40)}`,
    ens: 'gabriel.kurio.eth',
    secondaryAddress: '',
    referralCode: 'KURIO',
    email: 'gabriel@kurio.test',
  })
  expect(wallets.status).toBe(200)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeEnabled()
  await expect(page.locator('[data-realtime-state]')).toHaveAttribute(
    'data-realtime-state',
    'connected',
  )
  return wallets.data.items[0].id as string
}

export async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Revisar compra' })
  await expect(review.getByRole('checkbox')).toBeEnabled()
  return review
}

export async function sendReviewedOrder(page: Page) {
  const review = await openReview(page)
  await review.getByRole('checkbox').check()
  await review.getByRole('button', { name: 'Enviar pedido' }).click()
}
