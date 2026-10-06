import type { Role } from '@sr/shared'
import { CalendarDays, ClipboardList, LayoutDashboard, List, ScrollText, Search, Settings, Truck, UserCog, Users, type LucideIcon } from 'lucide-react'

export interface NavItem { to: string; label: string; icon: LucideIcon; roles: Role[] }
export interface NavGroup { label: string | null; items: NavItem[] }

const ALL: Role[] = ['OFFICER', 'DEPUTY_DIRECTOR', 'ADMIN']
const LEADERS: Role[] = ['DEPUTY_DIRECTOR', 'ADMIN']

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { to: '/my-shift', label: 'My Shift', icon: ClipboardList, roles: ['OFFICER'] },
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: LEADERS },
    ],
  },
  { label: 'Incidents', items: [{ to: '/incidents', label: 'Incident explorer', icon: Search, roles: ALL }] },
  { label: 'Shifts', items: [{ to: '/roster', label: 'Roster', icon: CalendarDays, roles: ALL }] },
  { label: 'People', items: [{ to: '/officers', label: 'Officers', icon: Users, roles: LEADERS }] },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users', icon: UserCog, roles: ['ADMIN'] },
      { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
      { to: '/admin/lookups', label: 'Lists', icon: List, roles: ['ADMIN'] },
      { to: '/admin/vehicles', label: 'Vehicles', icon: Truck, roles: ['ADMIN'] },
      { to: '/admin/audit', label: 'Audit log', icon: ScrollText, roles: ['ADMIN'] },
    ],
  },
]

export function navFor(role: Role): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter((g) => g.items.length > 0)
}

/** Top-bar title: the label of the deepest menu item (for this role) whose path matches; otherwise "Control Room". */
export function pageTitleFor(pathname: string, role: Role): string {
  const hit = navFor(role)
    .flatMap((g) => g.items)
    .filter((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return hit?.label ?? 'Control Room'
}
