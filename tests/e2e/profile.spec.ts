import { test, expect } from '@playwright/test'
test('perfil salva dados e avatar, valida senha e mantém contas isoladas', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('/profile')
  const login = page.getByRole('dialog')
  await login.getByLabel('E-mail', { exact: true }).fill('gabriel@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.locator('input[name=name]').fill('Gabriel Atualizado')
  await page.locator('input[name=username]').fill('gabriel_coletor')
  await page.locator('input[name=walletNickname]').fill('Principal')
  await page.getByLabel('Nome ENS', { exact: true }).fill('gabriel.kurio.eth')
  await page
    .getByLabel('Imagem do avatar')
    .setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKbkAAAAASUVORK5CYII=',
        'base64',
      ),
    })
  await expect(page.getByAltText('Avatar do perfil')).toBeVisible()
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Perfil salvo com sucesso')
  await page.reload()
  await expect(page.locator('input[name=name]')).toHaveValue('Gabriel Atualizado')
  await expect(page.getByAltText('Avatar do perfil')).toBeVisible()
  await page.getByRole('button', { name: 'Remover', exact: true }).click()
  await page.locator('input[name=currentPassword]').fill('Incorreta123!')
  await page.locator('input[name=newPassword]').fill('NovaSenha123!')
  await page.locator('input[name=confirmation]').fill('NovaSenha123!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Senha atual incorreta')
  await page.locator('input[name=currentPassword]').fill('Kurio123!')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Perfil salvo com sucesso')
  await page.reload()
  await expect(page.getByAltText('Avatar do perfil')).toHaveCount(0)
  await expect(page.locator('input[name=username]')).toHaveValue('gabriel_coletor')
  await page.screenshot({
    path: `test-results/profile-${page.viewportSize()!.width}.png`,
    fullPage: true,
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Sair', exact: true }).last().click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
  await page.goto('/profile')
  await login.getByLabel('E-mail', { exact: true }).fill('gabriel@kurio.test')
  await login.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(login.getByRole('alert')).toContainText('E-mail ou senha incorretos')
  await login.getByLabel('Senha', { exact: true }).fill('NovaSenha123!')
  await login.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.locator('input[name=username]')).toHaveValue('gabriel_coletor')
  const stored = await page.evaluate(() => localStorage.getItem('kurio-mock-database-v1')!)
  expect(stored).not.toContain('NovaSenha123!')
  const other = await page.evaluate(async () => {
    const session = await (
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nova@kurio.test', password: 'Kurio123!' }),
      })
    ).json()
    return (
      await fetch('/api/profile', { headers: { Authorization: `Bearer ${session.token}` } })
    ).json()
  })
  expect(other.name).toBe('Nova Sato')
  expect(other.username).toBe('')
})
