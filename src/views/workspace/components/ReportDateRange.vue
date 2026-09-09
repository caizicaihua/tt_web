<template>
  <div class="date-filter">
    <span id="report-date-label" class="filter-label">日期范围</span>
    <el-config-provider :locale="zhCn">
      <el-date-picker
        v-model="range"
        type="daterange"
        format="YYYY / MM / DD"
        value-format="YYYY-MM-DD"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :clearable="false"
        :shortcuts="shortcuts"
        :disabled-date="disabledDate"
        :editable="false"
        popper-class="report-date-popper"
        class="report-date-input"
        aria-labelledby="report-date-label"
        @change="$emit('change')"
      />
    </el-config-provider>
  </div>
</template>
<script setup lang="ts">
import { ElConfigProvider, ElDatePicker } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn.mjs'
import 'element-plus/es/components/date-picker/style/css.mjs'
import { recentDateRange, shanghaiToday, shiftDate } from '@/utils/dateRange'
import type { DateRange } from '@/utils/dateRange'
const range = defineModel<DateRange>({ required: true })
defineEmits<{ change: [] }>()
const localDate = (date: string) => new Date(`${date}T00:00:00`)
const shortcuts = [
  { text: '今天', value: () => recentDateRange(1).map(localDate) },
  {
    text: '昨天',
    value: () => {
      const date = localDate(shiftDate(shanghaiToday(), -1))
      return [date, date]
    },
  },
  { text: '最近 7 天', value: () => recentDateRange(7).map(localDate) },
  { text: '最近 30 天', value: () => recentDateRange(30).map(localDate) },
  {
    text: '本月',
    value: () => {
      const today = shanghaiToday()
      return [localDate(`${today.slice(0, 7)}-01`), localDate(today)]
    },
  },
]
function disabledDate(date: Date) {
  const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return label > shanghaiToday()
}
</script>
<style scoped>
.date-filter {
  display: flex;
  align-items: center;
  gap: 9px;
}
.filter-label {
  font-size: 12px;
  color: #728478;
  white-space: nowrap;
}
.date-filter :deep(.report-date-input) {
  width: 284px;
  height: 38px;
  flex: none;
  border-radius: 9px;
  background: #f8fbf9;
  box-shadow: 0 0 0 1px #dce7e0 inset;
}
.date-filter :deep(.report-date-input.is-active) {
  box-shadow:
    0 0 0 1px var(--brand) inset,
    0 0 0 3px #087f6810;
}
.date-filter :deep(.el-range-input) {
  font-size: 12px;
  color: #355d49;
}
.date-filter :deep(.el-range-separator) {
  font-size: 11px;
  color: #8da393;
}
.date-filter :deep(.el-range__icon) {
  color: var(--brand);
}
@media (max-width: 480px) {
  .date-filter {
    width: 100%;
    flex-wrap: wrap;
  }
  .date-filter :deep(.report-date-input) {
    width: 100%;
  }
}
</style>
<style>
.report-date-popper.el-popper {
  border-radius: 14px;
  border: 1px solid #e0e9e3;
  box-shadow: 0 12px 40px #2347321a;
  overflow: hidden;
}
.report-date-popper .el-picker-panel__sidebar {
  background: #f6faf7;
  padding-top: 16px;
}
.report-date-popper .el-picker-panel__shortcut {
  color: #567463;
  font-size: 12px;
  line-height: 36px;
}
.report-date-popper .el-picker-panel__shortcut:hover {
  background: #e8f3ed;
  color: var(--brand);
}
@media (max-width: 760px) {
  .report-date-popper .el-date-range-picker {
    width: min(360px, calc(100vw - 24px));
  }
  .report-date-popper .el-picker-panel__sidebar {
    position: static;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    padding: 8px;
    border-bottom: 1px solid #e0e9e3;
  }
  .report-date-popper .el-picker-panel__shortcut {
    width: auto;
    padding: 0 10px;
  }
  .report-date-popper .el-picker-panel__sidebar + .el-picker-panel__body {
    margin-left: 0;
  }
  .report-date-popper .el-date-range-picker__content {
    display: block;
    width: 100%;
    padding: 12px;
  }
  .report-date-popper .el-date-range-picker__content.is-left {
    border-right: 0;
    border-bottom: 1px solid #e0e9e3;
  }
  .report-date-popper .el-picker-panel__body {
    min-width: 0;
    max-height: 65vh;
    overflow-y: auto;
  }
}
</style>
