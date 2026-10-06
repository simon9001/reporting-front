import { describe, expect, it } from 'vitest'
import { SIDE_COLORS } from './badges'
import { STAT_TONES } from './statTone'

describe('KPI tile tones', () => {
  it('keeps text readable: charcoal ink on yellow, highway-yellow value on charcoal, white on red and blue', () => {
    expect(STAT_TONES.yellow.box).toContain('bg-highway-400')
    expect(STAT_TONES.yellow.value).toBe('text-asphalt-900')
    expect(STAT_TONES.charcoal.box).toContain('bg-asphalt-800')
    expect(STAT_TONES.charcoal.value).toBe('text-highway-400')
    expect(STAT_TONES.red.value).toBe('text-white')
    expect(STAT_TONES.blue.box).toContain('bg-static')
  })
  it('keeps 12px muted text fully white on red and blue for AA contrast', () => {
    expect(STAT_TONES.red.muted).toBe('text-white')
    expect(STAT_TONES.blue.muted).toBe('text-white')
  })
  it('never puts yellow text on a light tile', () => {
    for (const tone of ['plain', 'red', 'blue'] as const) {
      expect(STAT_TONES[tone].value).not.toMatch(/highway|brand-(1|2|3|5)00/)
    }
  })
  it('colours the weighbridge sides with the validated blue/gold pair', () => {
    expect(SIDE_COLORS).toEqual({ STATIC: '#2563eb', MOBILE: '#b98a00' })
  })
})
