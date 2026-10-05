import { incidentQuerySchema } from '@sr/shared'
import { describe, expect, it } from 'vitest'
import { sideCountQuery } from './sideCounts'

describe('My Shift side counts', () => {
  it('sends a query the incident API accepts', () => {
    for (const side of ['STATIC', 'MOBILE'] as const) {
      const wire = Object.fromEntries(Object.entries(sideCountQuery(7, side)).map(([k, v]) => [k, String(v)]))
      expect(incidentQuerySchema.safeParse(wire).success).toBe(true)
    }
  })
})
