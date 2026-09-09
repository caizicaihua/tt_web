import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { portalMockPlugin } from './mock/server.ts'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const mockEnabled =
    command === 'serve' && mode === 'development' && env.VITE_ENABLE_MOCK !== 'false'
  if (mockEnabled && env.VITE_API_BASE_URL && env.VITE_API_BASE_URL !== '/portal/v1') {
    throw new Error('Mock 模式请使用同源 VITE_API_BASE_URL=/portal/v1')
  }
  return {
    plugins: [vue(), ...(mockEnabled ? [portalMockPlugin()] : [])],
    define: { __MOCK_ENABLED__: JSON.stringify(mockEnabled) },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      proxy:
        !mockEnabled && env.DEV_API_TARGET
          ? { '/portal/v1': { target: env.DEV_API_TARGET, changeOrigin: true } }
          : undefined,
    },
  }
})
