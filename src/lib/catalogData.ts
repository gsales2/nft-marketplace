import type { NFT } from './nftPresentation.ts'

export const collections = [
  ['Arte digital', 33],
  ['Fotografia', 12],
  ['Música', 65],
  ['Arte 3D', 39],
  ['Colecionáveis', 23],
  ['Generativa', 17],
  ['Jogos', 19],
  ['Assinaturas', 13],
  ['Utilidade', 18],
] as const
export const networks = ['Ethereum', 'Polygon', 'Solana'] as const
const image = (name: string) => `/images/nfts/${name}.webp`
const originals: NFT[] = [
  { id: 'emerald', name: 'Emerald Ape #042', price: 1.19, image: image('EmeraldApe'), top: 31 },
  { id: 'sage', name: 'Sage Nomad #009', price: 1.69, image: image('SageNomad'), top: 25 },
  {
    id: 'neon',
    name: 'Neon Vessel #552',
    price: 1.99,
    previousPrice: 2.29,
    image: image('NeonVessel'),
    top: 24,
  },
  {
    id: 'cosmic',
    name: 'Cosmic Bloom #118',
    price: 1.29,
    image: image('SageNomad'),
    top: 6,
    tall: true,
  },
  { id: 'violet', name: 'Violet Nomad #314', price: 1.39, image: image('SageNomad'), top: 24 },
  { id: 'ivory', name: 'Ivory Baron #088', price: 1.79, image: image('NeonVessel'), top: 24 },
  { id: 'beat', name: 'Golden Beat #207', price: 0.99, image: image('GoldenSignal'), top: 20 },
  { id: 'untitled', price: 0.39, image: image('GoldenSignal'), top: 28 },
  { id: 'signal', name: 'Golden Signal #160', price: 0.39, image: image('GoldenSignal'), top: 20 },
]

export const catalogItems = collections.flatMap(([collection, count], categoryIndex) =>
  Array.from({ length: count }, (_, index) => {
    const source = originals[index % originals.length]
    const original = categoryIndex === 0 && index < originals.length
    return {
      ...source,
      id: original ? source.id : `demo-${categoryIndex}-${index}`,
      name: original
        ? source.name
        : `${(source.name ?? 'Golden Signal').split(' #')[0]} #${String(600 + categoryIndex * 70 + index).padStart(3, '0')}`,
      price: original ? source.price : Number((0.1 + (index % 25) * 0.15).toFixed(2)),
      previousPrice: original ? source.previousPrice : undefined,
      top: original ? source.top : 24,
      tall: original ? source.tall : false,
      collection,
      network: networks[index % networks.length],
      recent: index % 2 === 0,
      popularity: (index * 17 + 31) % 100,
    }
  }),
)

export type CatalogNFT = (typeof catalogItems)[number]
export interface HomeMessage {
  title: string
  body: string
  image?: string
}
