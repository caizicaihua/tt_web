import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElAlert,
} from 'element-plus'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-button.css'
import 'element-plus/theme-chalk/el-checkbox.css'
import 'element-plus/theme-chalk/el-dialog.css'
import 'element-plus/theme-chalk/el-overlay.css'
import 'element-plus/theme-chalk/el-form.css'
import 'element-plus/theme-chalk/el-form-item.css'
import 'element-plus/theme-chalk/el-icon.css'
import 'element-plus/theme-chalk/el-input.css'
import 'element-plus/theme-chalk/el-alert.css'
import 'element-plus/theme-chalk/el-message.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './styles/global.css'

const app = createApp(App)
app.use(createPinia())
for (const component of [
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElAlert,
]) {
  app.use(component)
}
app.use(router)
window.addEventListener('portal:session-expired', () => {
  const auth = useAuthStore()
  auth.clearSession()
  if (!router.currentRoute.value.meta.public) {
    void router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
  }
})
app.mount('#app')
