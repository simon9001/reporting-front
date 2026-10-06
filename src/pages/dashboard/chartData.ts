import { addDays, daysBetween, fromDateString, INCIDENT_SIDES, toDateString, type IncidentSide, type MobileHealthDto, type SideStats } from '@sr/shared'
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

export const parseSide = (v: string | undefined): IncidentSide | undefined =>
  (INCIDENT_SIDES as readonly string[]).includes(v ?? '') ? (v as IncidentSide) : undefined

/** Adds the dashboard's side to a drill-down, unless the drill-down already names one. */
export function withSide(extra: Record<string, string>, side?: IncidentSide): Record<string, string> {
  return side && !extra.side ? { ...extra, side } : extra
}

/** Explorer link for one Day-vs-Night bar: that week (clamped to the period), that shift, and the dashboard's side. */
export function dayNightLink(weekStart: string, shiftCode: string, period: Period, side?: IncidentSide): string {
  return explorerLink(clampRange(drillRange(weekStart, 'week'), period), withSide({ shiftCode }, side))
}

export function sideTrendLink(bucket: string, granularity: 'day' | 'week', side: IncidentSide, period: Period): string {
  return explorerLink(clampRange(drillRange(bucket, granularity), period), { side })
}

export function sideSplit(bySide: Record<IncidentSide, SideStats>, pick: (s: SideStats) => number | null, unit = ''): string {
  const f = (v: number | null) => (v === null ? '—' : `${v}${unit}`)
  return `Static ${f(pick(bySide.STATIC))} · Mobile ${f(pick(bySide.MOBILE))}`
}

type HealthKey = Exclude<keyof MobileHealthDto, 'total' | 'platforms'>
export const HEALTH_TILES: { key: HealthKey; label: string; filter: Record<string, string> }[] = [
  { key: 'gpsOffline', label: 'GPS offline', filter: { gpsStatus: 'OFFLINE' } },
  { key: 'dashcamOffline', label: 'Dashcam offline', filter: { dashcamStatus: 'OFFLINE' } },
  { key: 'vehicleOffline', label: 'Vehicle offline', filter: { vehicleStatus: 'OFFLINE' } },
  { key: 'gpsUnknown', label: 'GPS unknown', filter: { gpsStatus: 'UNKNOWN' } },
  { key: 'dashcamUnknown', label: 'Dashcam unknown', filter: { dashcamStatus: 'UNKNOWN' } },
]

const SHIFT_COLORS: Record<string, string> = { DAY: '#0891b2', NIGHT: '#6d28d9' }
/** Day/Night series colours (validated pair); other shift codes get neutral slate. */
export const shiftColor = (code: string): string => SHIFT_COLORS[code] ?? '#64748b'
