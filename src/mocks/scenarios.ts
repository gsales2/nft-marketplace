export const defaultLatency = 180

export const mockScenarios = [
  'default',
  'slow',
  'network-error',
  'server-error',
  'session-expired',
  'registration-conflict',
  'favorite-error',
  'empty-catalog',
  'out-of-order',
  'pending-order',
  'payment-refused',
  'wallet-refused',
  'wallet-disconnected',
  'price-changed',
  'edition-sold-out',
  'timeout-after-order',
  'coupon-expired',
] as const

export function currentScenario() {
  return (
    localStorage.getItem('kurio-mock-scenario') ?? import.meta.env.VITE_MOCK_SCENARIO ?? 'default'
  )
}
