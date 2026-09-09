import { computed, onScopeDispose, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import 'element-plus/theme-chalk/el-message-box.css'
import { authorizationDestination } from '@/utils/authorization'
import { dateRangeError, recentDateRange } from '@/utils/dateRange'
import {
  createExport,
  disconnectAuthorization,
  fetchAccounts,
  fetchAuthorizations,
  fetchAuthorizationUsers,
  fetchExports,
  fetchReport,
  fetchSyncStatus,
  startAuthorization,
} from '@/api/portal'
import type {
  Account,
  Authorization,
  AuthorizationUser,
  ExportTask,
  Report,
  ReportRow,
  SyncStatus,
} from '@/types/portal'

export function useWorkspace() {
  const route = useRoute()
  const section = computed(() => route.path.split('/').at(-1) || 'accounts')
  const isReport = computed(() => ['daily', 'realtime'].includes(section.value))
  const rows = ref<(Account | Authorization | ExportTask | ReportRow)[]>([])
  const report = ref<Report | null>(null)
  const sync = ref<SyncStatus | null>(null)
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  const notice = ref('')
  const keyword = ref('')
  const authorizationId = ref('')
  const authorizationUsers = ref<AuthorizationUser[]>([])
  const dateRange = ref(recentDateRange())
  const dimension = ref<'accounts' | 'campaigns'>('accounts')
  const page = ref(1)
  const total = ref(0)
  const pageSize = 5
  let appliedFilters = filters()
  let generation = 0
  let active = true
  function filters() {
    return {
      keyword: keyword.value,
      authorization_id: authorizationId.value || undefined,
      ...(section.value === 'daily'
        ? { start_date: dateRange.value?.[0], end_date: dateRange.value?.[1] }
        : {}),
      page: page.value,
      page_size: pageSize,
    }
  }
  async function load(preserveSnapshot = false) {
    const current = ++generation
    loading.value = true
    error.value = ''
    const query = preserveSnapshot ? { ...appliedFilters, page: page.value } : filters()
    try {
      if (section.value === 'daily') {
        const rangeError = dateRangeError([query.start_date, query.end_date])
        if (rangeError) throw new Error(rangeError)
      }
      let result
      let reportResult: Report | null = null
      let syncResult: SyncStatus | null = null
      let userOptions: AuthorizationUser[] = []
      if (section.value === 'authorizations') result = await fetchAuthorizations()
      else if (section.value === 'accounts') {
        const [accounts, users] = await Promise.all([
          fetchAccounts(query),
          fetchAuthorizationUsers(),
        ])
        result = accounts
        userOptions = users
      } else if (section.value === 'downloads') result = await fetchExports()
      else {
        const [data, status, users] = await Promise.all([
          fetchReport(section.value === 'realtime' ? 'realtime' : 'daily', dimension.value, {
            ...query,
            ...(preserveSnapshot && report.value?.snapshot_id
              ? { snapshot_id: report.value.snapshot_id }
              : {}),
          }),
          fetchSyncStatus(),
          fetchAuthorizationUsers(),
        ])
        result = data
        reportResult = data
        syncResult = status
        userOptions = users
      }
      if (!active || current !== generation) return
      rows.value = result.items
      total.value = result.total
      report.value = reportResult
      sync.value = syncResult
      authorizationUsers.value = userOptions
      appliedFilters = query
    } catch (err) {
      if (active && current === generation) {
        rows.value = []
        report.value = null
        sync.value = null
        total.value = 0
        error.value = err instanceof Error ? err.message : '加载失败，请重试'
      }
    } finally {
      if (active && current === generation) loading.value = false
    }
  }
  async function action(run: () => Promise<void>) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      await run()
    } catch (err) {
      if (active) error.value = err instanceof Error ? err.message : '操作失败，请重试'
    } finally {
      if (active) busy.value = false
    }
  }
  const authorize = () =>
    action(async () => {
      const attempt = await startAuthorization()
      if (active)
        window.location.assign(
          authorizationDestination(
            attempt.authorization_url,
            window.location.origin,
            (import.meta.env.VITE_TIKTOK_AUTH_HOSTS || '')
              .split(',')
              .map((host: string) => host.trim())
              .filter(Boolean),
            __MOCK_ENABLED__,
          ),
        )
    })
  const disconnect = (id: string) =>
    action(async () => {
      try {
        await ElMessageBox.confirm(
          '解除后将停止此授权的数据采集，历史数据仍保留。确认解除授权？',
          '解除授权',
          { confirmButtonText: '确认解除', cancelButtonText: '取消', type: 'warning' },
        )
      } catch {
        return
      }
      await disconnectAuthorization(id)
      if (active) await load()
    })
  const exportReport = () =>
    action(async () => {
      await createExport({
        kind: section.value === 'realtime' ? 'realtime' : 'daily',
        dimension: dimension.value,
        filters: {
          ...appliedFilters,
          ...(report.value?.snapshot_id ? { snapshot_id: report.value.snapshot_id } : {}),
        },
      })
      if (active) notice.value = '导出任务已创建，请前往下载记录。'
    })
  const search = () => {
    page.value = 1
    void load()
  }
  const changePage = (offset: number) => {
    page.value += offset
    void load(true)
  }
  watch(
    () => route.path,
    () => {
      keyword.value = ''
      authorizationId.value = ''
      authorizationUsers.value = []
      dateRange.value = recentDateRange()
      page.value = 1
      dimension.value = 'accounts'
      rows.value = []
      report.value = null
      sync.value = null
      notice.value = ''
      void load()
    },
    { immediate: true },
  )
  onScopeDispose(() => {
    active = false
    generation++
  })
  return {
    section,
    isReport,
    rows,
    report,
    sync,
    loading,
    busy,
    error,
    notice,
    keyword,
    authorizationId,
    authorizationUsers,
    dateRange,
    dimension,
    page,
    total,
    pageSize,
    load,
    search,
    changePage,
    authorize,
    disconnect,
    exportReport,
  }
}
