import { test, expect } from '@playwright/test'

const routes = [
  { path: '/cart', text: 'Seu carrinho está vazio.' },
  { path: '/login', text: 'Entrar na Kurio' },
  { path: '/profile', text: 'Entrar na Kurio' },
  { path: '/checkout', text: 'Entrar na Kurio' },
  { path: '/nft/nao-existe', text: 'NFT não encontrado' },
  { path: '/rota-inexistente', text: 'Página não encontrada' },
] as const

for (const route of routes) {
  test(`acesso direto e refresh de ${route.path} sem erros de renderização`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto(route.path)
    await expect(page.getByText(route.text, { exact: true })).toBeVisible()
    await expect(page.locator('[data-realtime-state]')).toHaveAttribute(
      'data-realtime-state',
      'connected',
    )
    expect(errors).toEqual([])

    await page.reload()
    await expect(page.getByText(route.text, { exact: true })).toBeVisible()
    await expect(page.locator('[data-realtime-state]')).toHaveAttribute(
      'data-realtime-state',
      'connected',
    )
    expect(errors).toEqual([])
  })
}
