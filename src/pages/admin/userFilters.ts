import type { Role, UserDto } from '@sr/shared'

export function filterUsers(users: UserDto[], f: { q?: string; role?: Role; status?: 'active' | 'inactive' }): UserDto[] {
  const q = f.q?.trim().toLowerCase()
  return users.filter((u) =>
    (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (!f.role || u.role === f.role) &&
    (!f.status || (f.status === 'active') === u.isActive),
  )
}
