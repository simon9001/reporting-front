import { incidentInputSchema, type IncidentDto, type MeResponse, type ShiftRole } from '@sr/shared'
import { describe, expect, it } from 'vitest'
import { canLogIncidents, defaultOccurredAt, emptyForm, escalationHint, formFromIncident, formToInput, mergeSnapshots, resolvePlace } from './incidentForm'

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

describe('who can log incidents, and from when', () => {
  const user = (role: MeResponse['user']['role']) => ({ id: 7, fullName: 'Simon Gatungo', email: 's@x', role, mustChangePassword: false }) as unknown as MeResponse['user']
  const current = (myRole: ShiftRole | null): MeResponse['currentShift'] => ({
    shiftDate: '2026-10-04', shiftCode: 'DAY', shiftName: 'Day', startsAt: '2026-10-04T05:00:00.000Z', endsAt: '2026-10-04T17:00:00.000Z', shift: null, myRole,
  })
  const previous: MeResponse['previousShift'] = {
    id: 41, shiftDate: '2026-10-03', shiftCode: 'NIGHT', shiftName: 'Night', startsAt: '2026-10-03T17:00:00.000Z', endsAt: '2026-10-04T05:00:00.000Z', myRole: 'OFFICER',
  }
  const me = (role: MeResponse['user']['role'], cur: MeResponse['currentShift'], prev: MeResponse['previousShift']): MeResponse => ({ user: user(role), currentShift: cur, previousShift: prev })

  it('allows admins always, and officers on the current or an editable previous shift', () => {
    expect(canLogIncidents(undefined)).toBe(false)
    expect(canLogIncidents(me('ADMIN', current(null), null))).toBe(true)
    expect(canLogIncidents(me('DEPUTY_DIRECTOR', current(null), null))).toBe(false)
    expect(canLogIncidents(me('OFFICER', current('SUPERVISOR'), null))).toBe(true)
    expect(canLogIncidents(me('OFFICER', current(null), previous))).toBe(true)
    expect(canLogIncidents(me('OFFICER', current(null), null))).toBe(false)
  })

  it('defaults the time to now, or into the previous shift for an officer who is only on that one', () => {
    const now = '2026-10-04T05:30:00.000Z'
    expect(defaultOccurredAt(me('OFFICER', current('OFFICER'), previous), now)).toBe(now)
    expect(defaultOccurredAt(me('ADMIN', current(null), null), now)).toBe(now)
    expect(defaultOccurredAt(me('OFFICER', current(null), previous), now)).toBe('2026-10-04T04:59:00.000Z')
    expect(defaultOccurredAt(me('OFFICER', null, previous), '2026-10-04T04:30:00.000Z')).toBe('2026-10-04T04:30:00.000Z')
  })
})

describe('static and mobile weighbridge forms', () => {
  const places = [{ id: 3, value: 'Mombasa Road' }, { id: 4, value: 'Isinya W.B' }]
  const mobileForm = () => ({
    ...emptyForm('2026-09-29T22:15:00.000Z', 'MOBILE'),
    vehicleId: '7', place: 'Mlolongo', vehicleStatus: 'ONLINE' as const, gpsStatus: 'ONLINE' as const, dashcamStatus: 'OFFLINE' as const,
    platformId: '2', categoryId: '5', severity: 'MEDIUM' as const, description: 'Inside camera blank', immediateAction: 'Notified fleet manager',
    remarks: 'CH3 rainbow colours',
  })

  it('matches a typed place to the list, ignoring case, or keeps it as typed', () => {
    expect(resolvePlace(' mombasa road ', places)).toEqual({ locationId: 3, locationText: null })
    expect(resolvePlace('Mlolongo', places)).toEqual({ locationId: null, locationText: 'Mlolongo' })
    expect(resolvePlace('  ', places)).toEqual({ locationId: null, locationText: null })
  })

  it('sends only the mobile sheet fields for a mobile incident, and the schema accepts them', () => {
    const input = formToInput(mobileForm(), places)
    expect(input).toMatchObject({
      side: 'MOBILE', vehicleId: 7, locationId: null, locationText: 'Mlolongo', vehicleStatus: 'ONLINE', gpsStatus: 'ONLINE', dashcamStatus: 'OFFLINE',
      platformId: 2, remarks: 'CH3 rainbow colours', immediateAction: 'Notified fleet manager',
    })
    expect(input).not.toHaveProperty('locationDetail')
    expect(incidentInputSchema.safeParse(input).success).toBe(true)
  })

  it('sends only the static fields for a static incident', () => {
    const input = formToInput({ ...mobileForm(), side: 'STATIC', locationId: '4', locationDetail: 'Camera 4' }, places)
    expect(input).toMatchObject({ side: 'STATIC', locationId: 4, locationDetail: 'Camera 4' })
    expect(input).not.toHaveProperty('vehicleId')
    expect(input).not.toHaveProperty('remarks')
  })

  it('keeps the shared fields when the officer switches side', () => {
    const f = { ...emptyForm('2026-09-29T22:15:00.000Z'), description: 'Camera offline', severity: 'HIGH' as const, categoryId: '5' }
    const switched = { ...f, side: 'MOBILE' as const }
    expect(formToInput(switched, places)).toMatchObject({ side: 'MOBILE', description: 'Camera offline', severity: 'HIGH', categoryId: 5 })
  })

  it('loads a mobile incident back into the form', () => {
    const dto = {
      side: 'MOBILE', occurredAt: '2026-09-29T22:15:00.000Z', location: null, locationText: 'Mlolongo', locationDetail: null,
      vehicle: { id: 7, unitId: 'KDG 143S' }, vehicleStatus: 'ONLINE', gpsStatus: 'OFFLINE', dashcamStatus: 'UNKNOWN', platform: { id: 2, value: 'Tracksolid' },
      category: { id: 5, value: 'CCTV' }, severity: 'HIGH', description: 'GPS lost', immediateAction: null, remarks: 'Near Athi River',
      escalatedTo: null, escalatedAt: null, assignedTo: null, status: 'OPEN', resolvedAt: null, resolution: null,
    } as unknown as IncidentDto
    expect(formFromIncident(dto)).toMatchObject({ side: 'MOBILE', vehicleId: '7', place: 'Mlolongo', gpsStatus: 'OFFLINE', platformId: '2', remarks: 'Near Athi River' })
  })

  it('round-trips a mobile incident whose place is a listed location', () => {
    const dto = {
      side: 'MOBILE', occurredAt: '2026-09-29T22:15:00.000Z', location: { id: 3, value: 'Mombasa Road' }, locationText: null, locationDetail: null,
      vehicle: { id: 7, unitId: 'KDG 143S' }, vehicleStatus: 'ONLINE', gpsStatus: 'ONLINE', dashcamStatus: 'ONLINE', platform: { id: 2, value: 'Tracksolid' },
      category: { id: 5, value: 'CCTV' }, severity: 'LOW', description: 'x y z', immediateAction: null, remarks: null,
      escalatedTo: null, escalatedAt: null, assignedTo: null, status: 'OPEN', resolvedAt: null, resolution: null,
    } as unknown as IncidentDto
    const form = formFromIncident(dto)
    expect(form.place).toBe('Mombasa Road')
    expect(formToInput(form, places)).toMatchObject({ side: 'MOBILE', locationId: 3, locationText: null })
  })
})
