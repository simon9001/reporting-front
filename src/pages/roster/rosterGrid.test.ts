import type { ShiftDefinitionDto, ShiftDto } from '@sr/shared'
import { describe, expect, it } from 'vitest'
import { buildRosterRows, collectChanges, draftProblem, weekdayLabel, type Draft } from './rosterGrid'

const defs: ShiftDefinitionDto[] = [
  { id: 2, code: 'NIGHT', name: 'Night', startTime: '17:00', endTime: '08:00', sortOrder: 2, isActive: true },
  { id: 1, code: 'DAY', name: 'Day', startTime: '08:00', endTime: '17:00', sortOrder: 1, isActive: true },
]
const shift: ShiftDto = {
  id: 9, shiftDate: '2030-01-07', shiftCode: 'DAY', shiftName: 'Day',
  startsAt: '2030-01-07T05:00:00.000Z', endsAt: '2030-01-07T14:00:00.000Z',
  supervisor: { id: 1, fullName: 'Antony Ochieng' }, officer: { id: 2, fullName: 'Simon Gatungo' },
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
    expect(draftProblem({ supervisorId: 1, officerId: null })).toBe('Choose both people')
    expect(draftProblem({ supervisorId: 1, officerId: 1 })).toBe('Supervisor and Officer must be different')
    expect(draftProblem({ supervisorId: 1, officerId: 2 })).toBeNull()
  })

  it('collects only real, valid changes', () => {
    const rows = buildRosterRows('2030-01-07', 2, defs, [shift])
    const drafts = new Map<string, Draft>([
      ['2030-01-07|DAY', { supervisorId: 1, officerId: 2 }], // unchanged
      ['2030-01-07|NIGHT', { supervisorId: 2, officerId: 1 }], // new
      ['2030-01-08|DAY', { supervisorId: 3, officerId: 3 }], // invalid
    ])
    const { entries, problems } = collectChanges(drafts, rows)
    expect(entries).toEqual([{ shiftDate: '2030-01-07', shiftCode: 'NIGHT', supervisorId: 2, officerId: 1 }])
    expect(problems.get('2030-01-08|DAY')).toBe('Supervisor and Officer must be different')
  })

  it('labels weekdays', () => {
    expect(weekdayLabel('2030-01-07')).toBe('Mon 07/01')
  })
})
