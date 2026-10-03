import type { ShiftDefinitionDto, ShiftDto } from '@sr/shared'
import { describe, expect, it } from 'vitest'
import { buildRosterRows } from './rosterGrid'
import { rosterListRows } from './rosterList'

const defs: ShiftDefinitionDto[] = [
  { id: 1, code: 'DAY', name: 'Day', startTime: '08:00', endTime: '17:00', sortOrder: 1, isActive: true },
  { id: 2, code: 'NIGHT', name: 'Night', startTime: '17:00', endTime: '08:00', sortOrder: 2, isActive: true },
]
const shift = {
  id: 9, shiftDate: '2030-01-07', shiftCode: 'DAY', shiftName: 'Day', startsAt: '', endsAt: '',
  supervisor: { id: 1, fullName: 'Antony Ochieng', rosterable: true }, officer: { id: 2, fullName: 'Simon Gatungo', rosterable: false },
} as ShiftDto

describe('rosterListRows', () => {
  const rows = buildRosterRows('2030-01-07', 2, defs, [shift])
  it('lists every date and shift with planned status', () => {
    const list = rosterListRows(rows, defs, {})
    expect(list).toHaveLength(4)
    expect(list[0]).toMatchObject({ shiftDate: '2030-01-07', shiftName: 'Day', planned: true, supervisor: 'Antony Ochieng', needsReassign: true })
    expect(list[1]).toMatchObject({ shiftName: 'Night', planned: false })
  })
  it('filters by officer name, shift and status', () => {
    expect(rosterListRows(rows, defs, { q: 'simon' })).toHaveLength(1)
    expect(rosterListRows(rows, defs, { shiftCode: 'NIGHT' })).toHaveLength(2)
    expect(rosterListRows(rows, defs, { status: 'unplanned' })).toHaveLength(3)
  })
})
