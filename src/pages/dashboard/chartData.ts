import { addDays } from '@sr/shared'
import type { Period } from '../../lib/periods'

const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
export const weekLabel = (weekStart: string) => `Wk ${ddmm(weekStart)}`
export const bucketLabel = (bucket: string, granularity: 'day' | 'week') => (granularity === 'day' ? ddmm(bucket) : weekLabel(bucket))
export const drillRange = (bucket: string, granularity: 'day' | 'week'): Period =>
  granularity === 'day' ? { from: bucket, to: bucket } : { from: bucket, to: addDays(bucket, 6) }

export function explorerLink(period: Period, extra: Record<string, string> = {}): string {
  return `/incidents?${new URLSearchParams({ from: period.from, to: period.to, ...extra }).toString()}`
}
