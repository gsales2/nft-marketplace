import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getApiError, readSessionToken } from '../../lib/api'
import { useWallets } from '../../lib/useWallets'
import type { Wallets } from '../../lib/walletContracts'
import { Button } from '../ui/Button'

export function WalletConnection() {
  const { user, wallets } = useWallets()
  const client = useQueryClient()
  const token = readSessionToken()
  const connected = !!wallets?.selectedId && wallets.connectedId === wallets.selectedId
  const mutation = useMutation({
    mutationFn: async () => {
      if (!token || token !== readSessionToken()) throw new Error('A sessão mudou.')
      return (
        await api.request<Wallets>({
          url: '/wallets/connection',
          method: connected ? 'delete' : 'post',
          data: { id: wallets?.selectedId },
        })
      ).data
    },
    onSuccess: async (data) => {
      if (token !== readSessionToken()) return
      await client.cancelQueries({ queryKey: ['private', user?.id, 'wallets'] })
      if (token !== readSessionToken()) return
      client.setQueryData(['private', user?.id, 'wallets'], data)
      void client.invalidateQueries({ queryKey: ['private', user?.id, 'quote'] })
    },
    retry: false,
  })
  if (!wallets?.selectedId) return null
  return (
    <div className="mt-4 space-y-2 text-sm">
      <p role="status">{connected ? 'Carteira conectada (simulação)' : 'Carteira desconectada'}</p>
      <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending
          ? 'Atualizando conexão…'
          : connected
            ? 'Desconectar carteira'
            : 'Reconectar carteira'}
      </Button>
      {mutation.isError && <p role="alert">{getApiError(mutation.error).message}</p>}
    </div>
  )
}
