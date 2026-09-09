import { onScopeDispose, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { safeRedirect } from '@/utils/redirect'
import { firstAvailablePage } from '@/constants/navigation'

const USERNAME_KEY = 'ad-console:remembered-username'

function readRememberedUsername() {
  try {
    return localStorage.getItem(USERNAME_KEY) || ''
  } catch {
    return ''
  }
}

export function useLogin(formRef: Readonly<Ref<FormInstance | null>>) {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const form = reactive({ username: readRememberedUsername(), password: '' })
  const rememberUsername = ref(Boolean(form.username))
  const loading = ref(false)
  const errorMessage = ref('')
  let active = true
  const rules: FormRules = {
    username: [{ required: true, whitespace: true, message: '请输入企业账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  }

  async function submit() {
    if (loading.value) return
    errorMessage.value = ''
    if (!(await formRef.value?.validate().catch(() => false))) return
    loading.value = true
    try {
      await auth.signIn({ username: form.username.trim(), password: form.password })
      if (!active) {
        auth.clearSession()
        return
      }
      try {
        if (rememberUsername.value) localStorage.setItem(USERNAME_KEY, form.username.trim())
        else localStorage.removeItem(USERNAME_KEY)
      } catch {
        /* Storage is optional; never prevent a valid login. */
      }
      form.password = ''
      await router.replace(
        route.query.redirect
          ? safeRedirect(route.query.redirect)
          : firstAvailablePage(auth.session?.permissions || []),
      )
    } catch (error) {
      if (active)
        errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后再试。'
    } finally {
      if (active) loading.value = false
    }
  }

  onScopeDispose(() => {
    active = false
    form.password = ''
  })
  return { form, rules, loading, rememberUsername, errorMessage, submit }
}
