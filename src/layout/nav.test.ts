import { describe, expect, it } from 'vitest'
import { navFor, pageTitleFor } from './nav'

const labels = (role: Parameters<typeof navFor>[0]) => navFor(role).flatMap((g) => g.items.map((i) => i.label))

describe('navigation', () => {
  it('shows each role only its pages, grouped', () => {
    expect(labels('OFFICER')).toEqual(['My Shift', 'Incident explorer', 'Roster'])
    expect(labels('DEPUTY_DIRECTOR')).toEqual(['Dashboard', 'Incident explorer', 'Roster', 'Officers'])
    expect(labels('ADMIN')).toEqual(['Dashboard', 'Incident explorer', 'Roster', 'Officers', 'Users', 'Settings', 'Lists', 'Vehicles', 'Audit log'])
    expect(navFor('OFFICER').map((g) => g.label)).toEqual([null, 'Incidents', 'Shifts'])
  })
})

describe('pageTitleFor', () => {
  it('names the page from the deepest matching menu item for the role', () => {
    expect(pageTitleFor('/dashboard', 'DEPUTY_DIRECTOR')).toBe('Dashboard')
    expect(pageTitleFor('/incidents/INC-2026-0001', 'OFFICER')).toBe('Incident explorer')
    expect(pageTitleFor('/admin/users', 'ADMIN')).toBe('Users')
    expect(pageTitleFor('/my-shift', 'OFFICER')).toBe('My Shift')
  })
  it('falls back to "Control Room" for pages outside the menu or outside the role', () => {
    expect(pageTitleFor('/change-password', 'OFFICER')).toBe('Control Room')
    expect(pageTitleFor('/dashboard', 'OFFICER')).toBe('Control Room')
    expect(pageTitleFor('/nowhere', 'ADMIN')).toBe('Control Room')
  })
})
