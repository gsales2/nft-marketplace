import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-skeleton
      className={cn('skeleton rounded-md bg-surface', className)}
    />
  )
}

export function CartItemsSkeleton({ table = false }: { table?: boolean }) {
  return (
    <div
      role={table ? 'rowgroup' : 'status'}
      aria-label="Carregando carrinho"
      className="mt-3 space-y-3"
    >
      {!table && <span className="sr-only">Carregando carrinho…</span>}
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          role={table ? 'row' : undefined}
          className="flex h-[100px] items-center gap-4 md:h-[70px]"
        >
          <div role={table ? 'cell' : undefined} className="w-full">
            <Skeleton className="h-[100px] w-full rounded-xl md:h-[70px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CartSummarySkeleton() {
  return (
    <div role="status" aria-label="Carregando resumo" className="mt-6 space-y-3">
      <span className="sr-only">Carregando resumo do carrinho…</span>
      {[1, 2, 3, 4].map((item) => (
        <Skeleton key={item} className="h-6 w-full bg-catalog-border/60" />
      ))}
    </div>
  )
}
