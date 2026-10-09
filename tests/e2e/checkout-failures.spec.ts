import { test, expect } from '@playwright/test'
import {
  seedCheckout,
  mockRequest,
  setScenario,
  openReview,
  sendReviewedOrder,
} from '../helpers/checkout'

test('timeout após criação persiste a tentativa e recupera o mesmo pedido após refresh', async ({
  page,
}) => {
  await seedCheckout(page)
  await setScenario(page, 'timeout-after-order')
  await sendReviewedOrder(page)
  await expect(page.getByRole('heading', { name: 'Recuperar tentativa de compra' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Acompanhar compra' })).toBeVisible()
  const before = await mockRequest(page, 'orders')
  expect(before.data).toHaveLength(1)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Acompanhar compra' })).toBeVisible()
  await page.getByRole('button', { name: 'Acompanhar compra' }).click()
  await expect(page).toHaveURL(new RegExp(`order=${before.data[0].id}`))
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  expect((await mockRequest(page, 'orders')).data).toHaveLength(1)
})

test('cliques repetidos criam um pedido; replay conflitante é rejeitado e recibo é imutável', async ({
  page,
}) => {
  await seedCheckout(page)
  const review = await openReview(page)
  await expect(review.getByRole('button', { name: 'Enviar pedido' })).toBeDisabled()
  await review.getByRole('checkbox').check()
  // Two actual browser clicks in the same task exercise the submission guard and server key.
  await review
    .getByRole('button', { name: 'Enviar pedido' })
    .evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
    })
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  const orders = (await mockRequest(page, 'orders')).data
  expect(orders).toHaveLength(1)
  const order = orders[0]
  const input = {
    walletId: order.wallet.id,
    expectedTotal: order.cart.total,
    expectedRevision: order.cart.revision,
    collector: order.collector,
  }
  const headers = { 'Idempotency-Key': order.key }
  expect((await mockRequest(page, 'orders', 'POST', input, headers)).data.id).toBe(order.id)
  expect(
    (await mockRequest(page, 'orders', 'POST', { ...input, expectedRevision: 'changed' }, headers))
      .status,
  ).toBe(409)
  expect(
    (
      await mockRequest(
        page,
        'orders',
        'POST',
        { ...input, collector: { ...order.collector, notes: 'Outro conteúdo' } },
        headers,
      )
    ).status,
  ).toBe(409)
  await mockRequest(page, 'mock/realtime', 'POST', {
    action: 'nft',
    nftId: 'emerald',
    price: '5.19',
  })
  await page.reload()
  await expect(page.getByText('1.206 ETH', { exact: true }).last()).toBeVisible()
  expect((await mockRequest(page, `orders/${order.id}`)).data.cart.total).toBe('1.206')
})

test('preço muda durante revisão via Socket.IO e exige nova aceitação', async ({ page }) => {
  await seedCheckout(page)
  const review = await openReview(page)
  await review.getByRole('checkbox').check()
  await mockRequest(page, 'mock/realtime', 'POST', {
    action: 'nft',
    nftId: 'emerald',
    price: '2.19',
    version: 1,
  })
  await expect(review.getByRole('status').last()).toContainText('cotação mudou')
  await expect(review.getByText('2.206 ETH', { exact: true })).toBeVisible()
  await expect(review.getByRole('checkbox')).not.toBeChecked()
  await expect(review.getByRole('button', { name: 'Enviar pedido' })).toBeDisabled()
  await review.getByRole('checkbox').check()
  await review.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  expect((await mockRequest(page, 'orders')).data[0].cart.total).toBe('2.206')
})

test('conflito no envio e edição esgotada preservam carrinho e bloqueiam a compra', async ({
  page,
}) => {
  await seedCheckout(page)
  await setScenario(page, 'price-changed')
  await sendReviewedOrder(page)
  const review = page.getByRole('dialog', { name: 'Revisar compra' })
  await expect(review.getByRole('alert')).toContainText('cotação mudou')
  await expect(review.getByText('1.306 ETH', { exact: true })).toBeVisible()
  await expect(review.getByRole('checkbox')).not.toBeChecked()
  expect((await mockRequest(page, 'orders')).data).toHaveLength(0)
  await setScenario(page, 'edition-sold-out')
  await review.getByRole('checkbox').check()
  await review.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(review.getByRole('alert').first()).toContainText('indisponível')
  await expect(review.getByRole('button', { name: 'Enviar pedido' })).toBeDisabled()
  expect((await mockRequest(page, 'cart')).data.count).toBe(1)
  expect((await mockRequest(page, 'orders')).data).toHaveLength(0)
})

test('carteira desconectada ou conexão recusada não cria pedido', async ({ page }) => {
  await seedCheckout(page)
  await page.getByRole('button', { name: 'Desconectar carteira' }).click()
  await expect(page.getByRole('button', { name: 'Reconectar carteira' })).toBeEnabled()
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page.getByRole('alert').first()).toContainText(/Conecte|Reconecte/)
  if (await page.getByRole('dialog').count())
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar janela' }).click()
  await setScenario(page, 'wallet-refused')
  await page.getByRole('button', { name: 'Reconectar carteira' }).click()
  await expect(page.getByRole('alert').first()).toContainText(/recusada|Reconecte/)
  expect((await mockRequest(page, 'orders')).data).toHaveLength(0)
  expect((await mockRequest(page, 'cart')).data.count).toBe(1)
  await setScenario(page, 'default')
  await page.getByRole('button', { name: 'Reconectar carteira' }).click()
  await expect(page.getByRole('button', { name: 'Desconectar carteira' })).toBeVisible()
})

test('pagamento recusado preserva itens e confirmação remove apenas quantidades compradas', async ({
  page,
}) => {
  await seedCheckout(page)
  await setScenario(page, 'payment-refused')
  await sendReviewedOrder(page)
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  expect((await mockRequest(page, 'cart')).data.count).toBe(1)
  await setScenario(page, 'pending-order')
  await page.goto('/checkout')
  await sendReviewedOrder(page)
  await expect(page.getByRole('heading', { name: 'Compra em processamento' })).toBeVisible()
  const pending = (await mockRequest(page, 'orders')).data.find(
    (order: { status: string }) => order.status === 'pending',
  )
  await mockRequest(page, 'cart', 'POST', { nftId: 'emerald', edition: '1/50', quantity: 1 })
  await mockRequest(page, 'cart', 'POST', { nftId: 'violet', edition: '1/50', quantity: 1 })
  await mockRequest(page, 'mock/realtime', 'POST', {
    action: 'order',
    orderId: pending.id,
    status: 'confirmed',
  })
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  const cart = (await mockRequest(page, 'cart')).data
  expect(cart.count).toBe(2)
  expect(cart.items.map((item: { quantity: number }) => item.quantity)).toEqual([1, 1])
  await mockRequest(page, 'mock/realtime', 'POST', {
    action: 'order',
    orderId: pending.id,
    status: 'refused',
  })
  expect((await mockRequest(page, `orders/${pending.id}`)).data.status).toBe('confirmed')
})

test('cupom expirado é revalidado e pode ser removido antes de comprar', async ({ page }) => {
  await seedCheckout(page)
  await mockRequest(page, 'cart', 'PUT', { coupon: 'KURIO10' })
  await page.reload()
  const review = await openReview(page)
  await expect(review.getByText('1.087 ETH', { exact: true })).toBeVisible()
  await setScenario(page, 'coupon-expired')
  await review.getByRole('checkbox').check()
  await review.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(review.getByRole('alert').first()).toContainText('cupom expirou')
  expect((await mockRequest(page, 'orders')).data).toHaveLength(0)
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar janela' }).click()
  await page.goto('/cart')
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(page.getByText('KURIO10 aplicado')).toHaveCount(0)
  expect((await mockRequest(page, 'cart')).data.total).toBe('1.206')
})

test('preços com 18 casas mantêm precisão no detalhe, na cotação e no recibo', async ({ page }) => {
  await seedCheckout(page)
  await mockRequest(page, 'mock/realtime', 'POST', {
    action: 'nft',
    nftId: 'emerald',
    price: '1.190000000000000001',
  })
  await page.goto('/nft/emerald')
  await expect(page.getByText('1.190000000000000001 ETH', { exact: true }).first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto('/cart')
  await expect(page.getByText('1.206000000000000001 ETH', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto('/checkout')
  const review = await openReview(page)
  await expect(review.getByText('1.206000000000000001 ETH', { exact: true })).toBeVisible()
  await review.getByRole('checkbox').check()
  await review.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect((await mockRequest(page, 'orders')).data[0].cart.total).toBe('1.206000000000000001')
})

test('expiração no pedido pendente retoma a mesma URL e troca de usuário isola eventos', async ({
  page,
}) => {
  await seedCheckout(page)
  await setScenario(page, 'pending-order')
  await sendReviewedOrder(page)
  await expect(page.getByRole('heading', { name: 'Compra em processamento' })).toBeVisible()
  const url = page.url()
  const order = (await mockRequest(page, 'orders')).data[0]
  await mockRequest(page, 'session/expire', 'POST')
  await page.reload()
  const login = page.getByRole('dialog', { name: 'Entrar na Kurio' })
  await login.getByLabel('E-mail', { exact: true }).fill('gabriel@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).toHaveURL(url)
  await expect(page.getByRole('heading', { name: 'Compra em processamento' })).toBeVisible()
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair', exact: true }).last().click()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('kurio-session-token')))
    .toBeNull()
  await page.goto('/checkout')
  await login.getByLabel('E-mail', { exact: true }).fill('nova@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(login).toHaveCount(0)
  await expect(page.locator('[data-realtime-state]')).toHaveAttribute(
    'data-realtime-state',
    'connected',
  )
  expect((await mockRequest(page, `orders/${order.id}`)).status).toBe(404)
  await mockRequest(page, 'mock/realtime', 'POST', {
    action: 'order',
    orderId: order.id,
    status: 'confirmed',
  })
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toHaveCount(0)
  expect((await mockRequest(page, 'orders')).data).toEqual([])
  expect((await mockRequest(page, 'cart')).data.count).toBe(0)
})
