import type { Cart } from './cartContracts'
import type { Wallet } from './walletContracts'
import type { CollectorDetails } from './checkoutContracts'

export interface Order {
  id: string
  userId: string
  key: string
  requestFingerprint?: string
  status: 'pending' | 'confirmed' | 'refused'
  version: number
  settleAt?: number | null
  resolution?: 'confirmed' | 'refused'
  transactionId: string
  createdAt: string
  wallet: Wallet
  cart: Cart
  collector?: CollectorDetails
}
