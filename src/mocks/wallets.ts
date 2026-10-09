import { defaultLatency } from './scenarios'
import { http, HttpResponse, delay } from 'msw'
import { transaction } from './database'
import { walletTypes, walletNetworks, type WalletInput } from '../lib/walletContracts'
import { currentScenario } from './scenarios'

const fail = (message: string, status = 422, code = 'WALLET_ERROR', fields?: string[]) =>
  HttpResponse.json(
    {
      code,
      message,
      fields: fields ? Object.fromEntries(fields.map((field) => [field, message])) : undefined,
    },
    { status },
  )
export const walletHandlers = (['get', 'post', 'patch'] as const).map((method) =>
  http[method]('/api/wallets', async ({ request }) => {
    const scenario =
      localStorage.getItem('kurio-mock-scenario') ?? import.meta.env.VITE_MOCK_SCENARIO
    await delay(scenario === 'slow' ? 1500 : defaultLatency)
    if (scenario === 'network-error') return HttpResponse.error()
    if (scenario === 'server-error')
      return fail('Não foi possível atualizar as carteiras. Tente novamente.', 503)
    const body =
      method === 'get'
        ? {}
        : ((await request.json()) as Partial<WalletInput> & { id?: string; selectOnly?: boolean })
    return transaction((db) => {
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
      const session = db.sessions.find(
        (value) => value.token === token && value.expiresAt > Date.now(),
      )
      if (!session) return fail('Sua sessão expirou. Entre novamente.', 401, 'SESSION_EXPIRED')
      if (method !== 'get' && scenario === 'wallet-refused')
        return fail(
          'Conexão recusada na carteira simulada. Tente novamente.',
          409,
          'WALLET_REFUSED',
        )
      if (method !== 'get' && scenario === 'wallet-disconnected')
        return fail('A carteira foi desconectada. Conecte novamente.', 409, 'WALLET_DISCONNECTED')
      const wallets = (db.wallets[session.userId] ??= {
        items: [],
        selectedId: null,
        connectedId: null,
      })
      if (method === 'patch' && body.selectOnly) {
        if (!wallets.items.some((wallet) => wallet.id === body.id))
          return fail('Carteira não encontrada.', 404)
        wallets.selectedId = body.id!
        wallets.connectedId = body.id!
      } else if (method !== 'get') {
        if (
          !body.name?.trim() ||
          body.name.trim().length > 60 ||
          !walletTypes.includes(body.type!) ||
          !walletNetworks.includes(body.network!)
        )
          return fail(
            'Informe nome (até 60 caracteres), tipo e rede da carteira.',
            422,
            'WALLET_ERROR',
            ['name', 'network', 'type'],
          )
        const validAddress = (value: string) =>
          body.network === 'Solana'
            ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
            : /^0x[0-9a-fA-F]{40}$/.test(value)
        if (!body.address || !validAddress(body.address.trim()))
          return fail(
            'Endereço da carteira inválido para a rede selecionada.',
            422,
            'WALLET_ERROR',
            ['address'],
          )
        if (body.secondaryAddress?.trim() && !validAddress(body.secondaryAddress.trim()))
          return fail('Endereço da carteira secundária inválido.', 422, 'WALLET_ERROR', [
            'secondaryAddress',
          ])
        if (body.ens?.trim() && !/^[a-z0-9][a-z0-9.-]*\.eth$/i.test(body.ens.trim()))
          return fail('Informe um nome ENS válido terminado em .eth.', 422, 'WALLET_ERROR', ['ens'])
        const previous = wallets.items.find((item) => item.id === body.id)
        const metadata = {
          displayName: body.displayName ?? previous?.displayName ?? '',
          profileName: body.profileName ?? previous?.profileName ?? '',
          referralCode: body.referralCode ?? previous?.referralCode ?? '',
          email: body.email ?? previous?.email ?? '',
        }
        if (
          Object.values(metadata).some(
            (value) => typeof value !== 'string' || value.length > 120,
          ) ||
          (metadata.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(metadata.email))
        )
          return fail('Verifique os dados do perfil e o e-mail da carteira.', 422, 'WALLET_ERROR', [
            'email',
          ])
        const wallet = {
          ...metadata,
          id: method === 'post' ? crypto.randomUUID() : body.id!,
          name: body.name.trim(),
          address: body.address.trim(),
          type: body.type!,
          network: body.network!,
          ens: body.ens?.trim() ?? '',
          secondaryAddress: body.secondaryAddress?.trim() ?? '',
        }
        if (
          wallets.items.some(
            (item) =>
              item.id !== wallet.id &&
              item.network === wallet.network &&
              (wallet.network === 'Solana'
                ? item.address === wallet.address
                : item.address.toLowerCase() === wallet.address.toLowerCase()),
          )
        )
          return fail('Esta carteira já está cadastrada nesta rede.', 409)
        if (method === 'post') wallets.items.push(wallet)
        else {
          const index = wallets.items.findIndex((item) => item.id === wallet.id)
          if (index < 0) return fail('Carteira não encontrada.', 404)
          wallets.items[index] = wallet
        }
        wallets.selectedId = wallet.id
        wallets.connectedId = wallet.id
      }
      return HttpResponse.json(wallets)
    })
  }),
)

export const walletConnectionHandlers = (['post', 'delete'] as const).map((method) =>
  http[method]('/api/wallets/connection', async ({ request }) => {
    const scenario = currentScenario()
    await delay(scenario === 'slow' ? 1500 : defaultLatency)
    if (scenario === 'network-error') return HttpResponse.error()
    if (scenario === 'server-error') return fail('Não foi possível atualizar a conexão.', 503)
    const body = method === 'post' ? ((await request.json()) as { id: string }) : null
    return transaction((db) => {
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
      const session = db.sessions.find(
        (item) => item.token === token && item.expiresAt > Date.now(),
      )
      if (!session) return fail('Sua sessão expirou. Entre novamente.', 401, 'SESSION_EXPIRED')
      const wallets = (db.wallets[session.userId] ??= {
        items: [],
        selectedId: null,
        connectedId: null,
      })
      if (method === 'delete') wallets.connectedId = null
      else {
        if (!wallets.items.some((wallet) => wallet.id === body?.id))
          return fail('Carteira não encontrada.', 404)
        if (scenario === 'wallet-refused')
          return fail('Conexão recusada na carteira simulada.', 409, 'WALLET_REFUSED')
        if (scenario === 'wallet-disconnected')
          return fail('A carteira foi desconectada. Tente novamente.', 409, 'WALLET_DISCONNECTED')
        wallets.connectedId = body!.id
        wallets.selectedId = body!.id
      }
      return HttpResponse.json(wallets)
    })
  }),
)
