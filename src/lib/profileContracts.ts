import type { User } from './authContracts'
export interface Profile extends User {
  username: string
  ens: string
  walletNickname: string
  avatar: string
}
export interface ProfileUpdate {
  name: string
  email: string
  username: string
  ens: string
  walletNickname: string
  avatar: string
  currentPassword: string
  newPassword: string
  confirmation: string
}
