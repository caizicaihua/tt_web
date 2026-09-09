import { describe, expect, it } from 'vitest'
import { safeRedirect } from '../src/utils/redirect'
import { parseSession } from '../src/utils/session'

describe('login redirects', () => {
  it('preserves allowed report filters', () => {
    expect(safeRedirect('/portal/daily?advertiser_id=7644528974778712084')).toBe(
      '/portal/daily?advertiser_id=7644528974778712084',
    )
  })
  it.each([
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login',
    '/portal/v1/me',
    '/portal/../admin',
    '/portal/daily\n',
    ['//evil.test'],
  ])('rejects unsafe or unrelated redirects: %s', (path) => {
    expect(safeRedirect(path)).toBe('/portal/authorizations')
  })
})

describe('company session boundary', () => {
  const session = {
    user: { id: '123', username: 'demo', display_name: '测试用户' },
    company: { id: '7644528974778712084', name: '测试企业', company_type: 'external' },
    permissions: ['reports:read'],
  }
  it('preserves long IDs without numeric conversion', () => {
    expect(parseSession(session).company.id).toBe('7644528974778712084')
  })
  it('rejects a response without a company identity', () => {
    expect(() => parseSession({ ...session, company: null })).toThrow()
  })
  it('rejects already-rounded numeric company IDs', () => {
    expect(() => parseSession({ ...session, company: { ...session.company, id: 123 } })).toThrow()
  })
})
