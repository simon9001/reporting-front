import { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { formatEmailList, numberOrNull, parseEmailList, zodFieldErrors } from './forms'

describe('form helpers', () => {
  it('collects the first message per field', () => {
    const r = z.object({ a: z.string().min(2, 'Too short'), b: z.number() }).safeParse({ a: 'x', b: 'y' })
    expect(r.success).toBe(false)
    if (!r.success) expect(zodFieldErrors(r.error)).toMatchObject({ a: 'Too short' })
  })

  it('splits email lists on commas, semicolons and new lines', () => {
    expect(parseEmailList('a@x.co, b@x.co;\n c@x.co \n')).toEqual(['a@x.co', 'b@x.co', 'c@x.co'])
    expect(formatEmailList(['a@x.co', 'b@x.co'])).toBe('a@x.co\nb@x.co')
  })

  it('parses optional numbers', () => {
    expect(numberOrNull('')).toBeNull()
    expect(numberOrNull(' 30 ')).toBe(30)
    expect(Number.isNaN(numberOrNull('abc'))).toBe(true)
  })
})
