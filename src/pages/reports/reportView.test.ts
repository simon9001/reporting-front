import { describe, expect, it } from 'vitest'
import { reportStatusLine } from './reportView'

const fmt = (iso: string) => iso.slice(11, 16)
const base = { status: 'DRAFT' as const, overdue: false, submittedAt: null, submittedBy: null, timeliness: null, lateMinutes: null, content: { deadline: '2026-10-11T14:30:00.000Z' } }

describe('reportStatusLine', () => {
  it('shows the due time for a draft', () => {
    expect(reportStatusLine(base, new Date('2026-10-11T13:00:00Z'), fmt)).toEqual({ text: 'Draft · due by 14:30', tone: 'neutral' })
  })
  it('shows how overdue a draft is', () => {
    expect(reportStatusLine({ ...base, overdue: true }, new Date('2026-10-11T14:42:00Z'), fmt)).toEqual({ text: 'Overdue by 12 min', tone: 'danger' })
    expect(reportStatusLine({ ...base, overdue: true }, new Date('2026-10-11T15:35:00Z'), fmt).text).toBe('Overdue by 1 h 5 min')
  })
  it('shows who submitted and whether it was on time', () => {
    const sub = { ...base, status: 'SUBMITTED' as const, submittedAt: '2026-10-11T14:08:00.000Z', submittedBy: { id: 1, fullName: 'Brian Otieno' }, timeliness: 'ON_TIME' as const }
    expect(reportStatusLine(sub, new Date(), fmt)).toEqual({ text: 'Submitted 14:08 by Brian Otieno · On time', tone: 'success' })
    expect(reportStatusLine({ ...sub, timeliness: 'LATE', lateMinutes: 12 }, new Date(), fmt)).toEqual({ text: 'Submitted 14:08 by Brian Otieno · 12 min late', tone: 'warning' })
  })
})
