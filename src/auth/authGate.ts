import { ApiError } from '../lib/api'

export type AuthGate = 'loading' | 'login' | 'error' | 'change-password' | 'ok'

export function authGateDecision(input: {
  isPending: boolean
  error: unknown
  hasData: boolean
  mustChangePassword: boolean
  pathname: string
}): AuthGate {
  const { isPending, error, hasData, mustChangePassword, pathname } = input
  if (isPending) return 'loading'
  if (error instanceof ApiError && error.status === 401) return 'login'
  if (error && !hasData) return 'error'
  if (hasData && mustChangePassword && pathname !== '/change-password') return 'change-password'
  return 'ok'
}
