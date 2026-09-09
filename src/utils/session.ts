import type { PortalSession } from '@/types/auth'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export function parseSession(value: unknown): PortalSession {
  if (!isRecord(value) || !isRecord(value.user) || !isRecord(value.company)) {
    throw new Error('用户信息格式不正确，请联系管理员')
  }
  const { user, company, permissions } = value
  if (
    typeof user.id !== 'string' ||
    !user.id ||
    typeof user.username !== 'string' ||
    typeof user.display_name !== 'string' ||
    typeof company.id !== 'string' ||
    !company.id ||
    typeof company.name !== 'string' ||
    !['internal', 'external'].includes(String(company.company_type)) ||
    !Array.isArray(permissions) ||
    !permissions.every((item) => typeof item === 'string')
  ) {
    throw new Error('用户或公司信息不完整，请联系管理员')
  }
  return {
    user: { id: user.id, username: user.username, display_name: user.display_name },
    company: {
      id: company.id,
      name: company.name,
      company_type: company.company_type as 'internal' | 'external',
    },
    permissions: [...permissions],
  }
}
