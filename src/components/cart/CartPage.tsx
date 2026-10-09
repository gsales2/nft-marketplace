import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/useCart'
import { readSessionToken } from '../../lib/api'
import { useMediaQuery } from '../../lib/useMediaQuery'
import type { HomeMessage } from '../../lib/catalogData'
import { MobileCart } from './MobileCart'
import { DesktopCart } from './DesktopCart'
import { LoginModal } from '../ui/LoginModal'
import { HomeDialog } from '../ui/HomeDialog'

export function CartPage() {
  const mobile = useMediaQuery('(max-width: 767px)')
  const cart = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [login, setLogin] = useState(false)
  const [checkoutAfterLogin, setCheckoutAfterLogin] = useState(false)
  const [message, setMessage] = useState<HomeMessage | null>(null)
  const checkout = () => {
    if (!user) {
      setCheckoutAfterLogin(true)
      setLogin(true)
      return
    }
    void navigate({ to: '/checkout' })
  }
  return (
    <>
      {mobile ? (
        <MobileCart {...cart} onCheckout={checkout} />
      ) : (
        <DesktopCart
          {...cart}
          onCheckout={checkout}
          onLogin={() => setLogin(true)}
          onMessage={setMessage}
        />
      )}
      {login && (
        <LoginModal
          onClose={() => {
            setLogin(false)
            if (checkoutAfterLogin && readSessionToken()) void navigate({ to: '/checkout' })
            setCheckoutAfterLogin(false)
          }}
        />
      )}
      {message && (
        <HomeDialog open title={message.title} onClose={() => setMessage(null)}>
          <p>{message.body}</p>
        </HomeDialog>
      )}
    </>
  )
}
