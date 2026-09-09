export function authorizationDestination(
  value: string,
  origin: string,
  hosts: string[],
  allowMock: boolean,
): string {
  const url = new URL(value, origin)
  if (url.username || url.password) throw new Error('授权地址无效')
  if (allowMock && url.origin === origin && url.pathname === '/portal/v1/tiktok/oauth/callback')
    return url.href
  if (url.protocol === 'https:' && !url.port && hosts.includes(url.hostname)) return url.href
  throw new Error('授权地址不在允许范围内，请联系管理员检查配置。')
}
