import { describe, expect, it } from 'vitest'
import { explorerQuery, hasActiveFilters } from './explorerQuery'

describe('explorer query', () => {
  it('maps URL values to the API query with defaults', () => {
    expect(explorerQuery({ q: 'wb04', severity: 'HIGH,CRITICAL', page: '2', open: 'INC-2026-0001' })).toEqual({
      q: 'wb04', severity: 'HIGH,CRITICAL', sort: '-occurredAt', page: 2, pageSize: 25,
      from: undefined, to: undefined, status: undefined, categoryId: undefined, locationId: undefined,
      shiftCode: undefined, shiftId: undefined, hasAttachments: undefined,
    })
  })
  it('knows when filters are active (ignoring sort, page and the open drawer)', () => {
    expect(hasActiveFilters({ sort: 'ref', page: '3', open: 'INC-1' })).toBe(false)
    expect(hasActiveFilters({ status: 'OPEN' })).toBe(true)
  })
})
