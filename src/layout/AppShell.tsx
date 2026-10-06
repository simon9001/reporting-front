import { LogOut, Menu, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useLogout, useMe } from '../auth/hooks'
import { Badge, cx, Kbd } from '../components/ui'
import { formatDate } from '../lib/format'
import { LiveIndicator } from '../live/LiveIndicator'
import { LiveProvider } from '../live/LiveProvider'
import { CommandPalette } from './CommandPalette'
import { navFor, pageTitleFor } from './nav'
import { UserMenu } from './UserMenu'

export function AppShell() {
  const { data } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const { pathname } = useLocation()
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
    <div className="flex h-full flex-col bg-asphalt-900 text-white">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="rounded-lg bg-white p-1"><img src="/kenha-logo.png" alt="KeNHA" className="h-10 w-auto" /></span>
        <span className="font-display text-base font-semibold leading-tight">Control<br />Room</span>
      </div>
      <div className="mx-5 h-1 rounded-full road-dash opacity-80" aria-hidden />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
        {navFor(user.role).map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.label && <p className="px-3 pb-1 pt-4 text-[11px] font-semibold text-silver-400">{group.label}</p>}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => cx(
                  'relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm transition duration-200',
                  isActive
                    ? 'bg-highway-400 font-semibold text-asphalt-900 before:absolute before:-left-3 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-highway-400 focus-visible:outline-white focus-visible:shadow-[0_0_0_4px_var(--color-asphalt-900)]'
                    : 'text-white/80 hover:bg-asphalt-700 hover:text-white',
                )}
              >
                <item.icon className="size-[18px]" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button type="button" onClick={signOut} className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm text-white/70 transition duration-200 hover:bg-asphalt-700 hover:text-white">
          <LogOut className="size-[18px]" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <LiveProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[10px] focus:bg-highway-400 focus:px-4 focus:py-2 focus:font-semibold focus:text-asphalt-900">
        Skip to content
      </a>
      <div className="min-h-full lg:flex">
        <aside className="hidden w-64 shrink-0 lg:sticky lg:top-0 lg:block lg:h-dvh">{sidebar}</aside>
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-asphalt-900/50" onClick={() => setMenuOpen(false)} aria-hidden />
            <aside className="relative h-full w-72 shadow-2xl">{sidebar}</aside>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-white/95 px-4 shadow-[0_1px_0_var(--color-silver-200)] backdrop-blur md:px-8">
            <button type="button" className="rounded-[10px] p-2 text-asphalt-800 hover:bg-silver-100 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu className="size-5" /></button>
            <p className="hidden font-display text-xl font-semibold text-asphalt-900 xl:block">{pageTitleFor(pathname, user.role)}</p>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mx-auto flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-asphalt-800 px-4 text-sm text-white/60 transition duration-200 hover:bg-asphalt-700 sm:max-w-md"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Search incidents, units, pages…</span>
              <span className="ml-auto hidden sm:inline"><Kbd>Ctrl K</Kbd></span>
            </button>
            <div className="flex items-center gap-3">
              {currentShift && (
                <span className="hidden items-center gap-1.5 rounded-full bg-silver-100 px-3 py-1 text-xs font-medium text-asphalt-800 md:flex">
                  {currentShift.shiftName} shift · {formatDate(currentShift.shiftDate)}
                  {currentShift.myRole && <Badge tone="blue">{currentShift.myRole === 'SUPERVISOR' ? 'Supervisor' : 'Officer'}</Badge>}
                </span>
              )}
              <LiveIndicator />
              <UserMenu user={user} onSignOut={signOut} />
            </div>
          </header>
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-5 outline-none focus-visible:shadow-none md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} role={user.role} />}
    </LiveProvider>
  )
}
