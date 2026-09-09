import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import type { LoginPayload, PortalSession } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<PortalSession | null>(null)
  const sessionError = ref('')
  const isAuthenticated = computed(() => session.value !== null)
  let generation = 0
  let pending: Promise<boolean> | null = null

  function clearSession() {
    generation++
    session.value = null
    pending = null
  }

  async function restoreSession(): Promise<boolean> {
    if (session.value) return true
    if (pending) return pending
    const current = generation
    const task = (async () => {
      try {
        const result = await authApi.fetchCurrentUser()
        if (current !== generation) return false
        session.value = result
        sessionError.value = ''
        return true
      } catch {
        return false
      } finally {
        if (current === generation) pending = null
      }
    })()
    pending = task
    return task
  }

  async function signIn(payload: LoginPayload) {
    clearSession()
    const current = generation
    await authApi.login(payload)
    const result = await authApi.fetchCurrentUser()
    if (current !== generation) throw new Error('登录状态已变化，请重新登录。')
    session.value = result
    sessionError.value = ''
  }

  async function signOut() {
    await authApi.logout()
    clearSession()
  }

  return { session, sessionError, isAuthenticated, clearSession, restoreSession, signIn, signOut }
})
