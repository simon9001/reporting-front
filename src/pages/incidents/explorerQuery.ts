import type { FilterValues } from '../../lib/urlFilters'

export const EXPLORER_KEYS = ['q', 'from', 'to', 'severity', 'status', 'categoryId', 'locationId', 'shiftCode', 'shiftId', 'hasAttachments', 'sort', 'page', 'open'] as const
const FILTER_KEYS = ['q', 'from', 'to', 'severity', 'status', 'categoryId', 'locationId', 'shiftCode', 'shiftId', 'hasAttachments'] as const

export function explorerQuery(v: FilterValues) {
  return {
    q: v.q,
    from: v.from,
    to: v.to,
    severity: v.severity,
    status: v.status,
    categoryId: v.categoryId,
    locationId: v.locationId,
    shiftCode: v.shiftCode,
    shiftId: v.shiftId,
    hasAttachments: v.hasAttachments,
    sort: v.sort ?? '-occurredAt',
    page: Number(v.page ?? 1) || 1,
    pageSize: 25,
  }
}

export const hasActiveFilters = (v: FilterValues) => FILTER_KEYS.some((k) => !!v[k])
