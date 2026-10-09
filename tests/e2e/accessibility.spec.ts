import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { seedCheckout, openReview, setScenario } from '../helpers/checkout'

test('início, detalhe, carrinho, pagamento e revisão atendem às regras WCAG A/AA', async ({
  page,
}) => {
  await seedCheckout(page)
  for (const path of ['/', '/nft/emerald', '/cart', '/checkout']) {
    await page.goto(path)
    await expect(page.locator('main')).toBeVisible()
    if (path === '/')
      await expect(
        page.getByRole('region', { name: 'Catálogo de NFTs' }).locator('article').first(),
      ).toBeVisible()
    if (path === '/nft/emerald')
      await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    if (path === '/cart')
      await expect(page.getByLabel('Quantidade de Emerald Ape #042', { exact: true })).toBeVisible()
    if (path === '/checkout')
      await expect(
        page.getByRole('button', { name: 'Confirmar compra', exact: true }),
      ).toBeEnabled()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(
      results.violations,
      `${path}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
    ).toEqual([])
  }
  await openReview(page)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

test('teclado mantém foco no diálogo e o devolve ao botão; skip link funciona', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('region', { name: 'Catálogo de NFTs' }).locator('article').first(),
  ).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#page-content')).toBeFocused()
  const trigger = page.getByRole('button', { name: /Pesquisar NFTs$/ })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Pesquisar NFTs' })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('shimmer respeita movimento reduzido e skeletons cobrem detalhes e resumo lento', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('kurio-mock-scenario', 'slow'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/nft/emerald')
  await expect(page.getByRole('status', { name: 'Carregando NFT' })).toBeVisible()
  await expect(page.locator('[data-skeleton]').first()).toBeVisible()
  expect(
    await page
      .locator('[data-skeleton]')
      .first()
      .evaluate((element) => getComputedStyle(element, '::after').animationName),
  ).toBe('none')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByRole('status', { name: 'Carregando resumo' })).toBeVisible()
  await expect(page.locator('[data-skeleton]').first()).toBeVisible()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  await setScenario(page, 'default')
})

test('conteúdo mantém reflow em viewport equivalente a zoom de 200%', async ({ page }) => {
  await seedCheckout(page)
  for (const path of ['/', '/nft/emerald', '/cart', '/checkout', '/profile']) {
    await page.goto(path)
    await expect(page.locator('main')).toBeVisible()
    // 200% browser zoom halves the effective CSS viewport; emulate its reflow.
    const original = page.viewportSize()!
    await page.setViewportSize({
      width: Math.max(320, Math.floor(original.width / 2)),
      height: original.height,
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      path,
    ).toBe(true)
    await page.setViewportSize(original)
  }
})

test('erro de senha no perfil é associado ao campo e recebe foco', async ({ page }) => {
  await seedCheckout(page)
  await page.goto('/profile')
  await page.locator('input[name=username]').fill('gabriel_coletor')
  await page.locator('input[name=walletNickname]').fill('Principal')
  const password = page.locator('input[name=currentPassword]')
  await password.fill('Incorreta123!')
  await page.locator('input[name=newPassword]').fill('NovaSenha123!')
  await page.locator('input[name=confirmation]').fill('NovaSenha123!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Senha atual incorreta')
  await expect(password).toHaveAttribute('aria-invalid', 'true')
  await expect(password).toBeFocused()
  const errorId = await password.getAttribute('aria-describedby')
  expect(errorId).toBeTruthy()
  await expect(page.locator(`[id="${errorId}"]`)).toContainText('Senha atual incorreta')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
