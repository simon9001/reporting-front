import { describe, expect, it } from 'vitest'
import { describeDelta } from './deltas'

describe('describeDelta', () => {
  it('shows percent change with a tone that depends on which direction is better', () => {
    expect(describeDelta({ current: 148, previous: 132 }, 'percent', 'lower')).toEqual({ text: '▲ 12%', tone: 'bad' })
    expect(describeDelta({ current: 37, previous: 46 }, 'minutes', 'lower')).toEqual({ text: '▼ 9 min', tone: 'good' })
    expect(describeDelta({ current: 91, previous: 88 }, 'points', 'higher')).toEqual({ text: '▲ 3 pts', tone: 'good' })
  })
  it('rounds minute differences and flags tiny percent changes', () => {
    expect(describeDelta({ current: 37.4, previous: 46 }, 'minutes', 'lower')).toEqual({ text: '▼ 9 min', tone: 'good' })
    expect(describeDelta({ current: 1000, previous: 1001 }, 'percent', 'lower')).toEqual({ text: '▼ <1%', tone: 'good' })
  })
  it('handles missing and unchanged values', () => {
    expect(describeDelta({ current: 5, previous: null }, 'percent', 'lower')).toBeNull()
    expect(describeDelta({ current: 5, previous: 5 }, 'percent', 'lower')).toEqual({ text: 'No change', tone: 'neutral' })
    expect(describeDelta({ current: 5, previous: 0 }, 'percent', 'lower')).toEqual({ text: '▲ new', tone: 'bad' })
  })
})
