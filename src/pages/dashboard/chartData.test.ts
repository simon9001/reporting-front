import { describe, expect, it } from 'vitest'
import { bucketLabel, drillRange, explorerLink, weekLabel } from './chartData'

describe('dashboard chart helpers', () => {
  it('labels buckets and works out the range a click drills into', () => {
    expect(bucketLabel('2026-09-30', 'day')).toBe('30/09')
    expect(bucketLabel('2026-09-28', 'week')).toBe('Wk 28/09')
    expect(drillRange('2026-09-30', 'day')).toEqual({ from: '2026-09-30', to: '2026-09-30' })
    expect(drillRange('2026-09-28', 'week')).toEqual({ from: '2026-09-28', to: '2026-10-04' })
    expect(weekLabel('2026-08-31')).toBe('Wk 31/08')
  })
  it('builds explorer links that carry the period and the clicked dimension', () => {
    expect(explorerLink({ from: '2026-09-01', to: '2026-09-30' }, { severity: 'HIGH' })).toBe('/incidents?from=2026-09-01&to=2026-09-30&severity=HIGH')
  })
})
