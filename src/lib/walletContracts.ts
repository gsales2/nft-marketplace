export const walletTypes = ['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const
export const walletNetworks = ['Ethereum', 'Polygon', 'Solana'] as const
export interface WalletInput {
  name: string
  address: string
  type: (typeof walletTypes)[number]
  network: (typeof walletNetworks)[number]
  ens: string
  secondaryAddress: string
  displayName?: string
  profileName?: string
  referralCode?: string
  email?: string
}
export interface Wallet extends WalletInput {
  id: string
}
export interface Wallets {
  items: Wallet[]
  selectedId: string | null
  connectedId: string | null
}
