
import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({
  children,
  className = '',
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[1200px] px-6 xl:px-0 ${className}`}
    >
      {children}
    </div>
  )
}
