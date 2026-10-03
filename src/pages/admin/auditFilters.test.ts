import { describe, expect, it } from 'vitest'
import { recordNumberFilter } from './auditFilters'

describe('recordNumberFilter', () => {
  it('accepts positive integers', () => {
    expect(recordNumberFilter('42')).toEqual({ value: '42', invalid: false })
    expect(recordNumberFilter(' 7 ')).toEqual({ value: '7', invalid: false })
  })
  it('treats empty as no filter', () => {
    expect(recordNumberFilter(undefined)).toEqual({ value: undefined, invalid: false })
    expect(recordNumberFilter('  ')).toEqual({ value: undefined, invalid: false })
  })
  it('rejects anything else without sending it', () => {
    for (const bad of ['0', '-3', '4.5', 'abc', '12a']) expect(recordNumberFilter(bad)).toEqual({ value: undefined, invalid: true })
  })
})
