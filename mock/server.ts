import { randomUUID } from 'node:crypto'
import { dateRangeError, shiftDate } from '../src/utils/dateRange.ts'
import type { Plugin } from 'vite'
import type { PortalSession } from '../src/types/auth.ts'
import type {
  Account,
  Authorization,
  AuthorizationAttempt,
  ExportTask,
  ReportRow,
} from '../src/types/portal.ts'

// Node-only development server. This module is never imported by application code.
const password = 'Demo123!'
const identities = [
  { username: 'demo_a', name: '星河传媒（模拟）', type: 'external' },
  { username: 'demo_b', name: '远山科技（模拟）', type: 'external' },
  { username: 'demo_internal', name: '本公司（模拟）', type: 'internal' },
  { username: 'demo_viewer', name: '星河传媒（模拟）', type: 'external' },
] as const
type Input = { method: string; url: string; cookie?: string; body?: unknown }
type Result = { status: number; headers?: Record<string, string>; body: unknown }
class MockError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
const fail = (status: number, code: string, message: string): never => {
  throw new MockError(status, code, message)
}
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const ok = (data: unknown, headers?: Record<string, string>): Result => ({
  status: 200,
  headers,
  body: { code: 200, message: 'ok', data },
})
const cookieName = 'ad_console_mock_session'
const cookie = (value: string) =>
  `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/portal/v1; Max-Age=${value ? 28800 : 0}`

export function createMockApi(now = () => Date.now()) {
  const sessions = new Map<string, { identity: number; expires: number }>()
  const accounts: Account[] = Array.from({ length: 9 }, (_, index) => ({
    id: `739000000000000000${index}`,
    name: `${['星河', '远山', '本公司'][Math.floor(index / 3)]} · ${['品牌推广', '新品增长', '再营销'][index % 3]}`,
    company_id: `company-${Math.floor(index / 3)}`,
    authorization_id: `authorization-${Math.floor(index / 3)}${index % 3 === 2 ? '-growth' : ''}`,
    authorization_username: index % 3 === 2 ? 'ads_growth' : 'ads_owner',
    status: index % 3 === 2 ? 'paused' : 'active',
    currency: 'USD',
    timezone: 'Asia/Shanghai',
  }))
  const authorizations = new Map<string, Authorization[]>(
    [0, 1, 2].map((index) => [
      `company-${index}`,
      [
        {
          id: `authorization-${index}`,
          username: 'ads_owner',
          name: 'TikTok Business Center（模拟）',
          status: 'authorized',
          authorized_at: new Date(now()).toISOString(),
        },
        {
          id: `authorization-${index}-growth`,
          username: 'ads_growth',
          name: 'TikTok Growth Center（模拟）',
          status: 'authorized',
          authorized_at: new Date(now()).toISOString(),
        },
      ],
    ]),
  )
  const attempts = new Map<string, AuthorizationAttempt & { company: string; expires: number }>()
  const exports = new Map<string, ExportTask & { company: string; rows: ReportRow[] }>()
  const snapshots = new Map<string, { company: string; date: string; updatedAt: string }>()
  const stoppedAt = new Map<string, number>()
  const latestBucket = (company: string) =>
    stoppedAt.get(company) ?? Math.floor(now() / 600000) * 600000
  const dateToday = () => new Date(now() + 8 * 3600000).toISOString().slice(0, 10)
  function paginate<T>(rows: T[], params: URLSearchParams) {
    const page = Number(params.get('page') || 1)
    const size = Number(params.get('page_size') || 20)
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1 || size > 100)
      fail(400, 'INVALID_QUERY', '分页参数无效')
    return {
      items: rows.slice((page - 1) * size, page * size),
      total: rows.length,
      page,
      page_size: size,
    }
  }
  function selectAccounts(company: string, params: URLSearchParams) {
    if (params.has('company_id') && params.get('company_id') !== company)
      fail(403, 'FORBIDDEN', '不能查询其他企业')
    const advertiser = params.get('advertiser_id')
    const authorization = params.get('authorization_id')
    if (authorization && !authorizations.get(company)!.some((a) => a.id === authorization))
      fail(404, 'NOT_FOUND', '授权用户不存在')
    if (advertiser && !accounts.some((a) => a.company_id === company && a.id === advertiser))
      fail(404, 'NOT_FOUND', '账户不存在')
    return accounts.filter(
      (a) =>
        a.company_id === company &&
        (!advertiser || a.id === advertiser) &&
        (!authorization || a.authorization_id === authorization) &&
        a.name.includes(params.get('keyword') || ''),
    )
  }
  function report(
    company: string,
    kind: string,
    dimension: string,
    params: URLSearchParams,
    allRows = false,
  ) {
    let dates = [dateToday()]
    if (kind === 'daily') {
      const suppliedRange = params.has('start_date') || params.has('end_date')
      const start = suppliedRange ? params.get('start_date') : dateToday()
      const end = suppliedRange ? params.get('end_date') : dateToday()
      const error = dateRangeError([start, end], now())
      if (error) fail(400, 'INVALID_QUERY', error)
      const days = (Date.parse(end!) - Date.parse(start!)) / 86400000 + 1
      dates = Array.from({ length: days }, (_, index) => shiftDate(start!, index))
    }
    let snapshotId: string | null = null
    let updatedAt = new Date(now()).toISOString()
    if (kind === 'realtime') {
      const bucket = latestBucket(company)
      snapshotId = params.get('snapshot_id') || `snapshot-${company}-${bucket}`
      if (!params.has('snapshot_id'))
        snapshots.set(snapshotId, {
          company,
          date: new Date(bucket + 8 * 3600000).toISOString().slice(0, 10),
          updatedAt: new Date(bucket).toISOString(),
        })
      const snapshot = snapshots.get(snapshotId)
      if (!snapshot || snapshot.company !== company)
        fail(404, 'NOT_FOUND', '快照不存在，请重新查询')
      dates = [snapshot!.date]
      updatedAt = snapshot!.updatedAt
    }
    const selected = selectAccounts(company, params)
    const rows: ReportRow[] = dates.flatMap((date) =>
      selected.flatMap((account) =>
        Array.from({ length: dimension === 'campaigns' ? 2 : 1 }, (_, i) => {
          const index = accounts.indexOf(account)
          const cents =
            (125040 + index * 23410 + Number(date.slice(-2)) * 100) * (kind === 'realtime' ? 1 : 2)
          return {
            id: `${account.id}-${date}${dimension === 'campaigns' ? `-${i}` : ''}`,
            advertiser_id: account.id,
            authorization_id: account.authorization_id,
            authorization_username: account.authorization_username,
            name: `${account.name}${dimension === 'campaigns' ? ` / 计划 ${i + 1}` : ''}`,
            date,
            spend: ((dimension === 'campaigns' ? cents / 2 : cents) / 100).toFixed(2),
            impressions: (180000 + index * 12000) / (dimension === 'campaigns' ? 2 : 1),
            clicks: (3200 + index * 200) / (dimension === 'campaigns' ? 2 : 1),
            currency: account.currency,
            timezone: account.timezone,
          }
        }),
      ),
    )
    return {
      ...paginate(rows, params),
      ...(allRows ? { items: rows } : {}),
      summary: {
        spend: (
          rows.reduce((total, row) => total + Math.round(Number(row.spend) * 100), 0) / 100
        ).toFixed(2),
        impressions: rows.reduce((total, row) => total + row.impressions, 0),
        clicks: rows.reduce((total, row) => total + row.clicks, 0),
        currency: 'USD',
      },
      snapshot_id: snapshotId,
      data_updated_at: updatedAt,
    }
  }
  function handle(input: Input): Result {
    const url = new URL(input.url, 'http://mock.local')
    const path = url.pathname.replace(/^\/portal\/v1/, '')
    const data = object(input.body)
    const token =
      input.cookie
        ?.split(';')
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${cookieName}=`))
        ?.slice(cookieName.length + 1) || ''
    if (path === '/auth/login' && input.method === 'POST') {
      const identity = identities.findIndex((i) => i.username === data.username)
      if (identity < 0 || data.password !== password) fail(401, 'AUTH_REQUIRED', '账号或密码不正确')
      sessions.delete(token)
      const newToken = randomUUID()
      sessions.set(newToken, { identity, expires: now() + 8 * 3600000 })
      return ok(null, { 'Set-Cookie': cookie(newToken) })
    }
    if (path === '/auth/logout' && input.method === 'POST') {
      sessions.delete(token)
      return ok(null, { 'Set-Cookie': cookie('') })
    }
    const session = sessions.get(token)
    if (!session || session.expires <= now()) {
      sessions.delete(token)
      fail(401, 'AUTH_REQUIRED', '请先登录')
    }
    const identity = identities[session!.identity]!
    const company = `company-${session!.identity === 3 ? 0 : session!.identity}`
    const permissions = [
      'accounts:read',
      'reports:read',
      'exports:read',
      'exports:write',
      ...(session!.identity === 3 ? [] : ['authorizations:read', 'authorizations:write']),
    ]
    const requirePermission = (permission: string) => {
      if (!permissions.includes(permission)) fail(403, 'FORBIDDEN', '没有操作权限')
    }
    if (url.searchParams.has('company_id') && url.searchParams.get('company_id') !== company)
      fail(403, 'FORBIDDEN', '不能查询其他企业')
    const simulatedStatus = Number(url.searchParams.get('mock_status'))
    if ([403, 429, 500].includes(simulatedStatus))
      fail(simulatedStatus, 'MOCK_FAILURE', '开发环境模拟请求失败')
    if (path === '/me' && input.method === 'GET')
      return ok({
        user: {
          id: `user-${session!.identity}`,
          username: identity.username,
          display_name: session!.identity === 3 ? '只读成员' : '演示管理员',
        },
        company: { id: company, name: identity.name, company_type: identity.type },
        permissions,
      } satisfies PortalSession)
    if (path === '/tiktok/authorizations' && input.method === 'GET') {
      requirePermission('authorizations:read')
      return ok(paginate(authorizations.get(company)!, url.searchParams))
    }
    if (path === '/tiktok/authorization-users' && input.method === 'GET') {
      if (!permissions.includes('accounts:read') && !permissions.includes('reports:read'))
        fail(403, 'FORBIDDEN', '没有查询权限')
      return ok(
        authorizations.get(company)!.map(({ id, username, status }) => ({ id, username, status })),
      )
    }
    if (path === '/tiktok/authorizations/start' && input.method === 'POST') {
      requirePermission('authorizations:write')
      const id = randomUUID()
      const attempt = {
        id,
        company,
        expires: now() + 600000,
        status: 'pending' as const,
        authorization_url: `/portal/v1/tiktok/oauth/callback?state=${id}&code=mock-approved`,
      }
      attempts.set(id, attempt)
      return ok({ id, status: attempt.status, authorization_url: attempt.authorization_url })
    }
    if (path === '/tiktok/oauth/callback' && input.method === 'GET') {
      requirePermission('authorizations:write')
      const attempt = attempts.get(url.searchParams.get('state') || '')
      if (
        !attempt ||
        attempt.company !== company ||
        attempt.status !== 'pending' ||
        attempt.expires <= now() ||
        url.searchParams.get('code') !== 'mock-approved'
      )
        fail(400, 'INVALID_STATE', '模拟授权已失效')
      attempt!.status = 'completed'
      stoppedAt.delete(company)
      authorizations.get(company)!.forEach((a) => {
        a.status = 'authorized'
        a.authorized_at = new Date(now()).toISOString()
      })
      return { status: 302, headers: { Location: '/portal/authorizations' }, body: '' }
    }
    const attemptMatch = path.match(/^\/tiktok\/authorization-attempts\/([^/]+)$/)
    if (attemptMatch && input.method === 'GET') {
      requirePermission('authorizations:read')
      const attempt = attempts.get(attemptMatch[1]!)
      if (!attempt || attempt.company !== company) fail(404, 'NOT_FOUND', '授权记录不存在')
      return ok({
        id: attempt!.id,
        status: attempt!.status,
        authorization_url: attempt!.authorization_url,
      })
    }
    const disconnect = path.match(/^\/tiktok\/authorizations\/([^/]+)\/disconnect$/)
    if (disconnect && input.method === 'POST') {
      requirePermission('authorizations:write')
      const auth = authorizations.get(company)!.find((a) => a.id === disconnect[1])
      if (!auth) fail(404, 'NOT_FOUND', '授权不存在')
      auth!.status = 'disconnected'
      if (
        !stoppedAt.has(company) &&
        authorizations.get(company)!.every((a) => a.status === 'disconnected')
      )
        stoppedAt.set(company, Math.floor(now() / 600000) * 600000)
      return ok(null)
    }
    if (path === '/tiktok/accounts' && input.method === 'GET') {
      requirePermission('accounts:read')
      return ok(paginate(selectAccounts(company, url.searchParams), url.searchParams))
    }
    const accountMatch = path.match(/^\/tiktok\/accounts\/([^/]+)$/)
    if (accountMatch && input.method === 'GET') {
      requirePermission('accounts:read')
      const account = accounts.find((a) => a.company_id === company && a.id === accountMatch[1])
      if (!account) fail(404, 'NOT_FOUND', '账户不存在')
      return ok(account)
    }
    const reportMatch = path.match(/^\/tiktok\/reports\/(daily|realtime)\/(accounts|campaigns)$/)
    if (reportMatch && input.method === 'GET') {
      requirePermission('reports:read')
      return ok(report(company, reportMatch[1]!, reportMatch[2]!, url.searchParams))
    }
    if (path === '/tiktok/sync-status' && input.method === 'GET') {
      requirePermission('reports:read')
      const bucket = latestBucket(company)
      return ok({
        status: authorizations.get(company)!.some((a) => a.status === 'authorized')
          ? 'completed'
          : 'authorization_required',
        interval_minutes: 10,
        data_updated_at: new Date(bucket).toISOString(),
        next_sync_at: stoppedAt.has(company) ? null : new Date(bucket + 600000).toISOString(),
      })
    }
    if (path === '/exports' && input.method === 'GET') {
      requirePermission('exports:read')
      return ok(
        paginate(
          [...exports.values()]
            .filter((e) => e.company === company)
            .map(({ id, name, status, created_at }) => ({ id, name, status, created_at })),
          url.searchParams,
        ),
      )
    }
    if (path === '/exports' && input.method === 'POST') {
      requirePermission('exports:write')
      if (
        !['daily', 'realtime'].includes(String(data.kind)) ||
        !['accounts', 'campaigns'].includes(String(data.dimension))
      )
        fail(400, 'INVALID_QUERY', '请选择报表类型和维度')
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(object(data.filters))) {
        if (value != null) params.set(key, String(value))
      }
      params.set('page', '1')
      params.set('page_size', '100')
      const result = report(company, String(data.kind), String(data.dimension), params, true)
      const task: ExportTask = {
        id: randomUUID(),
        name: `${data.kind}-${data.dimension}-mock.csv`,
        status: 'completed',
        created_at: new Date(now()).toISOString(),
      }
      exports.set(task.id, { ...task, company, rows: result.items })
      return ok(task)
    }
    const download = path.match(/^\/exports\/([^/]+)\/download$/)
    if (download && input.method === 'GET') {
      requirePermission('exports:read')
      const task = exports.get(download[1]!)
      if (!task || task.company !== company) fail(404, 'NOT_FOUND', '下载记录不存在')
      const rows = task!.rows.map((r) =>
        [
          r.advertiser_id,
          r.name,
          r.authorization_username,
          r.date,
          r.spend,
          r.currency,
          r.timezone,
        ].join(','),
      )
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${task!.name}"`,
        },
        body:
          '\uFEFFadvertiser_id,name,authorization_username,date,spend,currency,timezone\r\n' +
          rows.join('\r\n'),
      }
    }
    return { status: 404, body: { code: 'NOT_FOUND', message: 'Mock 尚未定义此接口', data: null } }
  }
  return (input: Input): Result => {
    try {
      return handle(input)
    } catch (error) {
      if (error instanceof MockError)
        return {
          status: error.status,
          body: { code: error.code, message: error.message, data: null },
        }
      throw error
    }
  }
}

export function portalMockPlugin(): Plugin {
  const handle = createMockApi()
  return {
    name: 'portal-development-mock',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.match(/^\/portal\/v1(?:\/|\?|$)/)) return next()
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        try {
          const chunks: Buffer[] = []
          let size = 0
          for await (const chunk of req) {
            size += chunk.length
            if (size > 65536) {
              res.statusCode = 413
              res.end(
                JSON.stringify({ code: 'PAYLOAD_TOO_LARGE', message: '请求体过大', data: null }),
              )
              return
            }
            chunks.push(Buffer.from(chunk))
          }
          const raw = Buffer.concat(chunks).toString()
          await new Promise((resolve) => setTimeout(resolve, 150))
          const result = handle({
            method: req.method || 'GET',
            url: req.url,
            cookie: req.headers.cookie,
            body: raw ? JSON.parse(raw) : undefined,
          })
          res.statusCode = result.status
          for (const [key, value] of Object.entries(result.headers || {})) res.setHeader(key, value)
          res.end(typeof result.body === 'string' ? result.body : JSON.stringify(result.body))
        } catch {
          res.statusCode = 400
          res.end(
            JSON.stringify({ code: 'INVALID_REQUEST', message: 'Mock 请求格式错误', data: null }),
          )
        }
      })
    },
  }
}
