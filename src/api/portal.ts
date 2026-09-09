import { request } from './http'
import type {
  Account,
  Authorization,
  AuthorizationAttempt,
  AuthorizationUser,
  ExportTask,
  Page,
  Query,
  Report,
  SyncStatus,
} from '@/types/portal'

export const fetchAuthorizations = () =>
  request<Page<Authorization>>({ url: '/tiktok/authorizations' })
export const fetchAuthorizationUsers = () =>
  request<AuthorizationUser[]>({ url: '/tiktok/authorization-users' })
export const startAuthorization = () =>
  request<AuthorizationAttempt>({ url: '/tiktok/authorizations/start', method: 'POST' })
export const fetchAuthorizationAttempt = (id: string) =>
  request<AuthorizationAttempt>({ url: `/tiktok/authorization-attempts/${encodeURIComponent(id)}` })
export const disconnectAuthorization = (id: string) =>
  request<null>({
    url: `/tiktok/authorizations/${encodeURIComponent(id)}/disconnect`,
    method: 'POST',
  })
export const fetchAccounts = (params: Query = {}) =>
  request<Page<Account>>({ url: '/tiktok/accounts', params })
export const fetchAccount = (id: string) =>
  request<Account>({ url: `/tiktok/accounts/${encodeURIComponent(id)}` })
export const fetchReport = (
  kind: 'daily' | 'realtime',
  dimension: 'accounts' | 'campaigns',
  params: Query = {},
) => request<Report>({ url: `/tiktok/reports/${kind}/${dimension}`, params })
export const fetchSyncStatus = () => request<SyncStatus>({ url: '/tiktok/sync-status' })
export const fetchExports = () => request<Page<ExportTask>>({ url: '/exports' })
export const createExport = (data: {
  kind: 'daily' | 'realtime'
  dimension: 'accounts' | 'campaigns'
  filters: Query
}) => request<ExportTask>({ url: '/exports', method: 'POST', data })
export const exportDownloadUrl = (id: string) =>
  `${import.meta.env.VITE_API_BASE_URL || '/portal/v1'}/exports/${encodeURIComponent(id)}/download`
