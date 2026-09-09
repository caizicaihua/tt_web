import { DEFAULT_PORTAL_PATH, portalPages } from '@/constants/navigation'

const allowedPaths = new Set<string>(portalPages.map((page) => page.path))

export function safeRedirect(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    [...value].some((character) => character === '\\' || character.charCodeAt(0) <= 32)
  ) {
    return DEFAULT_PORTAL_PATH
  }
  try {
    const url = new URL(value, 'https://portal.invalid')
    if (url.origin !== 'https://portal.invalid' || !allowedPaths.has(url.pathname))
      return DEFAULT_PORTAL_PATH
    return url.pathname + url.search
  } catch {
    return DEFAULT_PORTAL_PATH
  }
}
