import type { Role } from '@sr/shared'

export interface NavItem { to: string; label: string; roles: Role[] }

export const NAV_ITEMS: NavItem[] = [
  { to: '/my-shift', label: 'My Shift', roles: ['OFFICER'] },
  { to: '/dashboard', label: 'Dashboard', roles: ['DEPUTY_DIRECTOR', 'ADMIN'] },
  { to: '/roster', label: 'Roster', roles: ['OFFICER', 'DEPUTY_DIRECTOR', 'ADMIN'] },
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/admin/settings', label: 'Settings', roles: ['ADMIN'] },
  { to: '/admin/lookups', label: 'Lists', roles: ['ADMIN'] },
  { to: '/admin/vehicles', label: 'Vehicles', roles: ['ADMIN'] },
  { to: '/admin/audit', label: 'Audit log', roles: ['ADMIN'] },
]

export const navFor = (role: Role) => NAV_ITEMS.filter((item) => item.roles.includes(role))
