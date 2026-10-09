export interface NFT {
  id: string
  name?: string
  price: number
  displayPrice?: string
  displayPreviousPrice?: string
  previousPrice?: number
  image: string
  top: number
  tall?: boolean
}
