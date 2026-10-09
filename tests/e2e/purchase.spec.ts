import { test, expect } from '@playwright/test'
test('compra fictícia confirma, persiste comprovante e limpa carrinho', async ({ page }) => {
  await page.goto('/nft/emerald')
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page.locator('aside[role=status]')).toContainText('NFT adicionado')
  await page.goto('/checkout')
  const login = page.getByRole('dialog')
  await login.getByLabel('E-mail', { exact: true }).fill('gabriel@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  if (page.viewportSize()!.width < 768) {
    await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
    await page.getByRole('dialog').getByLabel('Nome da carteira', { exact: true }).fill('Principal')
    await page
      .getByRole('dialog')
      .getByLabel('Endereço da carteira', { exact: true })
      .fill(`0x${'a'.repeat(40)}`)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Conectar carteira', exact: true })
      .click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  } else {
    await page.locator('input[name=username]').fill('gabriel')
    await page.locator('input[name=profileName]').fill('Principal')
    await page.locator('select[name=network]').selectOption('Ethereum')
    await page.locator('input[name=walletAddress]').fill(`0x${'a'.repeat(40)}`)
    await page.locator('input[name=referralCode]').fill('KURIO')
  }
  await page.evaluate(() =>
    fetch('/api/mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'server-error' }),
    }),
  )
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).not.toHaveURL(/order=/)
  await page.evaluate(() =>
    fetch('/api/mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'default' }),
    }),
  )
  if (
    page.viewportSize()!.width < 768 &&
    (await page.getByRole('dialog', { name: 'Revisar compra' }).count())
  )
    await page.getByRole('dialog').getByRole('button', { name: 'Tentar novamente' }).click()
  else await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Revisar compra' })
  await review.getByRole('checkbox').check()
  await review.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/order=/)
  await expect(page.getByText('1.206 ETH', { exact: true }).last()).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  const result = await page.evaluate(async () => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` }
    const cart = await (await fetch('/api/cart', { headers })).json()
    const db = JSON.parse(localStorage.getItem('kurio-mock-database-v1')!)
    const order = db.orders[0]
    const replay = await (
      await fetch('/api/orders', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', 'Idempotency-Key': order.key },
        body: JSON.stringify({
          walletId: order.wallet.id,
          expectedTotal: order.cart.total,
          expectedRevision: order.cart.revision,
          collector: order.collector,
        }),
      })
    ).json()
    return { count: cart.count, orders: db.orders.length, same: replay.id === order.id }
  })
  expect(result).toEqual({ count: 0, orders: 1, same: true })
  await page.screenshot({
    path: `test-results/purchase-${page.viewportSize()!.width}.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Ver no Etherscan' }).click()
  await expect(page.getByRole('dialog')).toContainText('não possui registro no Etherscan')
})
