import { useMemo, useSyncExternalStore } from 'react'
import type { CheckoutAttempt } from './checkoutContracts'

const attemptChanged = 'kurio:checkout-attempt-changed'
const storageKey = (userId: string) => `kurio-checkout-attempt:${userId}`

function parseAttempt(raw: string | null): CheckoutAttempt | null {
  try {
    const value = JSON.parse(raw ?? 'null')
    return value &&
      typeof value.key === 'string' &&
      typeof value.input?.walletId === 'string' &&
      typeof value.input.expectedRevision === 'string' &&
      typeof value.input.expectedTotal === 'string'
      ? value
      : null
  } catch {
    return null
  }
}

export function readCheckoutAttempt(userId: string) {
  return parseAttempt(localStorage.getItem(storageKey(userId)))
}

export function saveCheckoutAttempt(userId: string, attempt: CheckoutAttempt | null) {
  if (attempt) localStorage.setItem(storageKey(userId), JSON.stringify(attempt))
  else localStorage.removeItem(storageKey(userId))
  window.dispatchEvent(new Event(attemptChanged))
}

function subscribe(listener: () => void) {
  window.addEventListener(attemptChanged, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(attemptChanged, listener)
    window.removeEventListener('storage', listener)
  }
}

export function useCheckoutAttempt(userId: string) {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(storageKey(userId)),
    () => null,
  )
  return useMemo(() => parseAttempt(raw), [raw])
}
