import { NFTCard, type NFT } from './NFTCard'

export function NFTGrid({
  items,
  onSelect,
  favorites,
  onToggleFavorite,
}: {
  items: NFT[]
  onSelect: (nft: NFT) => void
  favorites: string[]
  onToggleFavorite: (id: string) => void
}) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-10 xl:gap-x-[34px] xl:gap-y-[72px]"
      aria-live="polite"
    >
      {items.map((nft, index) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          index={index}
          onSelect={onSelect}
          favorite={favorites.includes(nft.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
      {!items.length && (
        <p className="col-span-full py-12 text-catalog-muted">
          Nenhum NFT encontrado com os filtros selecionados.
        </p>
      )}
    </div>
  )
}
