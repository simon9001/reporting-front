import { ROLE_LABELS } from '@sr/shared'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useLogout, useMe } from '../auth/hooks'
import { Badge, Button, cx } from '../components/ui'
import { formatDate } from '../lib/format'
import { navFor } from './nav'

export function AppShell() {
  const { data } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  if (!data) return null
  const { user, currentShift } = data

  const signOut = async () => {
    await logout.mutateAsync().catch(() => undefined)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-full md:flex">
      <aside className={cx('bg-brand-800 text-white md:block md:w-60 md:shrink-0', menuOpen ? 'block' : 'hidden')}>
        <div className="px-4 py-4 text-sm font-semibold">Control Room Reporting</div>
        <nav className="space-y-1 px-2 pb-4">
          {navFor(user.role).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => cx('block rounded-md px-3 py-2 text-sm', isActive ? 'bg-white/15 font-medium' : 'text-white/80 hover:bg-white/10')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button type="button" className="rounded-md px-2 py-1 text-slate-700 md:hidden" aria-label="Toggle menu" onClick={() => setMenuOpen((o) => !o)}>☰</button>
          <div className="min-w-0 truncate text-sm text-slate-600">
            {currentShift && (
              <span>
                {currentShift.shiftName} shift · {formatDate(currentShift.shiftDate)}{' '}
                {currentShift.myRole && <Badge tone="blue">{currentShift.myRole === 'SUPERVISOR' ? 'Supervisor' : 'Officer'}</Badge>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-700 sm:inline">{user.fullName} · {ROLE_LABELS[user.role]}</span>
            <Button variant="secondary" onClick={signOut}>Sign out</Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
