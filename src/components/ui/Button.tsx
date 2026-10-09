import type { ComponentProps } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[5px] text-[14px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-catalog-accent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-catalog-primary text-background hover:brightness-110',
        outline:
          'border border-catalog-border bg-transparent text-catalog-muted hover:border-catalog-primary',
        ghost: 'bg-transparent hover:bg-surface text-catalog-accent',
      },
      size: { default: 'h-10 px-4', lg: 'h-[45px] px-4 text-[16px] font-bold', icon: 'size-10' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
