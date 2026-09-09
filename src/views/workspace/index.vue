<template>
  <section>
    <p class="eyebrow">YOUR WORKSPACE</p>
    <div class="page-heading">
      <div>
        <h1>{{ route.meta.title }}</h1>
        <p class="description">{{ route.meta.description }}</p>
      </div>
      <el-button :loading="loading" @click="load()">刷新数据</el-button>
    </div>
    <el-alert
      v-if="mockEnabled"
      title="当前为 Mock 演示环境，以下均为模拟数据；实时查询读取最近一次 10 分钟快照。"
      type="warning"
      :closable="false"
      show-icon
    />
    <div v-if="report" class="metrics">
      <article>
        <span
          >{{ section === 'realtime' ? '今日累计消耗' : '期间消耗' }} ·
          {{ report.summary.currency }}</span
        ><strong>{{ report.summary.spend }}</strong>
      </article>
      <article>
        <span>展示次数</span><strong>{{ report.summary.impressions.toLocaleString() }}</strong>
      </article>
      <article>
        <span>点击次数</span><strong>{{ report.summary.clicks.toLocaleString() }}</strong>
      </article>
    </div>
    <div class="data-panel">
      <div class="toolbar">
        <form v-if="section === 'accounts' || isReport" class="filters" @submit.prevent="search">
          <el-input v-model="keyword" aria-label="搜索账户" placeholder="搜索账户名称" clearable />
          <label
            >授权用户名
            <select v-model="authorizationId" :disabled="loading" @change="search">
              <option value="">全部授权用户</option>
              <option v-for="user in authorizationUsers" :key="user.id" :value="user.id">
                {{ user.username
                }}{{
                  authorizationUsers.filter((item) => item.username === user.username).length > 1
                    ? ` (${user.id})`
                    : ''
                }}{{ user.status === 'disconnected' ? ' · 已断开' : '' }}
              </option>
            </select>
          </label>
          <ReportDateRange v-if="section === 'daily'" v-model="dateRange" @change="search" />
          <label v-if="isReport"
            >维度
            <select v-model="dimension" @change="search">
              <option value="accounts">广告账户</option>
              <option value="campaigns">广告计划</option>
            </select></label
          >
          <el-button native-type="submit" :disabled="loading">查询</el-button>
        </form>
        <span v-else class="panel-title">{{
          section === 'authorizations' ? '企业授权' : '导出任务'
        }}</span>
        <el-button
          v-if="section === 'authorizations' && can('authorizations:write')"
          type="primary"
          :loading="busy"
          @click="authorize"
          >{{ mockEnabled ? '模拟 TikTok 授权' : '添加 TikTok 授权' }}</el-button
        >
        <el-button
          v-if="isReport && can('exports:write')"
          type="primary"
          :loading="busy"
          :disabled="loading || !report || !total"
          @click="exportReport"
          >导出报表</el-button
        >
      </div>
      <p v-if="error" class="feedback error" role="alert">{{ error }}</p>
      <p v-if="notice" class="feedback" role="status">
        {{ notice }} <router-link to="/portal/downloads">查看下载 →</router-link>
      </p>
      <div class="table-scroll" :aria-busy="loading">
        <table>
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
              <th
                v-if="
                  section === 'downloads' ||
                  (section === 'authorizations' && can('authorizations:write'))
                "
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="columns.length + 1" class="empty">正在加载数据…</td>
            </tr>
            <template v-else>
              <tr v-for="row in rows" :key="row.id">
                <td v-for="column in columns" :key="column.key">
                  <span :class="{ status: column.key === 'status' }">{{
                    cell(row, column.key)
                  }}</span>
                </td>
                <td v-if="section === 'authorizations' && can('authorizations:write')">
                  <el-button
                    text
                    :disabled="busy || ('status' in row && row.status === 'disconnected')"
                    @click="disconnect(row.id)"
                    >解除授权</el-button
                  >
                </td>
                <td v-if="section === 'downloads'">
                  <a class="download" :href="exportDownloadUrl(row.id)">下载文件 ↗</a>
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td :colspan="columns.length + 1" class="empty">
                  {{
                    error
                      ? '暂时无法显示数据'
                      : section === 'downloads'
                        ? '暂无导出任务，可在每日消耗或实时数据中导出。'
                        : '暂无符合条件的数据'
                  }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span>共 {{ total }} 条记录 · {{ auth.session?.company.name }}</span>
        <div v-if="section === 'accounts' || isReport">
          <el-button size="small" :disabled="page <= 1 || loading" @click="changePage(-1)"
            >上一页</el-button
          ><span class="page">{{ page }}</span
          ><el-button
            size="small"
            :disabled="page * pageSize >= total || loading"
            @click="changePage(1)"
            >下一页</el-button
          >
        </div>
      </div>
    </div>
    <p v-if="sync" class="sync-note">
      数据更新时间：{{ formatTime(report?.data_updated_at || sync.data_updated_at) }} · 时区
      Asia/Shanghai<span v-if="section === 'realtime'">
        · 自动同步间隔 {{ sync.interval_minutes }} 分钟，刷新只查询最新快照</span
      ><span v-if="sync.status === 'authorization_required'"> · 授权已断开，请重新授权</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { exportDownloadUrl } from '@/api/portal'
import { useWorkspace } from './composables/useWorkspace'
import ReportDateRange from './components/ReportDateRange.vue'
const route = useRoute()
const auth = useAuthStore()
const mockEnabled = __MOCK_ENABLED__
const can = (permission: string) => auth.session?.permissions.includes(permission)
const {
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
} = useWorkspace()
const columns = computed(() => {
  const fields =
    section.value === 'authorizations'
      ? [
          ['name', '授权主体'],
          ['username', '授权用户名'],
          ['status', '授权状态'],
          ['authorized_at', '授权时间'],
        ]
      : section.value === 'accounts'
        ? [
            ['name', '广告账户'],
            ['id', '账户 ID'],
            ['authorization_username', '授权用户名'],
            ['status', '投放状态'],
            ['currency', '币种'],
            ['timezone', '时区'],
          ]
        : section.value === 'downloads'
          ? [
              ['name', '文件名称'],
              ['status', '任务状态'],
              ['created_at', '创建时间'],
            ]
          : [
              ['name', dimension.value === 'accounts' ? '广告账户' : '广告计划'],
              ['authorization_username', '授权用户名'],
              ['date', '数据日期'],
              ['spend', '消耗 (USD)'],
              ['impressions', '展示'],
              ['clicks', '点击'],
            ]
  return fields.map(([key, label]) => ({ key: key!, label: label! }))
})
function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
}
function cell(row: object, key: string) {
  const value = String((row as Record<string, unknown>)[key] ?? '—')
  if (key.endsWith('_at')) return formatTime(value)
  return (
    (
      {
        authorized: '已授权',
        disconnected: '已断开',
        active: '投放中',
        paused: '已暂停',
        completed: '已完成',
      } as Record<string, string>
    )[value] || value
  )
}
</script>

<style scoped>
.eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: #85a392;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}
h1 {
  font-size: 27px;
  margin: 14px 0;
  font-weight: 600;
}
.description,
.sync-note {
  color: #758a7d;
  font-size: 12px;
  line-height: 1.8;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 24px;
}
.metrics article {
  background: white;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 24px;
}
.metrics span {
  display: block;
  font-size: 12px;
  color: #789183;
}
.metrics strong {
  display: block;
  margin-top: 16px;
  font-size: 28px;
  font-weight: 600;
  color: #245a47;
  font-variant-numeric: tabular-nums;
}
.data-panel {
  margin-top: 24px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
}
.toolbar {
  padding: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.panel-title {
  font-weight: 600;
  font-size: 14px;
}
.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.filters .el-input {
  width: 190px;
}
.filters label {
  font-size: 12px;
  color: #728478;
}
input,
select {
  min-height: 32px;
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 0 8px;
  color: #405d4b;
  background: white;
}
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
  font-size: 12px;
}
th {
  background: #f6f9f7;
  color: #7c8e82;
  font-weight: 500;
  padding: 16px 22px;
}
td {
  border-bottom: 1px solid #f0f4f1;
  padding: 18px 22px;
  color: #465e50;
  font-variant-numeric: tabular-nums;
}
.status {
  border-radius: 5px;
  padding: 5px 8px;
  background: #edf5f0;
  color: #43826a;
}
.empty {
  text-align: center;
  padding: 70px 20px;
  color: #91a296;
}
.table-footer {
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  color: #8a9c90;
  font-size: 11px;
}
.page {
  margin: 0 12px;
}
.download,
.feedback {
  color: var(--brand);
}
.feedback {
  padding: 0 22px;
  font-size: 12px;
}
.error {
  color: #b54b3c;
}
.sync-note {
  margin-top: 20px;
}
@media (max-width: 760px) {
  .metrics {
    gap: 8px;
  }
  .metrics article {
    padding: 14px 10px;
  }
  .metrics strong {
    font-size: 20px;
  }
  .metrics span {
    font-size: 10px;
  }
  .toolbar {
    padding: 16px;
  }
}
</style>
