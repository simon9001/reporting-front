import { addDays, daysBetween, fromDateString, toDateString } from '@sr/shared'
import type { Period } from '../../lib/periods'

const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
export const weekLabel = (weekStart: string) => `Wk ${ddmm(weekStart)}`
export const bucketLabel = (bucket: string, granularity: 'day' | 'week') => (granularity === 'day' ? ddmm(bucket) : weekLabel(bucket))
export const drillRange = (bucket: string, granularity: 'day' | 'week'): Period =>
  granularity === 'day' ? { from: bucket, to: bucket } : { from: bucket, to: addDays(bucket, 6) }

export function explorerLink(period: Period, extra: Record<string, string> = {}): string {
  return `/incidents?${new URLSearchParams({ from: period.from, to: period.to, ...extra }).toString()}`
}

const isYmd = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && toDateString(fromDateString(s)) === s

/** Validates a URL period like the backend schema (valid dates, from <= to, at most 366 days); falls back otherwise. */
export function resolvePeriod(from: string | null | undefined, to: string | null | undefined, fallback: Period): { period: Period; invalid: boolean } {
  if (!from && !to) return { period: fallback, invalid: false }
  if (isYmd(from) && isYmd(to) && from <= to && daysBetween(from, to) <= 366) return { period: { from, to }, invalid: false }
  return { period: fallback, invalid: true }
}

/** Intersects a clicked bucket's range with the selected period so drill-down never shows incidents outside it. */
export function clampRange(range: Period, period: Period): Period {
  return { from: range.from > period.from ? range.from : period.from, to: range.to < period.to ? range.to : period.to }
}
