import type { Role } from '@sr/shared'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Alert, Button, Spinner } from '../components/ui'
import { ApiError, errorMessage } from '../lib/api'
import { useMe } from './hooks'

export function homePathFor(role: Role): string {
  if (role === 'OFFICER') return '/my-shift'
  if (role === 'DEPUTY_DIRECTOR') return '/dashboard'
  return '/admin/users'
}

export function RequireAuth() {
  const me = useMe()
  const location = useLocation()
  if (me.isPending) return <Spinner />
  if (me.isError) {
    if (me.error instanceof ApiError && me.error.status === 401) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }
    return (
      <div className="mx-auto max-w-md space-y-3 p-6">
        <Alert>{errorMessage(me.error)}</Alert>
        <Button onClick={() => me.refetch()}>Try again</Button>
      </div>
    )
  }
  if (me.data.user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }
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
