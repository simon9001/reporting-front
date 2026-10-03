import { describe, expect, it } from 'vitest'
import { navFor } from './nav'

describe('navigation', () => {
  it('shows each role only its pages', () => {
    expect(navFor('OFFICER').map((i) => i.label)).toEqual(['My Shift', 'Roster'])
    expect(navFor('DEPUTY_DIRECTOR').map((i) => i.label)).toEqual(['Dashboard', 'Roster'])
    expect(navFor('ADMIN').map((i) => i.label)).toEqual(['Dashboard', 'Roster', 'Users', 'Settings', 'Lists', 'Vehicles', 'Audit log'])
  })
})
