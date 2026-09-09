export type DateRange = [string, string]
export function shanghaiToday(now = Date.now()): string {
  return new Date(now + 8 * 3600000).toISOString().slice(0, 10)
}
export function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10)
}
export function recentDateRange(days = 7, now = Date.now()): DateRange {
  const end = shanghaiToday(now)
  return [shiftDate(end, 1 - days), end]
}
export function dateRangeError(range: unknown, now = Date.now()): string {
  if (!Array.isArray(range) || range.length !== 2) return '请选择开始日期和结束日期'
  if (
    range.some(
      (date) =>
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date,
    )
  )
    return '日期格式应为 YYYY-MM-DD'
  const [start, end] = range as DateRange
  if (start > end) return '开始日期不能晚于结束日期'
  if (end > shanghaiToday(now)) return '不能查询未来日期'
  if ((Date.parse(end) - Date.parse(start)) / 86400000 >= 31)
    return '单次最多查询 31 天，请缩小日期范围'
  return ''
}
