import type { MarketOverride } from './market'
import type { Order } from '../lib/orderContracts'
import type { User } from '../lib/authContracts'
import type { StoredCart } from './cart'
import type { Wallets } from '../lib/walletContracts'

interface StoredUser extends User {
  salt: string
  passwordHash: string
  favorites: string[]
  username?: string
  ens?: string
  walletNickname?: string
  avatar?: string
}
interface StoredSession {
  token: string
  userId: string
  expiresAt: number
}
export interface Database {
  version: 1
  users: StoredUser[]
  sessions: StoredSession[]
  carts: Record<string, StoredCart>
  wallets: Record<string, Wallets>
  orders: Order[]
  market: Record<string, MarketOverride>
  effects?: string[]
}
export const databaseKey = 'kurio-mock-database-v1'
let serial: Promise<unknown> = Promise.resolve()

export async function hashPassword(password: string, salt: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  )
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function load(): Promise<Database> {
  const saved = localStorage.getItem(databaseKey)
  if (saved) {
    try {
      const db = JSON.parse(saved) as Database
      if (db.version === 1 && Array.isArray(db.users) && Array.isArray(db.sessions)) {
        db.carts ??= {}
        db.wallets ??= {}
        db.orders ??= []
        db.market ??= {}
        Object.values(db.wallets).forEach((wallets) => {
          if (wallets.connectedId === undefined) wallets.connectedId = wallets.selectedId
        })
        db.orders.forEach((order) => {
          order.status ??= 'confirmed'
          order.version ??= 1
        })
        return db
      }
    } catch {
      /* Restore known fixtures for invalid persistence. */
    }
  }
  // Known fixture hashes use the same PBKDF2 parameters as registration.
  // Avoid deriving identical seeds on every fresh page load.
  const users = [
    {
      id: 'collector-1',
      name: 'Gabriel Sales',
      email: 'gabriel@kurio.test',
      salt: 'kurio-fixture-gabriel-v1',
      passwordHash: '2077b3d0cc29e45aa095a9a86c78fe15102eeedd654c92a31cc847eea6159f4a',
    },
    {
      id: 'collector-2',
      name: 'Nova Sato',
      email: 'nova@kurio.test',
      salt: 'kurio-fixture-nova-v1',
      passwordHash: 'f62c1cbc6168ecbc67e21943638093d975d1d848092bbd446279f1722390e0a8',
    },
  ].map((user) => ({ ...user, favorites: [] }))
  return { version: 1, users, sessions: [], carts: {}, wallets: {}, orders: [], market: {} }
}

export function transaction<T>(operation: (db: Database) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const db = await load()
    const value = await operation(db)
    localStorage.setItem(databaseKey, JSON.stringify(db))
    return value
  }
  const result = serial.then(() =>
    navigator.locks ? navigator.locks.request('kurio-mock-database', run) : run(),
  )
  serial = result.catch(() => undefined)
  return result
}

export function publicUser(user: StoredUser): User {
  return { id: user.id, name: user.name, email: user.email }
}
