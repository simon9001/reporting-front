import { describe, expect, it } from 'vitest'
import { clearParams, csvToList, listToCsv, patchParams, readFilters } from './urlFilters'

describe('URL filters', () => {
  it('round-trips filters through the query string so links can be shared', () => {
    const p = patchParams(new URLSearchParams(), { q: 'wb04', severity: listToCsv(['HIGH', 'CRITICAL']), from: '2026-08-30', to: '2026-08-30' })
    const again = new URLSearchParams(p.toString())
    expect(readFilters(again, ['q', 'severity', 'from', 'to', 'status'])).toEqual({ q: 'wb04', severity: 'HIGH,CRITICAL', from: '2026-08-30', to: '2026-08-30', status: undefined })
    expect(csvToList(readFilters(again, ['severity']).severity)).toEqual(['HIGH', 'CRITICAL'])
  })
  it('removes empty values and resets the page when a filter changes', () => {
    const start = new URLSearchParams('q=x&page=3&status=OPEN')
    const next = patchParams(start, { q: '', status: 'RESOLVED' })
    expect(next.toString()).toBe('status=RESOLVED')
    expect(patchParams(start, { page: '4' }).get('page')).toBe('4')
    expect(listToCsv([])).toBeUndefined()
  })
  it('clears only filter keys and the page, keeping sort and open', () => {
    const start = new URLSearchParams('q=x&status=OPEN&page=3&sort=ref&open=INC-1')
    expect(clearParams(start, ['q', 'status']).toString()).toBe('sort=ref&open=INC-1')
  })
})
