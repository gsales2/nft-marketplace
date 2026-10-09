import { NFTPrice } from './NFTPrice'
import { SvgArtwork } from '../ui/SvgArtwork'
import favoriteEven from '../../../public/images/mobile/imgFrame410.svg?raw'
import favoriteOdd from '../../../public/images/mobile/imgGroup58.svg?raw'
import type { CSSProperties } from 'react'

import type { NFT } from '../../lib/nftPresentation'
export type { NFT } from '../../lib/nftPresentation'

export function NFTCard({
  nft,
  index,
  onSelect,
  favorite,
  onToggleFavorite,
}: {
  nft: NFT
  index: number
  onSelect: (nft: NFT) => void
  favorite: boolean
  onToggleFavorite: (id: string) => void
}) {
  return (
    <article
      className={`relative min-w-0 ${index % 2 ? 'translate-y-8 md:translate-y-0' : ''} xl:w-[258px]`}
      aria-label={nft.name ?? 'Obra digital'}
      data-price={nft.price}
    >
      <button
        type="button"
        onClick={() => onSelect(nft)}
        aria-label={`Ver detalhes de ${nft.name ?? 'Obra digital'}`}
        className="relative block h-[200px] w-full rounded-[20px] bg-gradient-to-br from-surface to-[#2f1d15] min-[440px]:aspect-[175/200] min-[440px]:h-auto md:aspect-[258/300] md:rounded-none xl:h-[300px] xl:bg-none xl:bg-surface"
      >
        <img
          src={nft.image}
          alt={nft.name ?? 'Macaco dourado com fones verdes'}
          className={`absolute left-[3.5px] aspect-square w-[calc(100%-7px)] rounded-[16px] object-cover md:left-1 md:top-6 md:w-[calc(100%-8px)] xl:top-[var(--artwork-top)] xl:rounded-[15px] ${index % 2 ? 'top-5' : 'top-3'} ${nft.tall ? 'xl:left-[20px] xl:h-[286px] xl:w-[224px]' : 'xl:h-[250px] xl:w-[250px]'}`}
          style={{ '--artwork-top': `${nft.top}px` } as CSSProperties}
        />
      </button>
      <button
        type="button"
        onClick={() => onToggleFavorite(nft.id)}
        aria-label={`${favorite ? 'Remover dos' : 'Adicionar aos'} favoritos: ${nft.name ?? 'Obra digital'}`}
        aria-pressed={favorite}
        className={`absolute right-0 top-1 flex size-11 items-center justify-center rounded-full xl:hidden ${favorite ? 'bg-catalog-primary' : ''}`}
      >
        <SvgArtwork markup={index % 2 ? favoriteOdd : favoriteEven} />
      </button>
      {nft.id === 'neon' && (
        <span className="pointer-events-none absolute left-0 top-4 bg-catalog-primary px-2 py-2 text-[13px] leading-4 text-background md:hidden">
          RARO
        </span>
      )}
      {nft.name && (
        <div
          className={`mt-2 flex flex-col pl-2 md:mt-3 md:gap-[6px] md:pl-0 ${index < 3 ? 'xl:gap-3' : 'xl:gap-[6px]'}`}
        >
          <h3 className="text-[15px] leading-[22px] md:text-[16px] md:leading-[16px]">
            <button
              type="button"
              onClick={() => onSelect(nft)}
              className="text-left hover:text-catalog-accent"
            >
              {nft.name}
            </button>
          </h3>
          <NFTPrice
            price={nft.price}
            previousPrice={nft.previousPrice}
            displayPrice={nft.displayPrice}
            displayPreviousPrice={nft.displayPreviousPrice}
          />
        </div>
      )}
    </article>
  )
}
