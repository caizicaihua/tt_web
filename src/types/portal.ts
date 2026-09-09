export interface Account {
  id: string
  name: string
  company_id: string
  authorization_id: string
  authorization_username: string
  status: string
  currency: string
  timezone: string
}
export interface Authorization {
  id: string
  username: string
  name: string
  status: 'authorized' | 'disconnected'
  authorized_at: string
}
export type AuthorizationUser = Pick<Authorization, 'id' | 'username' | 'status'>
export interface ReportRow {
  id: string
  advertiser_id: string
  authorization_id: string
  authorization_username: string
  name: string
  date: string
  spend: string
  impressions: number
  clicks: number
  currency: string
  timezone: string
}
export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
export interface Report extends Page<ReportRow> {
  summary: { spend: string; impressions: number; clicks: number; currency: string }
  snapshot_id: string | null
  data_updated_at: string
}
export interface ExportTask {
  id: string
  name: string
  status: 'completed'
  created_at: string
}
export interface AuthorizationAttempt {
  id: string
  status: 'pending' | 'completed'
  authorization_url: string
}
export interface SyncStatus {
  status: string
  interval_minutes: number
  data_updated_at: string
  next_sync_at: string | null
}
export interface Query {
  page?: number
  page_size?: number
  keyword?: string
  advertiser_id?: string
  authorization_id?: string
  start_date?: string
  end_date?: string
  snapshot_id?: string
}
