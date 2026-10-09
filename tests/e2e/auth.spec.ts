import { test, expect, type Page } from '@playwright/test'

async function openLogin(page: Page) {
  if (page.viewportSize()!.width < 768 && new URL(page.url()).pathname.startsWith('/nft/')) {
    await page.getByRole('button', { name: 'Favoritar', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
    return
  }
  if (page.viewportSize()!.width < 768) {
    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click()
    await page
      .getByRole('navigation', { name: 'Navegação principal mobile' })
      .getByRole('button', { name: 'Entrar', exact: true })
      .click()
  } else await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
}
async function credentials(page: Page, email = 'gabriel@kurio.test', password = 'Kurio123!') {
  const modal = page.getByRole('dialog')
  await modal.getByLabel('E-mail', { exact: true }).fill(email)
  await modal.getByLabel('Senha', { exact: true }).fill(password)
  await modal.getByRole('button', { name: 'Entrar', exact: true }).last().click()
}
async function logout(page: Page) {
  const returnUrl = new URL(page.url()).pathname
  const mobileNft = page.viewportSize()!.width < 768 && returnUrl.startsWith('/nft/')
  if (mobileNft) await page.getByRole('link', { name: 'Voltar ao mercado' }).click()
  if (page.viewportSize()!.width < 768)
    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Entrar', exact: true }).first()).toBeVisible()
  if (page.viewportSize()!.width < 768) await page.keyboard.press('Escape')
  if (mobileNft) await page.goto(returnUrl)
}
async function scenario(page: Page, value: string) {
  await expect(page.locator('#root')).toBeVisible()
  const result = await page.evaluate(async (value) => {
    const response = await fetch('/api/mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: value }),
    })
    return { status: response.status, body: await response.json() }
  }, value)
  expect(result).toEqual({ status: 200, body: { scenario: value } })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(
    page
      .locator('header')
      .getByRole('button', { name: 'Entrar', exact: true, includeHidden: true })
      .last(),
  ).toBeAttached()
})

test('login inválido, recuperação, sessão após refresh e logout', async ({ page }) => {
  await openLogin(page)
  await credentials(page, 'gabriel@kurio.test', 'incorreta')
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  await credentials(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  if (page.viewportSize()!.width < 768)
    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click()
  await expect(page.locator('[aria-label="Conta de Gabriel Sales"]:visible')).toBeVisible()
  await page.reload()
  if (page.viewportSize()!.width < 768)
    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click()
  await expect(page.locator('[aria-label="Conta de Gabriel Sales"]:visible')).toBeVisible()
  if (page.viewportSize()!.width < 768) await page.keyboard.press('Escape')
  await logout(page)
  await page.reload()
  await expect(page.getByLabel('Conta de Gabriel Sales')).toHaveCount(0)
})

test('cadastro, conflito, validação de senha e persistência segura', async ({ page }) => {
  await openLogin(page)
  const modal = page.getByRole('dialog')
  await modal
    .getByRole('button', {
      name: page.viewportSize()!.width < 768 ? 'Novo na Kurio? Crie uma conta' : 'Criar conta',
      exact: true,
    })
    .click()
  await modal.getByLabel('Nome', { exact: true }).fill('Colecionador Teste')
  await modal.getByLabel('E-mail', { exact: true }).fill('gabriel@kurio.test')
  await modal.getByLabel('Senha', { exact: true }).fill('Segredo123!')
  await modal.getByLabel('Confirmar senha', { exact: true }).fill('diferente123')
  await modal
    .getByRole('button', {
      name: page.viewportSize()!.width < 768 ? 'Criar perfil' : 'Criar conta',
      exact: true,
    })
    .last()
    .click()
  expect(
    await modal
      .getByLabel('Confirmar senha')
      .evaluate((input: HTMLInputElement) => input.validationMessage),
  ).toContain('iguais')
  await modal.getByLabel('Confirmar senha').fill('Segredo123!')
  await modal
    .getByRole('button', {
      name: page.viewportSize()!.width < 768 ? 'Criar perfil' : 'Criar conta',
      exact: true,
    })
    .last()
    .click()
  await expect(modal.getByRole('alert')).toContainText('Já existe uma conta')
  await expect(modal.getByLabel('E-mail', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await modal.getByLabel('E-mail', { exact: true }).fill('colecionador@kurio.test')
  await modal
    .getByRole('button', {
      name: page.viewportSize()!.width < 768 ? 'Criar perfil' : 'Criar conta',
      exact: true,
    })
    .last()
    .click()
  await expect(modal).toHaveCount(0)
  await logout(page)
  await page.reload()
  await openLogin(page)
  await credentials(page, 'colecionador@kurio.test', 'Segredo123!')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const stored = await page.evaluate(() => localStorage.getItem('kurio-mock-database-v1')!)
  expect(stored).not.toContain('Segredo123!')
  expect(stored).not.toContain('Kurio123!')
})

test('retorno ao NFT, favoritos por usuário e rollback da mutation', async ({ page }) => {
  await page.goto('/nft/emerald')
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await credentials(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/nft\/emerald$/)
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toBeEnabled()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toBeVisible()
  await scenario(page, 'favorite-error')
  await page.getByRole('button', { name: 'Favoritado', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Não foi possível atualizar favoritos')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toBeVisible()
  await scenario(page, 'default')
  await logout(page)
  await openLogin(page)
  await credentials(page, 'nova@kurio.test')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Favoritar', exact: true })).toBeVisible()
  await logout(page)
  await openLogin(page)
  await credentials(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toBeVisible()
})

test('sessão expira e permite retomar a mesma página', async ({ page }) => {
  await page.goto('/nft/sage')
  await scenario(page, 'session-expired')
  await openLogin(page)
  await credentials(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()
  await scenario(page, 'default')
  await credentials(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/nft\/sage$/)
})

test('latência, falha REST e recuperação sem submissão duplicada', async ({ page }) => {
  await openLogin(page)
  await scenario(page, 'server-error')
  await credentials(page)
  await expect(page.getByRole('alert')).toContainText('temporariamente indisponível')
  await scenario(page, 'network-error')
  await credentials(page)
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar')
  await scenario(page, 'slow')
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/session') && request.method() === 'POST')
      requests.push(request.url())
  })
  await credentials(page)
  await expect(page.getByRole('button', { name: 'Aguarde…' })).toBeDisabled()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Aguarde…' })
    .evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
    })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(requests).toHaveLength(1)
})

test('login direto aceita retorno interno e bloqueia redirecionamento externo', async ({
  page,
}) => {
  await page.goto('/login?returnTo=%2Fnft%2Fneon')
  await credentials(page)
  await expect(page).toHaveURL(/\/nft\/neon$/)
  await logout(page)
  await page.goto('/login?returnTo=https%3A%2F%2Fexample.com')
  await credentials(page)
  await expect
    .poll(() => new URL(page.url()).origin + new URL(page.url()).pathname)
    .toBe('http://127.0.0.1:5190/')
})

test('foco do diálogo, teclado e formulário vazio', async ({ page }) => {
  await openLogin(page)
  const modal = page.getByRole('dialog')
  await expect(modal.getByLabel('E-mail', { exact: true })).toBeFocused()
  await modal.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(modal).toBeVisible()
  await expect(modal.getByLabel('E-mail', { exact: true })).toBeFocused()
  for (let index = 0; index < 16; index++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(modal).toHaveCount(0)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})

test('expiração com perfil aberto protege dados e preserva contexto', async ({ page }) => {
  await scenario(page, 'session-expired')
  await openLogin(page)
  await credentials(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  if (page.viewportSize()!.width < 768)
    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click()
  await page.getByRole('link', { name: 'Conta de Gabriel Sales' }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(page.getByRole('dialog')).toContainText('Sua sessão expirou')
  await scenario(page, 'default')
  await credentials(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
