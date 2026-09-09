import { request } from './http'
import type { LoginPayload } from '@/types/auth'
import { parseSession } from '@/utils/session'

export const login = (data: LoginPayload) =>
  request<null>({ url: '/auth/login', method: 'POST', data })
export const logout = () => request<null>({ url: '/auth/logout', method: 'POST' })
export async function fetchCurrentUser() {
  return parseSession(await request<unknown>({ url: '/me', method: 'GET' }))
}
