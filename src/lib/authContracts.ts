export interface User {
  id: string
  name: string
  email: string
}
export interface Session {
  user: User
  expiresAt: number
}
export interface SessionResponse {
  session: Session | null
}
export interface AuthResponse {
  session: Session
  token: string
}
export interface LoginRequest {
  email: string
  password: string
}
export interface RegisterRequest extends LoginRequest {
  name: string
  confirmation: string
}
export interface ApiError {
  code: string
  message: string
  fields?: Partial<Record<string, string>>
}
export interface FavoritesResponse {
  ids: string[]
}
