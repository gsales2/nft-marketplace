import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/checkout')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail', { exact: true }).fill('gabriel@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
}
async function connect(page: Page, name: string, address: string) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome da carteira', { exact: true }).fill(name)
  await dialog.getByLabel('Endereço da carteira', { exact: true }).fill(address)
  await dialog.getByLabel('Nome ENS (opcional)').fill(`${name.toLowerCase()}.kurio.eth`)
  await dialog.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
}
test('proteção da rota, conexão, validação, seleção e persistência', async ({ page }) => {
  await login(page)
  await expect(page.getByText('Nenhuma carteira selecionada')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
  await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
  await connect(page, 'Principal', 'inválido')
  await expect(page.getByRole('alert')).toContainText('Endereço da carteira inválido')
  await connect(page, 'Principal', `0x${'a'.repeat(40)}`)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('radio', { name: 'Selecionar Principal' })).toBeChecked()
  await page.getByRole('button', { name: 'Trocar carteira' }).click()
  await page.getByRole('dialog').getByLabel('Rede', { exact: true }).selectOption('Polygon')
  await connect(page, 'Reserva', `0x${'b'.repeat(40)}`)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('radio', { name: 'Selecionar Reserva' })).toBeChecked()
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Selecionar Reserva' })).toBeChecked()
  await page.getByRole('radio', { name: 'Selecionar Principal' }).click()
  await expect(page.getByRole('radio', { name: 'Selecionar Principal' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Selecionar Reserva' })).toBeEnabled()
  await page.getByRole('radio', { name: 'MetaMask', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'MetaMask', exact: true })).toBeChecked()
  await page.getByLabel('Rede da carteira').selectOption('Polygon')
  await expect(page.getByLabel('Rede da carteira')).toHaveValue('Polygon')
  await expect(page.getByLabel('Rede da carteira')).toBeEnabled()
  await page.reload()
  await expect(page.getByRole('radio', { name: 'MetaMask', exact: true })).toBeChecked()
  await expect(page.getByLabel('Rede da carteira')).toHaveValue('Polygon')
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(page).toHaveURL(/\/cart$/)
})

test('erro na API mantém carteira anterior e dados privados não são expostos ao sair', async ({
  page,
}) => {
  await login(page)
  await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
  await connect(page, 'Principal', `0x${'a'.repeat(40)}`)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.evaluate(() =>
    fetch('/api/mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'server-error' }),
    }),
  )
  await page.getByRole('radio', { name: 'MetaMask', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível atualizar as carteiras')
  await expect(page.getByRole('radio', { name: 'Coinbase Wallet', exact: true })).toBeChecked()
  await page.evaluate(async () => {
    await fetch('/api/mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'default' }),
    })
    await fetch('/api/session/expire', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('kurio-session-token')}` },
    })
  })
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
  await expect(page.getByText('principal.kurio.eth')).toHaveCount(0)
})
