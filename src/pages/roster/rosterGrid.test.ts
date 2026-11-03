import type { ShiftDefinitionDto, ShiftDto } from '@sr/shared'
import { describe, expect, it } from 'vitest'
import { buildRosterRows, collectChanges, cellHasEnded, draftProblem, draftsOutsideView, removeSavedDrafts, weekdayLabel, type Draft } from './rosterGrid'

const defs: ShiftDefinitionDto[] = [
  { id: 2, code: 'NIGHT', name: 'Night', startTime: '17:00', endTime: '08:00', sortOrder: 2, isActive: true },
  { id: 1, code: 'DAY', name: 'Day', startTime: '08:00', endTime: '17:00', sortOrder: 1, isActive: true },
]
const shift: ShiftDto = {
  id: 9, shiftDate: '2030-01-07', shiftCode: 'DAY', shiftName: 'Day',
  startsAt: '2030-01-07T05:00:00.000Z', endsAt: '2030-01-07T14:00:00.000Z',
  supervisor: { id: 1, fullName: 'Antony Ochieng', rosterable: true }, officer: null,
}

describe('roster grid', () => {
  it('lays out one row per day and one cell per shift in order', () => {
    const rows = buildRosterRows('2030-01-07', 2, defs, [shift])
    expect(rows.map((r) => r.shiftDate)).toEqual(['2030-01-07', '2030-01-08'])
    expect(rows[0]!.cells.map((c) => c.shiftCode)).toEqual(['DAY', 'NIGHT'])
    expect(rows[0]!.cells[0]!.shift?.id).toBe(9)
    expect(rows[1]!.cells[0]!.shift).toBeNull()
  })

  it('validates drafts', () => {
    expect(draftProblem({ supervisorId: null })).toBe('Choose the officer')
    expect(draftProblem({ supervisorId: 1 })).toBeNull()
  })

  it('collects only real, valid changes', () => {
    const rows = buildRosterRows('2030-01-07', 2, defs, [shift])
    const drafts = new Map<string, Draft>([
      ['2030-01-07|DAY', { supervisorId: 1 }], // unchanged
      ['2030-01-07|NIGHT', { supervisorId: 2 }], // new
      ['2030-01-08|DAY', { supervisorId: null }], // invalid
    ])
    const { entries, problems } = collectChanges(drafts, rows)
    expect(entries).toEqual([{ shiftDate: '2030-01-07', shiftCode: 'NIGHT', supervisorId: 2 }])
    expect(problems.get('2030-01-08|DAY')).toBe('Choose the officer')
  })

  it('labels weekdays', () => {
    expect(weekdayLabel('2030-01-07')).toBe('Mon 07/01')
  })

  it('removes only the saved drafts and counts drafts outside the visible rows', () => {
    const drafts = new Map<string, Draft>([
      ['2030-01-07|DAY', { supervisorId: 1 }],
      ['2030-02-04|DAY', { supervisorId: 2 }],
    ])
    const rows = buildRosterRows('2030-01-07', 2, defs, [])
    expect(draftsOutsideView(drafts, rows)).toBe(1)
    const left = removeSavedDrafts(drafts, [{ shiftDate: '2030-01-07', shiftCode: 'DAY', supervisorId: 1 }])
    expect([...left.keys()]).toEqual(['2030-02-04|DAY'])
  })

  it('treats a cell as ended only when its date is before yesterday', () => {
    const now = new Date('2030-01-10T09:00:00Z')
    expect(cellHasEnded('2030-01-08', now, 'Africa/Nairobi')).toBe(true)
    expect(cellHasEnded('2030-01-09', now, 'Africa/Nairobi')).toBe(false)
    expect(cellHasEnded('2030-01-10', now, 'Africa/Nairobi')).toBe(false)
  })
})
