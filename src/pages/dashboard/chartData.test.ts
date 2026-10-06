import { describe, expect, it } from 'vitest'
import { bucketLabel, clampRange, dayNightLink, drillRange, explorerLink, HEALTH_TILES, parseSide, resolvePeriod, shiftColor, sideSplit, sideTrendLink, weekLabel, withSide } from './chartData'

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
  it('reads the side from the URL and carries it into drill-downs', () => {
    expect(parseSide('MOBILE')).toBe('MOBILE')
    expect(parseSide('BOTH')).toBeUndefined()
    expect(parseSide(undefined)).toBeUndefined()
    expect(withSide({ severity: 'HIGH' }, 'STATIC')).toEqual({ severity: 'HIGH', side: 'STATIC' })
    expect(withSide({ side: 'MOBILE', vehicleId: '7' }, undefined)).toEqual({ side: 'MOBILE', vehicleId: '7' })
    expect(dayNightLink('2026-09-28', 'NIGHT', { from: '2026-09-01', to: '2026-09-30' }, 'MOBILE')).toBe('/incidents?from=2026-09-28&to=2026-09-30&shiftCode=NIGHT&side=MOBILE')
    expect(sideTrendLink('2026-09-28', 'week', 'STATIC', { from: '2026-09-01', to: '2026-09-30' })).toBe('/incidents?from=2026-09-28&to=2026-09-30&side=STATIC')
  })
  it('writes the static/mobile split line for a KPI', () => {
    const bySide = {
      STATIC: { total: 30, avgMinutesToResolve: 42, escalatedOnTimePct: 90, openCriticalHigh: 1 },
      MOBILE: { total: 12, avgMinutesToResolve: null, escalatedOnTimePct: 75, openCriticalHigh: 0 },
    }
    expect(sideSplit(bySide, (s) => s.total)).toBe('Static 30 · Mobile 12')
    expect(sideSplit(bySide, (s) => s.avgMinutesToResolve, ' min')).toBe('Static 42 min · Mobile —')
  })
  it('drills each equipment-health tile into mobile incidents with that status', () => {
    expect(HEALTH_TILES.map((t) => [t.key, t.filter])).toEqual([
      ['gpsOffline', { gpsStatus: 'OFFLINE' }],
      ['dashcamOffline', { dashcamStatus: 'OFFLINE' }],
      ['vehicleOffline', { vehicleStatus: 'OFFLINE' }],
      ['gpsUnknown', { gpsStatus: 'UNKNOWN' }],
      ['dashcamUnknown', { dashcamStatus: 'UNKNOWN' }],
    ])
  })
  it('colours Day and Night with their validated pair and anything else neutral', () => {
    expect(shiftColor('DAY')).toBe('#0891b2')
    expect(shiftColor('NIGHT')).toBe('#6d28d9')
    expect(shiftColor('EVENING')).toBe('#64748b')
  })
})
