import type { Role } from '@sr/shared'
import { LogOut, PanelLeftOpen } from 'lucide-react'
import { NavLink } from 'react-router'
import { cx } from '../components/ui'
import { navFor } from './nav'

const ACTIVE = 'bg-highway-400 font-semibold text-asphalt-900 focus-visible:outline-white focus-visible:shadow-[0_0_0_4px_var(--color-asphalt-900)]'
const IDLE = 'text-white/80 hover:bg-asphalt-700 hover:text-white'

/** `full`: 224px labelled sidebar. `rail`: 64px icon rail; each link keeps its label as accessible name and tooltip. */
export function Sidebar({ role, mode, onNavigate, onSignOut, onExpand, expanded = false }: {
  role: Role
  mode: 'full' | 'rail'
  onNavigate?: () => void
  onSignOut: () => void
  onExpand?: () => void
  expanded?: boolean
}) {
  const groups = navFor(role)
  if (mode === 'rail') {
    return (
      <div className="flex h-full flex-col items-center bg-asphalt-900 py-2 text-white">
        <button type="button" onClick={onExpand} aria-label="Expand menu" title="Expand menu" aria-expanded={expanded} className="flex size-10 items-center justify-center rounded-md text-white/80 transition duration-150 hover:bg-asphalt-700 hover:text-white">
          <PanelLeftOpen className="size-4" aria-hidden />
        </button>
        <span className="my-2 rounded-md bg-white p-0.5"><img src="/kenha-logo.png" alt="KeNHA" className="h-7 w-auto" /></span>
        <nav aria-label="Main" className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-2">
          {groups.flatMap((g) => g.items).map((item) => (
            <NavLink key={item.to} to={item.to} aria-label={item.label} title={item.label} className={({ isActive }) => cx('flex size-10 shrink-0 items-center justify-center rounded-md transition duration-150', isActive ? ACTIVE : IDLE)}>
              <item.icon className="size-[18px]" aria-hidden />
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={onSignOut} aria-label="Sign out" title="Sign out" className="mb-1 flex size-10 items-center justify-center rounded-md text-white/70 transition duration-150 hover:bg-asphalt-700 hover:text-white">
          <LogOut className="size-4" aria-hidden />
        </button>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col bg-asphalt-900 text-white">
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <span className="rounded-md bg-white p-0.5"><img src="/kenha-logo.png" alt="KeNHA" className="h-7 w-auto" /></span>
        <span className="font-display text-[13px] font-semibold leading-tight">Control<br />Room</span>
      </div>
      <div className="mx-4 h-0.5 rounded-full road-dash opacity-80" aria-hidden />
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2" aria-label="Main">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.label && <p className="px-2.5 pb-1 pt-3 text-[11px] font-semibold text-silver-400">{group.label}</p>}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) => cx(
                  'relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition duration-150',
                  isActive ? cx(ACTIVE, 'before:absolute before:-left-2 before:bottom-1.5 before:top-1.5 before:w-[3px] before:rounded-r before:bg-highway-400') : IDLE,
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-2">
        <button type="button" onClick={onSignOut} className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-white/70 transition duration-150 hover:bg-asphalt-700 hover:text-white">
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  )
}
