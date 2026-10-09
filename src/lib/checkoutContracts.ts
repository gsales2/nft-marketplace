import type { Cart } from './cartContracts'
import type { Wallet } from './walletContracts'

export interface CollectorDetails {
  displayName: string
  username: string
  email: string
  profileName: string
  referralCode: string
  notes: string
}

export interface QuoteResponse {
  cart: Cart
  wallet: Wallet
}
export interface OrderInput {
  walletId: string
  expectedTotal: string
  expectedRevision: string
  collector?: CollectorDetails
}
export interface CheckoutAttempt {
  key: string
  input: OrderInput
}

// Explicit field order keeps fingerprints stable across JSON serialization.
export function orderFingerprint(input: OrderInput): string {
  const collector = input.collector
  return JSON.stringify({
    walletId: input.walletId,
    expectedTotal: input.expectedTotal,
    expectedRevision: input.expectedRevision,
    collector: collector
      ? {
          displayName: collector.displayName,
          username: collector.username,
          email: collector.email,
          profileName: collector.profileName,
          referralCode: collector.referralCode,
          notes: collector.notes,
        }
      : null,
  })
}
