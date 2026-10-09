import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useCart } from '../../lib/useCart'

export function CartCount() {
  const { cart } = useCart()
  return cart?.count ? (
    <span
      aria-label={`${cart.count} itens no carrinho`}
      className="absolute -right-2 -top-3 flex min-w-4 items-center justify-center rounded-full bg-catalog-primary px-1 text-[10px] font-bold leading-4 text-background"
    >
      {cart.count}
    </span>
  ) : null
}
export function CartFeedback() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const added = () => {
      clearTimeout(timer)
      setMessage('NFT adicionado ao carrinho!')
      timer = setTimeout(() => setMessage(''), 5000)
    }
    const clear = () => {
      clearTimeout(timer)
      setMessage('')
    }
    window.addEventListener('kurio:cart-added', added)
    window.addEventListener('kurio:session-changed', clear)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('kurio:cart-added', added)
      window.removeEventListener('kurio:session-changed', clear)
    }
  }, [])
  return message ? (
    <aside
      role="status"
      className="fixed right-4 top-4 z-[80] max-w-[calc(100vw-32px)] rounded-lg border border-catalog-primary bg-surface p-5 shadow-xl md:right-8 md:top-20"
    >
      <button
        onClick={() => setMessage('')}
        aria-label="Fechar confirmação"
        className="float-right ml-5"
      >
        ×
      </button>
      <p className="text-sm">{message}</p>
      <Link to="/cart" className="mt-3 inline-block text-sm text-catalog-accent underline">
        Ver carrinho
      </Link>
    </aside>
  ) : null
}
