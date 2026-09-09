import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
  }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/portal/v1',
  timeout: 15000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await http.request<unknown>(config)
    const body = response.data
    if (typeof body !== 'object' || body === null || !('code' in body)) {
      throw new ApiError('数据服务暂不可用，请稍后重试或联系管理员。', 'INVALID_RESPONSE')
    }
    // Webman contract baseline. Keep the business success code centralized.
    if (body.code !== 200) {
      const code = String(body.code)
      if (code === 'AUTH_REQUIRED' && config.url !== '/auth/login') {
        window.dispatchEvent(new Event('portal:session-expired'))
      }
      const message =
        'message' in body && typeof body.message === 'string'
          ? body.message
          : '操作未完成，请稍后重试'
      throw new ApiError(message, code)
    }
    if (!('data' in body))
      throw new ApiError('服务返回的数据不完整，请联系管理员。', 'INVALID_RESPONSE')
    return body.data as T
  } catch (error) {
    if (error instanceof ApiError || axios.isCancel(error)) throw error
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 401) {
        if (config.url !== '/auth/login') window.dispatchEvent(new Event('portal:session-expired'))
        throw new ApiError(
          config.url === '/auth/login'
            ? '账号或密码不正确，请检查后重试。'
            : '登录已失效，请重新登录。',
          'AUTH_REQUIRED',
        )
      }
      if (status === 403) throw new ApiError('当前账号没有访问权限，请联系管理员。', 'FORBIDDEN')
      if (status === 429) throw new ApiError('操作过于频繁，请稍后再试。', 'RATE_LIMITED')
      const body = error.response?.data
      if (body && typeof body === 'object' && typeof body.message === 'string') {
        throw new ApiError(body.message, String(body.code || status))
      }
      throw new ApiError('暂时无法连接数据服务，请稍后重试或联系管理员。', 'NETWORK_ERROR')
    }
    throw new ApiError('请求未完成，请稍后重试。', 'UNKNOWN_ERROR')
  }
}
