import { describe, expect, it } from 'vitest'
import { bucketLabel, clampRange, dayNightLink, drillRange, explorerLink, resolvePeriod, weekLabel } from './chartData'

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
  it('clamps a week bucket to the selected period', () => {
    const period = { from: '2026-09-30', to: '2026-10-02' }
    expect(clampRange(drillRange('2026-09-28', 'week'), period)).toEqual({ from: '2026-09-30', to: '2026-10-02' })
    expect(clampRange(drillRange('2026-09-30', 'day'), period)).toEqual({ from: '2026-09-30', to: '2026-09-30' })
    expect(clampRange({ from: '2026-09-28', to: '2026-10-04' }, { from: '2026-09-01', to: '2026-10-31' })).toEqual({ from: '2026-09-28', to: '2026-10-04' })
  })
  it('drills a Day-vs-Night bar into its week, clamped to the period, for that shift only', () => {
    const period = { from: '2026-09-30', to: '2026-10-31' }
    expect(dayNightLink('2026-09-28', 'NIGHT', period)).toBe('/incidents?from=2026-09-30&to=2026-10-04&shiftCode=NIGHT')
    expect(dayNightLink('2026-10-26', 'DAY', period)).toBe('/incidents?from=2026-10-26&to=2026-10-31&shiftCode=DAY')
    expect(dayNightLink('2026-10-05', 'DAY', period)).toBe('/incidents?from=2026-10-05&to=2026-10-11&shiftCode=DAY')
  })
  it('validates the URL period like the backend', () => {
    const fb = { from: '2026-10-01', to: '2026-10-31' }
    expect(resolvePeriod(undefined, undefined, fb)).toEqual({ period: fb, invalid: false })
    expect(resolvePeriod('2026-01-01', '2026-01-31', fb)).toEqual({ period: { from: '2026-01-01', to: '2026-01-31' }, invalid: false })
    expect(resolvePeriod('2026-01-31', '2026-01-01', fb)).toEqual({ period: fb, invalid: true })
    expect(resolvePeriod('2026-01-01', null, fb)).toEqual({ period: fb, invalid: true })
    expect(resolvePeriod('2026-02-30', '2026-03-01', fb).invalid).toBe(true)
    expect(resolvePeriod('banana', '2026-03-01', fb).invalid).toBe(true)
    expect(resolvePeriod('2025-01-01', '2026-01-03', fb).invalid).toBe(true)
    expect(resolvePeriod('2025-01-01', '2026-01-02', fb).invalid).toBe(false)
  })
})
