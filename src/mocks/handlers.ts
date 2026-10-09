import { defaultLatency } from './scenarios'
import { quoteHandlers } from './checkout'
import { mockScenarios as scenarios } from './scenarios'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { orderHandlers } from './orders'
import { http, HttpResponse, delay } from 'msw'
import { hashPassword, publicUser, transaction, databaseKey } from './database'
import type { ApiError, AuthResponse, LoginRequest, RegisterRequest } from '../lib/authContracts'
import { catalogItems } from '../lib/catalogData'
import { cartHandlers, mergeGuestCart } from './cart'
import { walletHandlers, walletConnectionHandlers } from './wallets'

const scenario = () =>
  localStorage.getItem('kurio-mock-scenario') ?? import.meta.env.VITE_MOCK_SCENARIO ?? 'default'
const error = (status: number, code: string, message: string, fields?: ApiError['fields']) =>
  HttpResponse.json<ApiError>({ code, message, fields }, { status })
const bearer = (request: Request) =>
  request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
const sessionError = () =>
  error(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
async function network() {
  await delay(scenario() === 'slow' ? 1500 : defaultLatency)
  if (scenario() === 'network-error') return HttpResponse.error()
  if (scenario() === 'server-error')
    return error(
      503,
      'SERVICE_UNAVAILABLE',
      'Serviço temporariamente indisponível. Tente novamente.',
    )
}
const fieldsFor = (body: Partial<RegisterRequest>, register = false) => {
  const fields: NonNullable<ApiError['fields']> = {}
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    fields.email = 'Informe um e-mail válido.'
  if (!body.password || body.password.length < (register ? 8 : 1))
    fields.password = register ? 'Use pelo menos 8 caracteres.' : 'Informe sua senha.'
  if (register && (!body.name || body.name.trim().length < 2))
    fields.name = 'Informe um nome com pelo menos 2 caracteres.'
  if (register && body.confirmation !== body.password)
    fields.confirmation = 'As senhas devem ser iguais.'
  return fields
}

export const handlers = [
  ...quoteHandlers,
  ...walletConnectionHandlers,
  ...nftHandlers,
  ...profileHandlers,
  ...orderHandlers,
  ...cartHandlers,
  ...walletHandlers,
  http.get('/api/session', async ({ request }) => {
    const failure = await network()
    if (failure) return failure
    return transaction((db) => {
      const token = bearer(request)
      if (!token) return HttpResponse.json({ session: null })
      const stored = db.sessions.find((item) => item.token === token && item.expiresAt > Date.now())
      const user = db.users.find((item) => item.id === stored?.userId)
      if (!stored || !user) return sessionError()
      return HttpResponse.json({ session: { user: publicUser(user), expiresAt: stored.expiresAt } })
    })
  }),
  http.post('/api/session', async ({ request }) => {
    const failure = await network()
    if (failure) return failure
    const body = (await request.json()) as LoginRequest
    const fields = fieldsFor(body)
    if (Object.keys(fields).length)
      return error(422, 'VALIDATION_ERROR', 'Verifique os campos informados.', fields)
    return transaction(async (db) => {
      const user = db.users.find((item) => item.email === body.email.trim().toLowerCase())
      if (!user || (await hashPassword(body.password, user.salt)) !== user.passwordHash)
        return error(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
      const token = crypto.randomUUID()
      const expiresAt = Date.now() + (scenario() === 'session-expired' ? 3000 : 30 * 60_000)
      db.sessions = db.sessions.filter(
        (item) => item.expiresAt > Date.now() && item.token !== bearer(request),
      )
      db.sessions.push({ token, userId: user.id, expiresAt })
      mergeGuestCart(db, request, user.id)
      return HttpResponse.json<AuthResponse>({
        token,
        session: { user: publicUser(user), expiresAt },
      })
    })
  }),
  http.post('/api/accounts', async ({ request }) => {
    const failure = await network()
    if (failure) return failure
    const body = (await request.json()) as RegisterRequest
    const fields = fieldsFor(body, true)
    if (Object.keys(fields).length)
      return error(422, 'VALIDATION_ERROR', 'Verifique os campos informados.', fields)
    return transaction(async (db) => {
      const email = body.email.trim().toLowerCase()
      if (scenario() === 'registration-conflict' || db.users.some((user) => user.email === email))
        return error(409, 'EMAIL_CONFLICT', 'Já existe uma conta com este e-mail.', {
          email: 'Este e-mail já está cadastrado.',
        })
      const salt = crypto.randomUUID()
      const user = {
        id: crypto.randomUUID(),
        name: body.name.trim(),
        email,
        salt,
        passwordHash: await hashPassword(body.password, salt),
        favorites: [],
      }
      db.users.push(user)
      const token = crypto.randomUUID(),
        expiresAt = Date.now() + 30 * 60_000
      db.sessions = db.sessions.filter(
        (item) => item.expiresAt > Date.now() && item.token !== bearer(request),
      )
      db.sessions.push({ token, userId: user.id, expiresAt })
      mergeGuestCart(db, request, user.id)
      return HttpResponse.json<AuthResponse>(
        { token, session: { user: publicUser(user), expiresAt } },
        { status: 201 },
      )
    })
  }),
  http.delete('/api/session', async ({ request }) => {
    const failure = await network()
    if (failure) return failure
    return transaction((db) => {
      db.sessions = db.sessions.filter((item) => item.token !== bearer(request))
      return new HttpResponse(null, { status: 204 })
    })
  }),
  http.post('/api/session/expire', async ({ request }) =>
    transaction((db) => {
      const stored = db.sessions.find((item) => item.token === bearer(request))
      if (!stored) return sessionError()
      stored.expiresAt = 0
      return new HttpResponse(null, { status: 204 })
    }),
  ),
  http.get('/api/favorites', async ({ request }) => {
    const failure = await network()
    if (failure) return failure
    return transaction((db) => {
      const session = db.sessions.find(
        (item) => item.token === bearer(request) && item.expiresAt > Date.now(),
      )
      const user = db.users.find((item) => item.id === session?.userId)
      return user ? HttpResponse.json({ ids: user.favorites }) : sessionError()
    })
  }),
  ...(['post', 'delete'] as const).map((method) =>
    http[method]('/api/favorites/:nftId', async ({ request, params }) => {
      const failure = await network()
      if (failure) return failure
      return transaction((db) => {
        const session = db.sessions.find(
          (item) => item.token === bearer(request) && item.expiresAt > Date.now(),
        )
        const user = db.users.find((item) => item.id === session?.userId)
        if (!user) return sessionError()
        if (scenario() === 'favorite-error')
          return error(
            503,
            'SERVICE_UNAVAILABLE',
            'Não foi possível atualizar os favoritos. Tente novamente.',
          )
        const id = String(params.nftId)
        if (!catalogItems.some((item) => item.id === id))
          return error(404, 'NOT_FOUND', 'NFT não encontrado.')
        user.favorites =
          method === 'post'
            ? [...new Set([...user.favorites, id])]
            : user.favorites.filter((value) => value !== id)
        return HttpResponse.json({ ids: user.favorites })
      })
    }),
  ),
  http.post('/api/mock/reset', async () => {
    await transaction(() => undefined)
    localStorage.removeItem(databaseKey)
    localStorage.removeItem('kurio-session-token')
    localStorage.removeItem('kurio-mock-scenario')
    for (const key of Object.keys(localStorage))
      if (key.startsWith('kurio-checkout-attempt:')) localStorage.removeItem(key)
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith('kurio-quote-review:')) sessionStorage.removeItem(key)
    return new HttpResponse(null, { status: 204 })
  }),
  http.put('/api/mock/scenario', async ({ request }) => {
    const body = (await request.json()) as { scenario: string }
    if (!(scenarios as readonly string[]).includes(body.scenario))
      return error(422, 'VALIDATION_ERROR', 'Cenário desconhecido.')
    localStorage.setItem('kurio-mock-scenario', body.scenario)
    return HttpResponse.json({ scenario: body.scenario })
  }),
]
