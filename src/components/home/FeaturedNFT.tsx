import { useNFT } from '../../lib/useCatalog'
export function FeaturedNFT({ onSelect }: { onSelect: () => void }) {
  const query = useNFT('sage')
  return (
    <section
      className="relative h-[470px] overflow-hidden bg-gradient-to-b from-catalog-primary/10 to-catalog-primary/3 pt-6"
      aria-label="NFT em destaque"
    >
      <h2 className="px-5 text-[24px] font-bold leading-8 text-catalog-accent">NFT EM DESTAQUE</h2>
      <p className="mt-4 text-center text-[22px] font-bold leading-4">OFERTA LIMITADA</p>
      <button
        type="button"
        disabled={!query.data}
        onClick={onSelect}
        aria-label="Ver NFT em destaque"
        className="mt-4 block"
      >
        <img
          src={query.data?.image}
          alt={query.data?.name ?? 'NFT em destaque'}
          className="h-[368px] w-[310px] rounded-[15px] object-cover"
        />
      </button>
      <span
        className="absolute left-[16px] top-[299px] size-[22px] rounded-md border border-catalog-primary/20"
        aria-hidden="true"
      />
      <span
        className="absolute left-[248px] top-[343px] size-[45px] rounded-md border border-catalog-primary/20"
        aria-hidden="true"
      />
      <span
        className="absolute left-[38px] top-[105px] size-[15px] rounded-full bg-catalog-primary/10"
        aria-hidden="true"
      />
    </section>
  )
}
