import { describe, expect, it } from 'vitest'
import { fromWallTimeInput, toWallTimeInput } from './zoned'

describe('wall-clock time in the business time zone', () => {
  it('converts an instant to a datetime-local value in Nairobi', () => {
    expect(toWallTimeInput('2026-09-29T22:15:00.000Z')).toBe('2026-09-30T01:15')
  })
  it('converts a datetime-local value back to the right instant', () => {
    expect(fromWallTimeInput('2026-09-30T01:15')).toBe('2026-09-29T22:15:00.000Z')
    expect(fromWallTimeInput('')).toBe('')
    expect(fromWallTimeInput('2026-01-01T00:00', 'UTC')).toBe('2026-01-01T00:00:00.000Z')
  })
})
