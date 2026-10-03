import type { Role } from '@sr/shared'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Alert, Button, Spinner } from '../components/ui'
import { errorMessage } from '../lib/api'
import { authGateDecision } from './authGate'
import { useMe } from './hooks'

export function homePathFor(role: Role): string {
  if (role === 'OFFICER') return '/my-shift'
  if (role === 'DEPUTY_DIRECTOR') return '/dashboard'
  return '/admin/users'
}

export function RequireAuth() {
  const me = useMe()
  const location = useLocation()
  const gate = authGateDecision({
    isPending: me.isPending,
    error: me.error,
    hasData: me.data !== undefined,
    mustChangePassword: me.data?.user.mustChangePassword ?? false,
    pathname: location.pathname,
  })
  if (gate === 'loading') return <Spinner />
  if (gate === 'login') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (gate === 'error') {
    return (
      <div className="mx-auto max-w-md space-y-3 p-6">
        <Alert>{errorMessage(me.error)}</Alert>
        <Button onClick={() => me.refetch()}>Try again</Button>
      </div>
    )
  }
  if (gate === 'change-password') return <Navigate to="/change-password" replace />
  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { data } = useMe()
  if (!data || !roles.includes(data.user.role)) return <Navigate to="/" replace />
  return <Outlet />
}

export function HomeRedirect() {
  const { data } = useMe()
  return data ? <Navigate to={homePathFor(data.user.role)} replace /> : null
}
