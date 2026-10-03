import type { UserDto } from '@sr/shared'
import { describe, expect, it } from 'vitest'
import { filterUsers } from './userFilters'

const u = (id: number, fullName: string, role: UserDto['role'], isActive = true) =>
  ({ id, fullName, email: `${fullName.split(' ')[0]!.toLowerCase()}@kenha.go.ke`, role, isActive, mustChangePassword: false, lastLoginAt: null, createdAt: '' }) as UserDto

describe('filterUsers', () => {
  const users = [u(1, 'Antony Ochieng', 'OFFICER'), u(2, 'Simon Gatungo', 'OFFICER', false), u(3, 'Grace Wanjiru', 'DEPUTY_DIRECTOR')]
  it('searches name and email case-insensitively', () => {
    expect(filterUsers(users, { q: 'ANTONY' }).map((x) => x.id)).toEqual([1])
    expect(filterUsers(users, { q: 'grace@' }).map((x) => x.id)).toEqual([3])
  })
  it('filters by role and status', () => {
    expect(filterUsers(users, { role: 'OFFICER', status: 'active' }).map((x) => x.id)).toEqual([1])
    expect(filterUsers(users, { status: 'inactive' }).map((x) => x.id)).toEqual([2])
    expect(filterUsers(users, {})).toHaveLength(3)
  })
})
