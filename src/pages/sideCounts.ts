import type { IncidentSide } from '@sr/shared'

/** Only `total` is read, so the smallest page size the API accepts (25, 50 or 100) is used. */
export const sideCountQuery = (shiftId: number, side: IncidentSide) => ({ shiftId, side, pageSize: 25 })
