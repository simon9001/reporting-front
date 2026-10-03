import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, buildUrl } from './api'

afterEach(() => vi.unstubAllGlobals())

describe('api client', () => {
  it('builds URLs and skips empty query values', () => {
    expect(buildUrl('/roster', { from: '2026-10-01', to: undefined, active: true, q: '' })).toBe('/api/roster?from=2026-10-01&active=true')
  })

  it('sends JSON and parses the response', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(api('/x', { method: 'POST', body: { a: 1 } })).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/x', expect.objectContaining({ method: 'POST', body: '{"a":1}' }))
  })

  it('throws ApiError with code and field errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'CONFLICT', message: 'Taken', fields: { email: 'In use' } } }), { status: 409 })))
    const err = await api('/users').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 409, code: 'CONFLICT', message: 'Taken', fields: { email: 'In use' } })
  })

  it('returns undefined for 204 and reports network failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))
    await expect(api('/auth/logout', { method: 'POST' })).resolves.toBeUndefined()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    await expect(api('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK' })
  })
})
