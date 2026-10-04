import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/api'
import { authGateDecision, loginRedirectTarget, redirectFrom } from './authGate'

const base = { isPending: false, error: null, hasData: true, mustChangePassword: false, pathname: '/my-shift' }

describe('authGateDecision', () => {
  it('shows loading while pending', () => {
    expect(authGateDecision({ ...base, isPending: true, hasData: false })).toBe('loading')
  })
  it('redirects to login on 401 even with cached data', () => {
    expect(authGateDecision({ ...base, error: new ApiError(401, 'UNAUTHENTICATED', 'x') })).toBe('login')
  })
  it('keeps the page on a network error when data exists', () => {
    expect(authGateDecision({ ...base, error: new ApiError(0, 'NETWORK', 'x') })).toBe('ok')
  })
  it('shows the error screen when there is no data', () => {
    expect(authGateDecision({ ...base, hasData: false, error: new ApiError(0, 'NETWORK', 'x') })).toBe('error')
  })
  it('forces password change except on the change-password page', () => {
    expect(authGateDecision({ ...base, mustChangePassword: true })).toBe('change-password')
    expect(authGateDecision({ ...base, mustChangePassword: true, pathname: '/change-password' })).toBe('ok')
  })
})

describe('login redirect', () => {
  it('remembers the path and query string of the page that needed a session', () => {
    expect(redirectFrom({ pathname: '/incidents', search: '?severity=HIGH&open=INC-2026-0001' })).toBe('/incidents?severity=HIGH&open=INC-2026-0001')
    expect(redirectFrom({ pathname: '/dashboard', search: '' })).toBe('/dashboard')
  })
  it('returns to the remembered page after sign-in, keeping the query', () => {
    expect(loginRedirectTarget({ from: '/incidents?status=OPEN&page=2' })).toBe('/incidents?status=OPEN&page=2')
  })
  it('never loops back to the login page and ignores missing or foreign targets', () => {
    expect(loginRedirectTarget({ from: '/login' })).toBe('/')
    expect(loginRedirectTarget({ from: '/login?x=1' })).toBe('/')
    expect(loginRedirectTarget(null)).toBe('/')
    expect(loginRedirectTarget({ from: 42 })).toBe('/')
    expect(loginRedirectTarget({ from: '//evil.example/path' })).toBe('/')
    expect(loginRedirectTarget({ from: 'https://evil.example' })).toBe('/')
  })
})
