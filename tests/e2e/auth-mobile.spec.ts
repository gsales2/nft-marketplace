import { test, expect } from '@playwright/test'
test('login e cadastro ocupam a tela mobile e permitem alternar', async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 })
  await page.goto('/login')
  const screen = page.getByRole('dialog')
  await expect(screen).toBeVisible()
  expect(await screen.boundingBox()).toEqual({ x: 0, y: 0, width: 414, height: 896 })
  await screen.getByLabel('E-mail', { exact: true }).blur()
  await page.screenshot({ path: 'test-results/login-mobile.png' })
  await screen.getByRole('button', { name: 'Novo na Kurio? Crie uma conta', exact: true }).click()
  await expect(screen.getByRole('button', { name: 'Criar perfil', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/register-mobile.png' })
  await screen.getByLabel('Confirmar senha', { exact: true }).fill('Kurio123!')
  await screen.getByRole('button', { name: 'Mostrar confirmação da senha' }).click()
  await expect(screen.getByLabel('Confirmar senha', { exact: true })).toHaveAttribute('type', 'text')
  await screen.getByRole('button', { name: 'Já tem uma conta? Entre', exact: true }).click()
  await expect(screen.getByLabel('Nome', { exact: true })).toHaveCount(0)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 600 })
    expect(await screen.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  }
})
