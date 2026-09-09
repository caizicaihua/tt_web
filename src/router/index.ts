import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_PORTAL_PATH, firstAvailablePage, portalPages } from '@/constants/navigation'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: DEFAULT_PORTAL_PATH },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/portal',
      redirect: DEFAULT_PORTAL_PATH,
      component: () => import('@/layout/PortalLayout.vue'),
      children: portalPages.map((page) => ({
        path: page.path,
        component: () => import('@/views/workspace/index.vue'),
        meta: { title: page.title, description: page.description, permission: page.permission },
      })),
    },
    {
      path: '/403',
      component: () => import('@/views/error/index.vue'),
      meta: { title: '无访问权限', public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/error/index.vue'),
      meta: { title: '页面不存在', public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !(await auth.restoreSession())) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.permission && !auth.session?.permissions.includes(String(to.meta.permission)))
    return '/403'
  if (to.name === 'login' && auth.isAuthenticated)
    return firstAvailablePage(auth.session?.permissions || [])
})
router.afterEach((to) => {
  document.title = `${String(to.meta.title || '工作台')} · 广告数据后台`
})

export default router
