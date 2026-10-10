import { describe, expect, it } from 'vitest'
import { isBelow, isCompact, shellMode } from './breakpoints'

describe('breakpoints', () => {
  it('compares widths against Tailwind breakpoints (min-width semantics)', () => {
    expect(isBelow(767, 'md')).toBe(true)
    expect(isBelow(768, 'md')).toBe(false)
    expect(isBelow(1919, '3xl')).toBe(true)
    expect(isBelow(1920, '3xl')).toBe(false)
  })
  it('treats widths below md as compact (stacked rows)', () => {
    expect(isCompact(390)).toBe(true)
    expect(isCompact(768)).toBe(false)
  })
  it('picks the app frame mode: phone < 640 ≤ rail < 1024 ≤ full', () => {
    expect([360, 639, 640, 1023, 1024, 2560].map(shellMode)).toEqual(['phone', 'phone', 'rail', 'rail', 'full', 'full'])
  })
})
