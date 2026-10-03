import { describe, expect, it } from 'vitest'
import { navFor } from './nav'

const labels = (role: Parameters<typeof navFor>[0]) => navFor(role).flatMap((g) => g.items.map((i) => i.label))

describe('navigation', () => {
  it('shows each role only its pages, grouped', () => {
    expect(labels('OFFICER')).toEqual(['My Shift', 'Incident explorer', 'Roster'])
    expect(labels('DEPUTY_DIRECTOR')).toEqual(['Dashboard', 'Incident explorer', 'Roster', 'Officers'])
    expect(labels('ADMIN')).toEqual(['Dashboard', 'Incident explorer', 'Roster', 'Officers', 'Users', 'Settings', 'Lists', 'Vehicles', 'Audit log'])
    expect(navFor('OFFICER').map((g) => g.label)).toEqual([null, 'Incidents', 'Shifts'])
  })
})
