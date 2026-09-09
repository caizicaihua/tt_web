import { describe, expect, it } from 'vitest'
import { dateRangeError, recentDateRange, shanghaiToday, shiftDate } from '../src/utils/dateRange'
describe('report date ranges in Shanghai timezone', () => {
  const now = Date.parse('2026-08-31T16:30:00Z')
  it('uses the reporting timezone at the UTC date boundary', () => {
    expect(shanghaiToday(now)).toBe('2026-09-01')
    expect(recentDateRange(7, now)).toEqual(['2026-08-26', '2026-09-01'])
    expect(shiftDate('2024-03-01', -1)).toBe('2024-02-29')
  })
  it('accepts a single day and 31 inclusive days, rejects 32 days and impossible dates', () => {
    expect(dateRangeError(['2026-09-01', '2026-09-01'], now)).toBe('')
    expect(dateRangeError(['2026-08-02', '2026-09-01'], now)).toBe('')
    expect(dateRangeError(['2026-08-01', '2026-09-01'], now)).toContain('31')
    expect(dateRangeError(['2026-02-30', '2026-03-01'], now)).toContain('日期格式')
    expect(dateRangeError(null, now)).toContain('请选择')
  })
})
