import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatDuration, formatTime, greeting, todayLocal } from './format'

describe('format', () => {
  it('shows times in Nairobi time, day/month/year, 24-hour', () => {
    expect(formatDateTime('2026-09-30T14:00:00.000Z')).toBe('30/09/2026 17:00')
    expect(formatTime('2026-09-30T23:15:00.000Z')).toBe('02:15')
    expect(formatDate('2026-09-30')).toBe('30/09/2026')
  })

  it('formats durations', () => {
    expect(formatDuration(-5)).toBe('0m')
    expect(formatDuration(45 * 60_000)).toBe('45m')
    expect(formatDuration(6 * 3_600_000 + 12 * 60_000)).toBe('6h 12m')
  })

  it('gives today in Nairobi', () => {
    expect(todayLocal(new Date('2026-09-30T22:30:00Z'))).toBe('2026-10-01')
  })
})

describe('greeting', () => {
  it('greets by Nairobi time of day', () => {
    expect(greeting(new Date('2026-09-30T05:00:00Z'))).toBe('morning') // 08:00
    expect(greeting(new Date('2026-09-30T11:00:00Z'))).toBe('afternoon') // 14:00
    expect(greeting(new Date('2026-09-30T16:00:00Z'))).toBe('evening') // 19:00
  })
})
