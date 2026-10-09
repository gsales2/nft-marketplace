import { test, expect, type Page } from '@playwright/test'

async function add(page: Page, id = 'emerald') {
  await page.goto(`/nft/${id}`)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page.locator('aside[role=status]')).toContainText('NFT adicionado ao carrinho!')
}
async function request(page: Page, method: string, body?: unknown) {
  return page.evaluate(
    async ({ method, body }) => {
      const token = localStorage.getItem('kurio-session-token')
      const response = await fetch('/api/cart', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Cart': localStorage.getItem('kurio-guest-cart')!,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      return { status: response.status, data: await response.json() }
    },
    { method, body },
  )
}

test('adição, confirmação, contador, pagamento, quantidade e remoção persistem', async ({
  page,
}) => {
  await add(page)
  if (page.viewportSize()!.width >= 768)
    await expect(page.locator('header').last().getByLabel('1 itens no carrinho')).toBeVisible()
  await page.getByRole('button', { name: 'Fechar confirmação' }).click()
  await page.getByRole('link', { name: 'Abrir carrinho' }).first().click()
  await expect(
    page.getByRole('heading', {
      name: page.viewportSize()!.width < 768 ? 'Carrinho de NFTs' : 'Resumo da carteira',
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Aumentar Emerald Ape' }).click()
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveText('2')
  await expect(page.locator('dd').last()).toHaveText('2.396 ETH')
  await page.reload()
  await expect(
    page.getByRole('link', { name: 'Emerald Ape #042', exact: true }).last(),
  ).toBeVisible()
  await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toHaveText('2')
  await page.getByRole('button', { name: 'Remover Emerald Ape #042', exact: true }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
})

test('API valida estoque e cupons com valores ETH exatos', async ({ page }) => {
  await add(page)
  expect(
    (await request(page, 'POST', { nftId: 'emerald', edition: '1/1', quantity: 2 })).status,
  ).toBe(422)
  expect(
    (await request(page, 'POST', { nftId: 'emerald', edition: 'fake', quantity: 1 })).status,
  ).toBe(422)
  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  await page.getByLabel('Código promocional').fill('EXPIRADO')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Este cupom expirou.')
  await page.getByLabel('Código promocional').fill('kurio10')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByText('KURIO10 aplicado')).toBeVisible()
  const result = await request(page, 'GET')
  expect(result.data).toMatchObject({
    subtotal: '1.19',
    discount: '0.119',
    networkFee: '0.016',
    total: '1.087',
    count: 1,
  })
})

test('login transfere carrinho do visitante sem duplicar e logout isola contas', async ({
  page,
}) => {
  await add(page)
  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail', { exact: true }).fill('gabriel@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(dialog).toHaveCount(0)
  if (page.viewportSize()!.width < 768) {
    await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  } else {
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await page.getByRole('link', { name: 'Carrinho', exact: true }).click()
  }
  expect((await request(page, 'GET')).data.count).toBe(1)
  await page.reload()
  await expect(
    page.getByRole('link', { name: 'Emerald Ape #042', exact: true }).last(),
  ).toBeVisible()
  if (page.viewportSize()!.width < 768) {
    await page.goto('/')
    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click()
  }
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toHaveCount(0)
  if (page.viewportSize()!.width < 768) {
    await expect(page.getByRole('button', { name: 'Entrar', exact: true }).first()).toBeVisible()
    await page.goto('/cart')
  }
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  expect((await request(page, 'GET')).data.count).toBe(0)
})

test('falha não mostra confirmação nem altera carrinho', async ({ page }) => {
  await page.goto('/nft/emerald')
  await expect(page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ })).toBeEnabled()
  await page.evaluate(() =>
    fetch('/api/mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'server-error' }),
    }),
  )
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Não foi possível atualizar o carrinho')
  await expect(page.locator('aside[role=status]')).toHaveCount(0)
  expect(
    await page.evaluate(() =>
      Object.values(JSON.parse(localStorage.getItem('kurio-mock-database-v1')!).carts).every(
        (cart: unknown) => (cart as { items: unknown[] }).items.length === 0,
      ),
    ),
  ).toBe(true)
})

test('pagamento adapta larguras sem rolagem horizontal', async ({ page }) => {
  await add(page)
  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
})
