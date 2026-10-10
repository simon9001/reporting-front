import { describe, expect, it } from 'vitest'
import { activeFilterCount, explorerQuery, hasActiveFilters, lastPage, parsePage, sidePatch } from './explorerQuery'

describe('explorer query', () => {
  it('maps URL values to the API query with defaults', () => {
    expect(explorerQuery({ q: 'wb04', severity: 'HIGH,CRITICAL', page: '2', open: 'INC-2026-0001' })).toEqual({
      q: 'wb04', severity: 'HIGH,CRITICAL', sort: '-occurredAt', page: 2, pageSize: 25,
      from: undefined, to: undefined, status: undefined, categoryId: undefined, locationId: undefined,
      shiftCode: undefined, shiftId: undefined, hasAttachments: undefined,
      side: undefined, vehicleId: undefined, platformId: undefined, vehicleStatus: undefined, gpsStatus: undefined, dashcamStatus: undefined,
    })
  })
  it('knows when filters are active (ignoring sort, page and the open drawer)', () => {
    expect(hasActiveFilters({ sort: 'ref', page: '3', open: 'INC-1' })).toBe(false)
    expect(hasActiveFilters({ status: 'OPEN' })).toBe(true)
  })
  it('falls back to page 1 for invalid pages and computes the last page', () => {
    for (const bad of ['abc', '0', '-2', '', undefined]) expect(parsePage(bad)).toBe(1)
    expect(parsePage('4')).toBe(4)
    expect(lastPage(0, 25)).toBe(1)
    expect(lastPage(51, 25)).toBe(3)
  })
  it('passes the side and mobile filters through', () => {
    expect(explorerQuery({ side: 'MOBILE', vehicleId: '7,8', gpsStatus: 'OFFLINE' })).toMatchObject({ side: 'MOBILE', vehicleId: '7,8', gpsStatus: 'OFFLINE' })
    expect(hasActiveFilters({ side: 'STATIC' })).toBe(true)
  })
  it('clears the mobile-only filters when leaving the mobile side', () => {
    expect(sidePatch('STATIC')).toEqual({ side: 'STATIC', vehicleId: undefined, platformId: undefined, vehicleStatus: undefined, gpsStatus: undefined, dashcamStatus: undefined })
    expect(sidePatch(undefined)).toMatchObject({ side: undefined, vehicleId: undefined })
    expect(sidePatch('MOBILE')).toEqual({ side: 'MOBILE' })
  })

  it('counts active filters for the Filters button (search excluded, a date range counts once)', () => {
    expect(activeFilterCount({})).toBe(0)
    expect(activeFilterCount({ q: 'wb04', sort: 'ref', page: '2', open: 'INC-1' })).toBe(0)
    expect(activeFilterCount({ from: '2026-09-01', to: '2026-09-30' })).toBe(1)
    expect(activeFilterCount({ from: '2026-09-01', to: '2026-09-30', severity: 'HIGH', side: 'MOBILE', vehicleId: '3' })).toBe(4)
  })
})
