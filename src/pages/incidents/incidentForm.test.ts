import type { IncidentDto } from '@sr/shared'
import { describe, expect, it } from 'vitest'
import { emptyForm, escalationHint, formFromIncident, formToInput, mergeSnapshots } from './incidentForm'

describe('incident form mapping', () => {
  it('starts at "now" in Nairobi wall time with sensible defaults', () => {
    const f = emptyForm('2026-09-29T22:15:00.000Z')
    expect(f.occurredAt).toBe('2026-09-30T01:15')
    expect(f.status).toBe('OPEN')
    expect(f.severity).toBe('')
  })

  it('converts the form to the API shape, dropping the resolution time for open incidents', () => {
    const input = formToInput({
      ...emptyForm('2026-09-29T22:15:00.000Z'),
      locationId: '3', categoryId: '5', severity: 'HIGH', description: 'Camera offline',
      escalatedTo: 'ICT Officer', escalatedAt: '2026-09-30T01:30', resolvedAt: '2026-09-30T02:10',
    })
    expect(input).toMatchObject({
      occurredAt: '2026-09-29T22:15:00.000Z', locationId: 3, categoryId: 5, severity: 'HIGH',
      escalatedTo: 'ICT Officer', escalatedAt: '2026-09-29T22:30:00.000Z', resolvedAt: null, status: 'OPEN',
    })
  })

  it('round-trips an existing incident', () => {
    const dto = {
      occurredAt: '2026-09-29T22:15:00.000Z', location: { id: 3, value: 'WB04' }, locationDetail: null, category: { id: 5, value: 'CCTV' },
      severity: 'HIGH', description: 'x y z', immediateAction: null, escalatedTo: null, escalatedAt: null, assignedTo: null,
      status: 'RESOLVED', resolvedAt: '2026-09-29T23:10:00.000Z', resolution: 'Restored',
    } as unknown as IncidentDto
    const input = formToInput(formFromIncident(dto))
    expect(input.resolvedAt).toBe('2026-09-29T23:10:00.000Z')
    expect(input.status).toBe('RESOLVED')
  })

  it('explains the escalation rule for the chosen severity', () => {
    expect(escalationHint({ severity: 'HIGH', isRequired: true, notifyWho: 'ICT Officer', withinMinutes: 30 }, 'HIGH')).toBe('High: escalate to ICT Officer within 30 min')
    expect(escalationHint({ severity: 'LOW', isRequired: false, notifyWho: null, withinMinutes: null }, 'LOW')).toBe('Low: escalation not required')
    expect(escalationHint(undefined, '')).toBeNull()
  })
})

describe('mergeSnapshots', () => {
  const f = (name: string, size = 100, type = 'image/png', lastModified = 1) => ({ name, size, type, lastModified })
  it('skips duplicates by name, size and modified time', () => {
    const r = mergeSnapshots(0, [f('a.png')], [f('a.png'), f('a.png', 100, 'image/png', 2)], 10, 1000)
    expect(r.files).toHaveLength(2)
    expect(r.problems).toEqual([])
  })
  it('enforces the per-incident cap including existing attachments', () => {
    const r = mergeSnapshots(9, [], [f('a.png'), f('b.png')], 10, 1000)
    expect(r.files.map((x) => x.name)).toEqual(['a.png'])
    expect(r.problems[0]).toContain('at most 10')
  })
  it('rejects oversize and unsupported files', () => {
    const r = mergeSnapshots(0, [], [f('big.png', 5000), f('x.exe', 1, 'application/x-msdownload')], 10, 1000)
    expect(r.files).toEqual([])
    expect(r.problems).toHaveLength(2)
  })
})
