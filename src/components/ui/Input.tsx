import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-[5px] border border-catalog-border bg-transparent px-4 text-[14px] leading-4 outline-none placeholder:text-catalog-secondary selection:bg-catalog-primary selection:text-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-catalog-primary focus-visible:ring-1 focus-visible:ring-catalog-primary aria-invalid:border-[#f0805f]',
        className,
      )}
      {...props}
    />
  )
}
