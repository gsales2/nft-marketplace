export interface CartLine {
  id: string
  nftId: string
  name: string
  image: string
  edition: string
  quantity: number
  maximum: number
  unitPrice: string
  total: string
}
export interface Cart {
  revision: string
  items: CartLine[]
  count: number
  subtotal: string
  discount: string
  networkFee: string
  total: string
  coupon: string | null
}
export interface CartInput {
  nftId: string
  edition: string
  quantity: number
}
// ETH amounts use 18 decimal places internally. No floating-point arithmetic.
export const ethUnits = (value: string) => {
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'))
}
export const ethString = (value: bigint) => {
  const fraction = (value % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '')
  return `${value / 10n ** 18n}.${fraction.padEnd(2, '0')}`
}
