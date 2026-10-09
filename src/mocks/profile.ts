import { defaultLatency } from './scenarios'
import { http, HttpResponse, delay } from 'msw'
import { hashPassword, transaction } from './database'
import type { ProfileUpdate, Profile } from '../lib/profileContracts'
const fail = (message: string, status = 422, code = 'PROFILE_ERROR', fields?: string[]) =>
  HttpResponse.json(
    {
      code,
      message,
      fields: fields ? Object.fromEntries(fields.map((field) => [field, message])) : undefined,
    },
    { status },
  )
export const profileHandlers = (['get', 'patch'] as const).map((method) =>
  http[method]('/api/profile', async ({ request }) => {
    const scenario =
      localStorage.getItem('kurio-mock-scenario') ?? import.meta.env.VITE_MOCK_SCENARIO
    await delay(scenario === 'slow' ? 1500 : defaultLatency)
    if (scenario === 'network-error') return HttpResponse.error()
    if (scenario === 'server-error')
      return fail('Não foi possível salvar o perfil. Tente novamente.', 503)
    const body = method === 'patch' ? ((await request.json()) as ProfileUpdate) : null
    return transaction(async (db) => {
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
      const session = db.sessions.find(
        (item) => item.token === token && item.expiresAt > Date.now(),
      )
      const user = db.users.find((item) => item.id === session?.userId)
      if (!user) return fail('Sua sessão expirou. Entre novamente.', 401, 'SESSION_EXPIRED')
      if (body) {
        if (
          typeof body.name !== 'string' ||
          body.name.trim().length < 2 ||
          body.name.length > 80 ||
          typeof body.email !== 'string' ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
        )
          return fail('Informe um nome e e-mail válidos.', 422, 'PROFILE_ERROR', ['name', 'email'])
        if (typeof body.username !== 'string' || !/^[a-zA-Z0-9_.-]{3,30}$/.test(body.username))
          return fail(
            'Nome de usuário: use de 3 a 30 letras, números, ponto, hífen ou sublinhado.',
            422,
            'PROFILE_ERROR',
            ['username'],
          )
        if (
          typeof body.ens !== 'string' ||
          (body.ens && !/^[a-z0-9][a-z0-9.-]*\.eth$/i.test(body.ens))
        )
          return fail(
            'Informe um ENS válido terminado em .eth ou deixe vazio.',
            422,
            'PROFILE_ERROR',
            ['ens'],
          )
        if (
          typeof body.walletNickname !== 'string' ||
          !body.walletNickname.trim() ||
          body.walletNickname.length > 60
        )
          return fail(
            'Informe um apelido de carteira de até 60 caracteres.',
            422,
            'PROFILE_ERROR',
            ['walletNickname'],
          )
        if (
          typeof body.avatar !== 'string' ||
          (body.avatar &&
            (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(body.avatar) ||
              body.avatar.length > 700000))
        )
          return fail('Use uma imagem PNG, JPEG ou WebP de até 500 KB.', 422, 'PROFILE_ERROR', [
            'avatar',
          ])
        const email = body.email.trim().toLowerCase()
        if (
          db.users.some(
            (item) =>
              item.id !== user.id &&
              (item.email === email ||
                item.username?.toLowerCase() === body.username.toLowerCase()),
          )
        )
          return fail('Este e-mail ou nome de usuário já está em uso.', 409, 'PROFILE_ERROR', [
            'email',
            'username',
          ])
        if (body.currentPassword || body.newPassword || body.confirmation) {
          if (
            !body.currentPassword ||
            (await hashPassword(body.currentPassword, user.salt)) !== user.passwordHash
          )
            return fail('Senha atual incorreta.', 422, 'PROFILE_ERROR', ['currentPassword'])
          if (
            typeof body.newPassword !== 'string' ||
            body.newPassword.length < 8 ||
            body.newPassword.length > 128 ||
            body.confirmation !== body.newPassword
          )
            return fail(
              'Use uma nova senha de 8 a 128 caracteres e confirme a mesma senha.',
              422,
              'PROFILE_ERROR',
              ['newPassword', 'confirmation'],
            )
          const salt = crypto.randomUUID()
          const passwordHash = await hashPassword(body.newPassword, salt)
          user.salt = salt
          user.passwordHash = passwordHash
          db.sessions = db.sessions.filter(
            (item) => item.userId !== user.id || item.token === token,
          )
        }
        Object.assign(user, {
          name: body.name.trim(),
          email,
          username: body.username.trim(),
          ens: body.ens.trim(),
          walletNickname: body.walletNickname.trim(),
          avatar: body.avatar,
        })
      }
      return HttpResponse.json<Profile>({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username ?? '',
        ens: user.ens ?? '',
        walletNickname: user.walletNickname ?? '',
        avatar: user.avatar ?? '',
      })
    })
  }),
)
