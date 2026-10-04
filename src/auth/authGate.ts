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

/** What to remember when a signed-out visit is sent to /login: the page and its filters. */
export function redirectFrom(location: { pathname: string; search: string }): string {
  return location.pathname + location.search
}

/** Where to go after signing in: the remembered in-app page, never /login itself or another origin. */
export function loginRedirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return '/'
  const path = from.split(/[?#]/)[0]
  if (path === '/login' || path.startsWith('/login/')) return '/'
  return from
}
