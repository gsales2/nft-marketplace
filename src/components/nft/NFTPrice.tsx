export function NFTPrice({
  price,
  previousPrice,
  displayPrice,
  displayPreviousPrice,
}: {
  price: number
  previousPrice?: number
  displayPrice?: string
  displayPreviousPrice?: string
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[16px] leading-[16px] md:text-[18px]">
      <span className="min-w-0 break-all font-bold text-catalog-accent">
        {displayPrice ?? price.toFixed(2)} ETH
      </span>
      {previousPrice && (
        <span className="min-w-0 break-all text-catalog-secondary">
          {displayPreviousPrice ?? previousPrice.toFixed(2)} ETH
        </span>
      )}
    </div>
  )
}
