import type { FilterValues } from '../../lib/urlFilters'

export const MOBILE_KEYS = ['vehicleId', 'platformId', 'vehicleStatus', 'gpsStatus', 'dashcamStatus'] as const
export const FILTER_KEYS = ['q', 'from', 'to', 'side', 'severity', 'status', 'categoryId', 'locationId', 'shiftCode', 'shiftId', 'hasAttachments', ...MOBILE_KEYS] as const
export const EXPLORER_KEYS = [...FILTER_KEYS, 'sort', 'page', 'open'] as const

export function parsePage(raw: string | undefined): number {
  const n = Math.floor(Number(raw))
  return Number.isFinite(n) && n >= 1 ? n : 1
}

export const lastPage = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize))

export function explorerQuery(v: FilterValues) {
  return {
    q: v.q,
    from: v.from,
    to: v.to,
    side: v.side,
    severity: v.severity,
    status: v.status,
    categoryId: v.categoryId,
    locationId: v.locationId,
    shiftCode: v.shiftCode,
    shiftId: v.shiftId,
    hasAttachments: v.hasAttachments,
    vehicleId: v.vehicleId,
    platformId: v.platformId,
    vehicleStatus: v.vehicleStatus,
    gpsStatus: v.gpsStatus,
    dashcamStatus: v.dashcamStatus,
    sort: v.sort ?? '-occurredAt',
    page: parsePage(v.page),
    pageSize: 25,
  }
}

export const hasActiveFilters = (v: FilterValues) => FILTER_KEYS.some((k) => !!v[k])

/** Changing the side drops the mobile-only filters unless the new side is mobile. */
export function sidePatch(side: string | undefined): Record<string, string | undefined> {
  return side === 'MOBILE' ? { side } : { side, ...Object.fromEntries(MOBILE_KEYS.map((k) => [k, undefined])) }
}
