import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { readSessionToken, guestCartId } from '../../lib/api'
import { realtimeNoticeEvent } from '../../lib/realtimeContracts'
import { Button } from '../ui/Button'
import { waitForRealtimeNetwork } from '../../lib/networkReady'
export function RealtimeLifecycle() {
  const { user } = useAuth()
  const token = readSessionToken()
  const [notice, setNotice] = useState({ token, message: '', connection: 'connecting' })
  const message = notice.token === token ? notice.message : ''
  const offline = notice.token === token && notice.connection === 'disconnected'
  useEffect(() => {
    let closed = false
    let stop: (() => void) | undefined
    void waitForRealtimeNetwork()
      .then(() => import('../../lib/socket'))
      .then((module) => {
        if (!closed) stop = module.connectRealtime(user?.id)
      })
      .catch(() => {
        if (!closed)
          setNotice({
            token,
            message:
              'Não foi possível iniciar a conexão em tempo real. Recarregue para tentar novamente.',
            connection: 'disconnected',
          })
      })
    const receive = (event: Event) => {
      const detail = (event as CustomEvent).detail
      setNotice((previous) => ({
        token,
        message: detail.message ?? (previous.token === token ? previous.message : ''),
        connection: detail.connection ?? previous.connection,
      }))
      if (
        detail.connection === 'connected' &&
        sessionStorage.getItem(`kurio-quote-review:${token ?? guestCartId()}`)
      )
        setNotice((previous) => ({
          ...previous,
          message: 'Confira os valores atualizados do carrinho antes de comprar.',
        }))
    }
    window.addEventListener(realtimeNoticeEvent, receive)
    return () => {
      closed = true
      stop?.()
      window.removeEventListener(realtimeNoticeEvent, receive)
    }
  }, [user?.id, token])
  return (
    <>
      <span
        className="sr-only"
        data-realtime-state={notice.token === token ? notice.connection : 'connecting'}
      >
        Conexão em tempo real
      </span>
      {offline && (
        <p
          role="status"
          className="fixed left-4 top-4 z-40 max-w-[calc(100%-32px)] rounded border border-catalog-border bg-surface p-3 text-sm"
        >
          Conexão interrompida. Tentando reconectar…
        </p>
      )}
      {message && (
        <aside
          role="alert"
          className="fixed right-4 top-4 z-40 max-w-[min(420px,calc(100%-32px))] rounded border border-catalog-primary bg-surface p-4 text-sm"
        >
          <p>{message}</p>
          <Button
            className="mt-3"
            onClick={() => {
              sessionStorage.removeItem(`kurio-quote-review:${token ?? guestCartId()}`)
              setNotice((previous) => ({ ...previous, message: '' }))
            }}
          >
            Revisei os novos valores
          </Button>
        </aside>
      )}
    </>
  )
}
