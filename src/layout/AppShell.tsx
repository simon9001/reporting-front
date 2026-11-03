import { Menu, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useLogout, useMe } from '../auth/hooks'
import { Badge, IconButton, Kbd } from '../components/ui'
import { formatDate } from '../lib/format'
import { useBelow } from '../lib/useBelow'
import { LiveIndicator } from '../live/LiveIndicator'
import { LiveProvider } from '../live/LiveProvider'
import { CommandPalette } from './CommandPalette'
import { NavOverlay } from './NavOverlay'
import { pageTitleFor } from './nav'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'

export function AppShell() {
  const { data } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const belowLg = useBelow('lg')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Close the menu when the viewport reaches lg or the route changes (adjusting state during render, not in an effect).
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    if (menuOpen) setMenuOpen(false)
  }
  if (!belowLg && menuOpen) setMenuOpen(false)

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
  const closeMenu = () => setMenuOpen(false)
  const title = pageTitleFor(pathname, user.role)

  return (
    <LiveProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-highway-400 focus:px-3 focus:py-1.5 focus:text-[13px] focus:font-semibold focus:text-asphalt-900">
        Skip to content
      </a>
      <div className="min-h-full sm:flex">
        <aside className="hidden w-16 shrink-0 sm:sticky sm:top-0 sm:block sm:h-dvh lg:hidden">
          <Sidebar role={user.role} mode="rail" onSignOut={signOut} onExpand={() => setMenuOpen(true)} expanded={menuOpen} />
        </aside>
        <aside className="hidden w-56 shrink-0 lg:sticky lg:top-0 lg:block lg:h-dvh">
          <Sidebar role={user.role} mode="full" onSignOut={signOut} />
        </aside>
        {/* Derived, not stored: widening past lg hides the overlay instead of showing a second sidebar. */}
        <NavOverlay open={menuOpen && belowLg} onClose={closeMenu}>
          <Sidebar role={user.role} mode="full" onNavigate={closeMenu} onSignOut={signOut} />
        </NavOverlay>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 bg-white/95 px-3 shadow-[0_1px_0_var(--color-silver-200)] backdrop-blur sm:gap-3 md:px-6">
            <IconButton label="Open menu" aria-expanded={menuOpen} className="text-asphalt-800 sm:hidden" onClick={() => setMenuOpen(true)}><Menu /></IconButton>
            <img src="/kenha-logo.png" alt="" className="h-7 w-auto shrink-0 sm:hidden" />
            <p className="min-w-0 truncate font-display text-[15px] font-semibold text-asphalt-900 sm:hidden lg:block lg:shrink-0">{title}</p>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mx-auto hidden h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-asphalt-800 px-3 text-[13px] text-white/60 transition duration-150 hover:bg-asphalt-700 sm:flex sm:max-w-xs md:max-w-md"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="truncate">Search incidents, units, pages…</span>
              <span className="ml-auto hidden md:inline"><Kbd>Ctrl K</Kbd></span>
            </button>
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
              <IconButton label="Search" className="sm:hidden" onClick={() => setSearchOpen(true)}><Search /></IconButton>
              {currentShift && (
                <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-silver-100 px-2.5 py-0.5 text-xs font-medium text-asphalt-800 md:flex">
                  {currentShift.shiftName} shift · {formatDate(currentShift.shiftDate)}
                  {currentShift.myRole && <Badge tone="blue">On duty</Badge>}
                </span>
              )}
              <LiveIndicator />
              <UserMenu user={user} onSignOut={signOut} />
            </div>
          </header>
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[2200px] flex-1 space-y-4 px-4 py-4 outline-none focus-visible:shadow-none md:px-6 md:py-5">
            <Outlet />
          </main>
        </div>
      </div>
      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} role={user.role} />}
    </LiveProvider>
  )
}
