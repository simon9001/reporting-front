import { describe, expect, it } from 'vitest'
import { detectPreset, periodLabel, presetPeriod } from './periods'

describe('periods', () => {
  const today = '2026-10-15'
  it('computes presets', () => {
    expect(presetPeriod('today', today)).toEqual({ from: today, to: today })
    expect(presetPeriod('7d', today)).toEqual({ from: '2026-10-09', to: today })
    expect(presetPeriod('month', today)).toEqual({ from: '2026-10-01', to: today })
    expect(presetPeriod('lastMonth', today)).toEqual({ from: '2026-09-01', to: '2026-09-30' })
  })
  it('recognises presets and labels custom ranges', () => {
    expect(detectPreset({ from: '2026-09-01', to: '2026-09-30' }, today)).toBe('lastMonth')
    expect(detectPreset({ from: '2026-08-30', to: '2026-08-30' }, today)).toBe('custom')
    expect(periodLabel({ from: '2026-08-30', to: '2026-08-30' }, today)).toBe('30/08/2026')
    expect(periodLabel({ from: '2026-08-01', to: '2026-08-30' }, today)).toBe('01/08/2026 – 30/08/2026')
    expect(periodLabel({ from: '2026-10-01', to: today }, today)).toBe('This month')
  })
})
