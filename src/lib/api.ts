import axios from 'axios'
import type { ApiError } from './authContracts'
import { waitForNetwork } from './networkReady'

export const sessionTokenKey = 'kurio-session-token'
export const readSessionToken = () => localStorage.getItem(sessionTokenKey)
export function guestCartId() {
  let id = localStorage.getItem('kurio-guest-cart')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('kurio-guest-cart', id)
  }
  return id
}
export const sessionExpiredEvent = 'kurio:session-expired'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  await waitForNetwork()
  config.headers.set('X-Guest-Cart', guestCartId())
  const token = readSessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError<ApiError>(error) && error.response?.data.code === 'SESSION_EXPIRED') {
      const sent = error.config?.headers.get('Authorization')
      if (sent === `Bearer ${readSessionToken()}`)
        window.dispatchEvent(new Event(sessionExpiredEvent))
    }
    return Promise.reject(error)
  },
)

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response?.data?.message) return error.response.data
    return {
      code: 'NETWORK_ERROR',
      message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
    }
  }
  if (error instanceof Error) return { code: 'CLIENT_ERROR', message: error.message }
  return { code: 'UNKNOWN_ERROR', message: 'Não foi possível concluir. Tente novamente.' }
}
