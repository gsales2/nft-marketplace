import { useState } from 'react'
import { collections, networks } from '../../lib/catalogData'

const asset = '/images/catalog/'

interface Props {
  collectionCounts?: [string, number][]
  networkCounts?: [string, number][]
  collection: string
  network: string
  onCollection: (value: string) => void
  onNetwork: (value: string) => void
  onPrice: (value: number) => void
  initialMaximum?: number
}

export function CollectionFilters({
  collectionCounts,
  networkCounts,
  collection,
  network,
  onCollection,
  onNetwork,
  onPrice,
  initialMaximum = 12.3,
}: Props) {
  const [maximum, setMaximum] = useState(initialMaximum)
  return (
    <div className="flex min-w-0 flex-col gap-10 bg-surface p-5 xl:h-[785px]">
      <section>
        <h2 className="text-[18px] font-bold leading-4">Coleções</h2>
        <div className="mt-3 px-3">
          {collections.map(([name, count]) => (
            <button
              type="button"
              key={name}
              aria-pressed={collection === name}
              onClick={() => onCollection(name)}
              className={`flex w-full justify-between text-[15px] leading-[40px] ${collection === name ? 'text-catalog-accent' : 'text-catalog-muted'}`}
            >
              <span>{name}</span>
              <span className="font-bold">
                ({collectionCounts?.find(([value]) => value === name)?.[1] ?? count})
              </span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-[18px] font-bold leading-4">Faixa de preço</h2>
        <div className="mt-3 flex flex-col gap-3 pl-3">
          <div className="relative h-[15px] w-[258px] max-w-full">
            <div
              className="absolute left-[15px] right-0 top-[5px] flex overflow-hidden"
              aria-hidden="true"
            >
              <img src={`${asset}imgLine6.svg`} alt="" />
              <img src={`${asset}imgLine5.svg`} alt="" />
            </div>
            <img
              className="absolute -left-[3px] -top-[3px]"
              src={`${asset}imgEllipse5.svg`}
              alt=""
              aria-hidden="true"
            />
            <img
              className="absolute -top-[3px]"
              style={{ left: `calc(12px + (100% - 82px) * ${maximum / 12.3})` }}
              src={`${asset}imgEllipse5.svg`}
              alt=""
              aria-hidden="true"
            />
            <input
              type="range"
              aria-label="Preço máximo em ETH"
              min="0.02"
              max="12.3"
              step="0.01"
              value={maximum}
              onChange={(event) => setMaximum(Number(event.target.value))}
              className="absolute inset-0 h-full w-[191px] max-w-full cursor-pointer opacity-0 focus:opacity-100"
            />
          </div>
          <p className="text-[15px] leading-[23px]">
            Preço: 0,02 - {maximum.toFixed(2).replace('.', ',')} ETH
          </p>
          <button
            type="button"
            onClick={() => onPrice(maximum)}
            className="w-fit rounded-md bg-catalog-primary px-3 py-2 text-[16px] font-bold leading-5 text-background"
          >
            Aplicar
          </button>
        </div>
      </section>
      <section>
        <h2 className="text-[18px] font-bold leading-4">Rede</h2>
        <div className="mt-3 pl-3">
          {networks.map((name) => (
            <button
              type="button"
              key={name}
              aria-pressed={network === name}
              onClick={() => onNetwork(network === name ? '' : name)}
              className={`flex w-full justify-between text-[15px] leading-[40px] ${network === name ? 'text-catalog-accent' : 'text-catalog-muted'}`}
            >
              <span>{name}</span>
              <span>({networkCounts?.find(([value]) => value === name)?.[1] ?? 0})</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
