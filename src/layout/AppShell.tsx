import { Menu, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useLogout, useMe } from '../auth/hooks'
import { Badge, cx, Kbd } from '../components/ui'
import { formatDate } from '../lib/format'
import { LiveIndicator } from '../live/LiveIndicator'
import { LiveProvider } from '../live/LiveProvider'
import { CommandPalette } from './CommandPalette'
import { navFor } from './nav'
import { UserMenu } from './UserMenu'

export function AppShell() {
  const { data } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (!data) return null
  const { user, currentShift } = data
  const signOut = async () => {
    await logout.mutateAsync().catch(() => undefined)
    navigate('/login', { replace: true })
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 px-3 py-4" aria-label="Main">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white"><ShieldCheck className="size-4" /></span>
        <span className="text-sm font-semibold text-slate-900">Control Room</span>
      </div>
      {navFor(user.role).map((group, gi) => (
        <div key={gi} className="space-y-0.5">
          {group.label && <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>}
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => cx('flex items-center gap-2.5 rounded-md px-3 py-2 text-sm', isActive ? 'bg-brand-100 font-semibold text-brand-700' : 'text-slate-600 hover:bg-white hover:text-slate-900')}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )

  return (
    <LiveProvider>
      <div className="min-h-full lg:flex">
        <aside className="hidden w-60 shrink-0 border-r border-line bg-[#f8fafb] lg:block">{sidebar}</aside>
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMenuOpen(false)} aria-hidden />
            <aside className="relative h-full w-64 bg-[#f8fafb] shadow-xl">{sidebar}</aside>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur">
            <button type="button" className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu className="size-5" /></button>
            <button type="button" onClick={() => setSearchOpen(true)} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 hover:bg-white sm:max-w-sm">
              <Search className="size-4" aria-hidden />
              <span className="truncate">Search incidents, pages…</span>
              <span className="ml-auto hidden sm:inline"><Kbd>Ctrl K</Kbd></span>
            </button>
            <div className="ml-auto flex items-center gap-3">
              {currentShift && (
                <span className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex">
                  {currentShift.shiftName} shift · {formatDate(currentShift.shiftDate)}
                  {currentShift.myRole && <Badge tone="blue">{currentShift.myRole === 'SUPERVISOR' ? 'Supervisor' : 'Officer'}</Badge>}
                </span>
              )}
              <LiveIndicator />
              <UserMenu user={user} onSignOut={signOut} />
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} role={user.role} />}
    </LiveProvider>
  )
}
