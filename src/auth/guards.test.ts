import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/api'
import { authGateDecision } from './authGate'

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
