import { useEffect, useState } from 'react'
import { useAuth, clearPrivateState, sessionOptions } from '../../lib/auth'
import { queryClient } from '../../lib/queryClient'
import { readSessionToken, sessionExpiredEvent, sessionTokenKey } from '../../lib/api'
import { LoginModal } from '../ui/LoginModal'

export function SessionLifecycle() {
  const { data } = useAuth()
  const [expired, setExpired] = useState(false)
  useEffect(() => {
    const expire = () => {
      if (!readSessionToken()) return
      localStorage.removeItem(sessionTokenKey)
      void queryClient.cancelQueries({ queryKey: ['session'] })
      void clearPrivateState()
      queryClient.setQueryData(sessionOptions.queryKey, { session: null })
      // Checkout has its own protected login/return flow.
      setExpired(
        window.location.pathname !== '/checkout' &&
          !document.querySelector('dialog[data-auth-dialog][open]'),
      )
    }
    const synchronize = (event: StorageEvent) => {
      if (event.key === sessionTokenKey) {
        void clearPrivateState()
        void queryClient
          .cancelQueries({ queryKey: ['session'] })
          .then(() => queryClient.resetQueries({ queryKey: ['session'] }))
      }
    }
    window.addEventListener(sessionExpiredEvent, expire)
    window.addEventListener('storage', synchronize)
    return () => {
      window.removeEventListener(sessionExpiredEvent, expire)
      window.removeEventListener('storage', synchronize)
    }
  }, [])
  useEffect(() => {
    if (!data?.session) return
    const timeout = window.setTimeout(
      () => window.dispatchEvent(new Event(sessionExpiredEvent)),
      Math.max(0, data.session.expiresAt - Date.now()),
    )
    return () => window.clearTimeout(timeout)
  }, [data])
  return expired ? (
    <LoginModal
      notice="Sua sessão expirou. Entre novamente para retomar de onde parou."
      onClose={() => setExpired(false)}
    />
  ) : null
}
