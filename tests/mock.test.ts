import { beforeEach, describe, expect, it } from 'vitest'
import { createMockApi } from '../mock/server'
import type {
  Account,
  AuthorizationAttempt,
  AuthorizationUser,
  ExportTask,
  Page,
  Report,
} from '../src/types/portal'
import type { PortalSession } from '../src/types/auth'
import { authorizationDestination } from '../src/utils/authorization'

let api: ReturnType<typeof createMockApi>
let time: number
let a: string
let b: string
function login(username: string) {
  const result = api({
    method: 'POST',
    url: '/portal/v1/auth/login',
    body: { username, password: 'Demo123!' },
  })
  expect(result.status).toBe(200)
  return result.headers!['Set-Cookie']!.split(';')[0]!
}
function call(url: string, cookie = a, method = 'GET', body?: unknown) {
  return api({ method, url: `/portal/v1${url}`, cookie, body })
}
function data<T>(result: ReturnType<typeof call>): T {
  expect(result.status).toBe(200)
  return (result.body as { data: T }).data
}
beforeEach(() => {
  time = Date.parse('2026-09-09T04:09:00Z')
  api = createMockApi(() => time)
  a = login('demo_a')
  b = login('demo_b')
})
describe('Mock authentication and company boundaries', () => {
  it('rejects unauthenticated queries and bad passwords', () => {
    expect(call('/me', '').status).toBe(401)
    expect(call('/auth/login', '', 'POST', { username: 'demo_a', password: 'wrong' }).status).toBe(
      401,
    )
  })
  it('restores company identity and invalidates expired or logged-out sessions', () => {
    expect(data<PortalSession>(call('/me')).company.id).toBe('company-0')
    call('/auth/logout', a, 'POST')
    expect(call('/me').status).toBe(401)
    time += 8 * 3600000
    expect(call('/me', b).status).toBe(401)
  })
  it('isolates all three companies and preserves long string IDs', () => {
    const internal = login('demo_internal')
    const accounts = [a, b, internal].map(
      (cookie) => data<Page<Account>>(call('/tiktok/accounts', cookie)).items,
    )
    expect(new Set(accounts.flat().map((row) => row.id)).size).toBe(9)
    accounts.forEach((rows, index) => {
      expect(rows).toHaveLength(3)
      expect(
        rows.every(
          (row) =>
            row.company_id === `company-${index}` &&
            typeof row.id === 'string' &&
            row.id.length === 19,
        ),
      ).toBe(true)
    })
    expect(data<PortalSession>(call('/me', internal)).company.company_type).toBe('internal')
    const other = accounts[1]![0]!.id
    expect(call(`/tiktok/accounts/${other}`).status).toBe(404)
    expect(call(`/tiktok/reports/daily/accounts?advertiser_id=${other}`).status).toBe(404)
    expect(call('/tiktok/accounts?company_id=company-1').status).toBe(403)
    expect(call('/tiktok/authorizations/authorization-1/disconnect', a, 'POST').status).toBe(404)
  })
  it('allows viewer reporting and exports but denies authorization management', () => {
    const viewer = login('demo_viewer')
    expect(call('/tiktok/authorizations/start', viewer, 'POST').status).toBe(403)
    expect(call('/tiktok/reports/daily/accounts', viewer).status).toBe(200)
    expect(call('/exports', viewer).status).toBe(200)
  })
})
describe('Mock reporting and exports', () => {
  it('includes both date endpoints, combines username filtering and keeps totals across pages', () => {
    const query =
      'start_date=2026-09-01&end_date=2026-09-03&authorization_id=authorization-0-growth'
    const report = data<Report>(call(`/tiktok/reports/daily/accounts?${query}`))
    expect(report.items.map((row) => row.date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03'])
    expect(new Set(report.items.map((row) => row.id)).size).toBe(3)
    expect(report.items.every((row) => row.authorization_username === 'ads_growth')).toBe(true)
    const page = data<Report>(call(`/tiktok/reports/daily/accounts?${query}&page=2&page_size=1`))
    expect(page.items[0]!.date).toBe('2026-09-02')
    expect(page.summary).toEqual(report.summary)
    expect(report.total).toBe(3)
  })
  it('exports more than 100 date-range rows without truncating to the API page limit', () => {
    const task = data<ExportTask>(
      call('/exports', a, 'POST', {
        kind: 'daily',
        dimension: 'campaigns',
        filters: { start_date: '2026-08-10', end_date: '2026-09-09', page_size: 5 },
      }),
    )
    const csv = String(call(`/exports/${task.id}/download`).body)
    expect(csv.split('\r\n')).toHaveLength(187)
    expect(csv).toContain('2026-08-10')
    expect(csv).toContain('2026-09-09')
  })
  it.each([
    'start_date=2026-09-02&end_date=2026-09-01',
    'start_date=2026-08-01&end_date=2026-09-09',
    'start_date=2026-09-01',
    'start_date=2026-09-09&end_date=2026-09-10',
  ])('rejects invalid date ranges: %s', (query) => {
    expect(call(`/tiktok/reports/daily/accounts?${query}`).status).toBe(400)
  })
  it('lists company-scoped authorization usernames, including for report-only members', () => {
    const users = data<AuthorizationUser[]>(call('/tiktok/authorization-users'))
    const others = data<AuthorizationUser[]>(call('/tiktok/authorization-users', b))
    expect(users.map((user) => user.username)).toEqual(['ads_owner', 'ads_growth'])
    expect(others.map((user) => user.username)).toEqual(users.map((user) => user.username))
    expect(users.every((user) => !others.some((other) => other.id === user.id))).toBe(true)
    expect(
      data<AuthorizationUser[]>(call('/tiktok/authorization-users', login('demo_viewer'))),
    ).toEqual(users)
  })
  it('filters account and report rows, pagination, totals and exports by authorization ID', () => {
    const id = 'authorization-0'
    const accounts = data<Page<Account>>(
      call(`/tiktok/accounts?authorization_id=${id}&page_size=1`),
    )
    expect(accounts.total).toBe(2)
    expect(accounts.items).toHaveLength(1)
    expect(accounts.items[0]!.authorization_username).toBe('ads_owner')
    const report = data<Report>(
      call(`/tiktok/reports/daily/campaigns?authorization_id=${id}&page_size=1`),
    )
    expect(report.total).toBe(4)
    const full = data<Report>(call(`/tiktok/reports/daily/campaigns?authorization_id=${id}`))
    expect(full.items.every((row) => row.authorization_id === id)).toBe(true)
    expect(report.summary).toEqual(full.summary)
    expect(Number(full.summary.spend)).toBeCloseTo(
      full.items.reduce((sum, row) => sum + Number(row.spend), 0),
      2,
    )
    const task = data<ExportTask>(
      call('/exports', a, 'POST', {
        kind: 'daily',
        dimension: 'campaigns',
        filters: { authorization_id: id, page_size: 1 },
      }),
    )
    const csv = String(call(`/exports/${task.id}/download`).body)
    expect(csv.split('\r\n')).toHaveLength(5)
    expect(csv).toContain('ads_owner')
    expect(csv).not.toContain('ads_growth')
    expect(data<Page<Account>>(call('/tiktok/accounts')).total).toBe(3)
    expect(
      data<Page<Account>>(
        call('/tiktok/accounts?authorization_id=authorization-0-growth&keyword=品牌'),
      ).total,
    ).toBe(0)
  })
  it('rejects unknown and cross-company authorization filters, even with identical usernames', () => {
    for (const id of ['authorization-1', 'missing']) {
      expect(call(`/tiktok/accounts?authorization_id=${id}`).status).toBe(404)
      expect(call(`/tiktok/reports/daily/accounts?authorization_id=${id}`).status).toBe(404)
      expect(
        call('/exports', a, 'POST', {
          kind: 'daily',
          dimension: 'accounts',
          filters: { authorization_id: id },
        }).status,
      ).toBe(404)
    }
  })
  it('pins realtime pagination and totals across the 10-minute boundary', () => {
    const first = data<Report>(call('/tiktok/reports/realtime/campaigns?page_size=5'))
    time += 120000
    const second = data<Report>(
      call(
        `/tiktok/reports/realtime/campaigns?page_size=5&page=2&snapshot_id=${first.snapshot_id}`,
      ),
    )
    expect(second.snapshot_id).toBe(first.snapshot_id)
    expect(second.summary).toEqual(first.summary)
    expect(second.items).toHaveLength(1)
    expect(second.data_updated_at).toBe(first.data_updated_at)
    expect(data<Report>(call('/tiktok/reports/realtime/campaigns')).snapshot_id).not.toBe(
      first.snapshot_id,
    )
    expect(
      call(`/tiktok/reports/realtime/accounts?snapshot_id=${first.snapshot_id}`, b).status,
    ).toBe(404)
    const cents = [...first.items, ...second.items].reduce(
      (sum, row) => sum + Math.round(Number(row.spend) * 100),
      0,
    )
    expect(cents).toBe(Math.round(Number(first.summary.spend) * 100))
  })
  it('validates filters, supports empty results and explicit failure scenarios', () => {
    expect(
      data<Report>(call('/tiktok/reports/daily/accounts?keyword=not-found')).summary.spend,
    ).toBe('0.00')
    expect(
      call('/tiktok/reports/daily/accounts?start_date=2026-02-30&end_date=2026-03-01').status,
    ).toBe(400)
    expect(call('/tiktok/accounts?page=0').status).toBe(400)
    expect(call('/tiktok/accounts?mock_status=500').status).toBe(500)
    expect(call('/unknown-api').status).toBe(404)
  })
  it('exports the full filtered report and forbids another company downloading it', () => {
    const task = data<ExportTask>(
      call('/exports', a, 'POST', {
        kind: 'daily',
        dimension: 'campaigns',
        filters: { keyword: '品牌', page_size: 1 },
      }),
    )
    const csv = call(`/exports/${task.id}/download`)
    expect(csv.status).toBe(200)
    expect(String(csv.body).split('\r\n')).toHaveLength(3)
    expect(String(csv.body)).toContain('星河')
    expect(String(csv.body)).not.toContain('远山')
    expect(call(`/exports/${task.id}/download`, b).status).toBe(404)
    expect(data<Page<ExportTask>>(call('/exports', b)).items).toHaveLength(0)
    expect(
      call('/exports', a, 'POST', {
        kind: 'daily',
        dimension: 'accounts',
        filters: { company_id: 'company-1' },
      }).status,
    ).toBe(403)
  })
})
describe('Mock authorization', () => {
  it('keeps the last snapshot after disconnecting authorization', () => {
    const before = data<Report>(call('/tiktok/reports/realtime/accounts'))
    call('/tiktok/authorizations/authorization-0/disconnect', a, 'POST')
    call('/tiktok/authorizations/authorization-0-growth/disconnect', a, 'POST')
    time += 24 * 3600000
    a = login('demo_a')
    const after = data<Report>(call('/tiktok/reports/realtime/accounts'))
    expect(after.snapshot_id).toBe(before.snapshot_id)
    expect(after.items).toEqual(before.items)
  })
  it('scopes attempts to the company, consumes state once and restores authorization', () => {
    const attempt = data<AuthorizationAttempt>(call('/tiktok/authorizations/start', a, 'POST'))
    expect(call(`/tiktok/authorization-attempts/${attempt.id}`, b).status).toBe(404)
    expect(api({ method: 'GET', url: attempt.authorization_url, cookie: b }).status).toBe(400)
    call('/tiktok/authorizations/authorization-0/disconnect', a, 'POST')
    expect(api({ method: 'GET', url: attempt.authorization_url, cookie: a }).status).toBe(302)
    expect(
      data<AuthorizationAttempt>(call(`/tiktok/authorization-attempts/${attempt.id}`)).status,
    ).toBe('completed')
    expect(api({ method: 'GET', url: attempt.authorization_url, cookie: a }).status).toBe(400)
  })
  it('rejects expired authorization state', () => {
    const attempt = data<AuthorizationAttempt>(call('/tiktok/authorizations/start', a, 'POST'))
    time += 600001
    expect(api({ method: 'GET', url: attempt.authorization_url, cookie: a }).status).toBe(400)
  })
  it('validates external destinations and permits local callback only in Mock', () => {
    const origin = 'http://127.0.0.1:5175'
    expect(
      authorizationDestination('/portal/v1/tiktok/oauth/callback', origin, [], true),
    ).toContain(origin)
    expect(() =>
      authorizationDestination('/portal/v1/tiktok/oauth/callback', origin, [], false),
    ).toThrow()
    expect(() => authorizationDestination('javascript:alert(1)', origin, [], true)).toThrow()
    expect(() =>
      authorizationDestination('https://evil.test', origin, ['approved.test'], false),
    ).toThrow()
    expect(
      authorizationDestination('https://approved.test/auth', origin, ['approved.test'], false),
    ).toBe('https://approved.test/auth')
  })
})
