import {
  incidentPlace, RESOLVED_STATUSES, SEVERITY_LABELS,
  type EscalationRuleDto, type IncidentDto, type IncidentInput, type IncidentSide, type IncidentStatus, type LinkStatus, type MeResponse, type Severity, type VehicleStatus,
} from '@sr/shared'
import { fromWallTimeInput, toWallTimeInput } from '../../lib/zoned'

export interface IncidentFormState {
  side: IncidentSide
  occurredAt: string // datetime-local, business wall time
  locationId: string
  locationDetail: string
  categoryId: string
  severity: Severity | ''
  description: string
  immediateAction: string
  escalatedTo: string
  escalatedAt: string
  assignedTo: string
  status: IncidentStatus
  resolvedAt: string
  resolution: string
  // mobile weighbridge sheet
  vehicleId: string
  place: string
  vehicleStatus: VehicleStatus | ''
  gpsStatus: LinkStatus | ''
  dashcamStatus: LinkStatus | ''
  platformId: string
  remarks: string
}

export function emptyForm(nowIso: string, side: IncidentSide = 'STATIC'): IncidentFormState {
  return {
    side, occurredAt: toWallTimeInput(nowIso), locationId: '', locationDetail: '', categoryId: '', severity: '',
    description: '', immediateAction: '', escalatedTo: '', escalatedAt: '', assignedTo: '', status: 'OPEN', resolvedAt: '', resolution: '',
    vehicleId: '', place: '', vehicleStatus: '', gpsStatus: '', dashcamStatus: '', platformId: '', remarks: '',
  }
}

export function formFromIncident(i: IncidentDto): IncidentFormState {
  const mobile = i.side === 'MOBILE'
  return {
    side: i.side,
    occurredAt: toWallTimeInput(i.occurredAt),
    locationId: !mobile && i.location ? String(i.location.id) : '',
    locationDetail: i.locationDetail ?? '',
    categoryId: String(i.category.id),
    severity: i.severity,
    description: i.description,
    immediateAction: i.immediateAction ?? '',
    escalatedTo: i.escalatedTo ?? '',
    escalatedAt: i.escalatedAt ? toWallTimeInput(i.escalatedAt) : '',
    assignedTo: i.assignedTo ?? '',
    status: i.status,
    resolvedAt: i.resolvedAt ? toWallTimeInput(i.resolvedAt) : '',
    resolution: i.resolution ?? '',
    vehicleId: i.vehicle ? String(i.vehicle.id) : '',
    place: mobile ? incidentPlace(i) : '',
    vehicleStatus: i.vehicleStatus ?? '',
    gpsStatus: i.gpsStatus ?? '',
    dashcamStatus: i.dashcamStatus ?? '',
    platformId: i.platform ? String(i.platform.id) : '',
    remarks: i.remarks ?? '',
  }
}

export const isResolved = (s: IncidentStatus) => (RESOLVED_STATUSES as readonly string[]).includes(s)

/** A typed mobile place that matches a listed location (ignoring case and spaces) is saved as that location. */
export function resolvePlace(text: string, places: { id: number; value: string }[]): { locationId: number | null; locationText: string | null } {
  const t = text.trim()
  if (!t) return { locationId: null, locationText: null }
  const hit = places.find((p) => p.value.trim().toLowerCase() === t.toLowerCase())
  return hit ? { locationId: hit.id, locationText: null } : { locationId: null, locationText: t }
}

export function formToInput(f: IncidentFormState, places: { id: number; value: string }[] = []): IncidentInput {
  const common = {
    occurredAt: f.occurredAt ? fromWallTimeInput(f.occurredAt) : '',
    categoryId: Number(f.categoryId) || 0,
    severity: (f.severity || undefined) as Severity,
    description: f.description,
    immediateAction: f.immediateAction || null,
    escalatedTo: f.escalatedTo || null,
    escalatedAt: f.escalatedAt ? fromWallTimeInput(f.escalatedAt) : null,
    assignedTo: f.assignedTo || null,
    status: f.status,
    resolvedAt: isResolved(f.status) && f.resolvedAt ? fromWallTimeInput(f.resolvedAt) : null,
    resolution: f.resolution || null,
  }
  if (f.side === 'STATIC') {
    return { side: 'STATIC', ...common, locationId: Number(f.locationId) || 0, locationDetail: f.locationDetail || null }
  }
  return {
    side: 'MOBILE',
    ...common,
    vehicleId: Number(f.vehicleId) || 0,
    ...resolvePlace(f.place, places),
    vehicleStatus: (f.vehicleStatus || undefined) as VehicleStatus,
    gpsStatus: (f.gpsStatus || undefined) as LinkStatus,
    dashcamStatus: (f.dashcamStatus || undefined) as LinkStatus,
    platformId: Number(f.platformId) || 0,
    remarks: f.remarks || null,
  }
}

export function escalationHint(rule: EscalationRuleDto | undefined, severity: Severity | ''): string | null {
  if (!rule || !severity) return null
  const label = SEVERITY_LABELS[severity]
  if (!rule.isRequired) return `${label}: escalation not required`
  return `${label}: escalate to ${rule.notifyWho ?? 'the responsible team'}${rule.withinMinutes ? ` within ${rule.withinMinutes} min` : ''}`
}

export const SNAPSHOT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

type FileLike = Pick<File, 'name' | 'size' | 'type' | 'lastModified'>

/** Adds picked files to the pending list: skips duplicates, rejects bad type/size, and enforces the per-incident cap. */
export function mergeSnapshots<F extends FileLike>(existingCount: number, pending: F[], incoming: F[], maxCount: number, maxBytes: number): { files: F[]; problems: string[] } {
  const files = [...pending]
  const problems: string[] = []
  for (const f of incoming) {
    if (files.some((p) => p.name === f.name && p.size === f.size && p.lastModified === f.lastModified)) continue
    if (f.size > maxBytes) problems.push(`${f.name}: larger than 10 MB`)
    else if (!SNAPSHOT_TYPES.includes(f.type)) problems.push(`${f.name}: not a JPEG, PNG, WebP or PDF file`)
    else if (existingCount + files.length >= maxCount) problems.push(`${f.name}: an incident can have at most ${maxCount} snapshots`)
    else files.push(f)
  }
  return { files, problems }
}

/** Admins always; officers while rostered on the current shift or on a previous shift that still takes late entries. */
export function canLogIncidents(me: MeResponse | undefined): boolean {
  if (!me) return false
  if (me.user.role === 'ADMIN') return true
  return me.user.role === 'OFFICER' && (!!me.currentShift?.myRole || !!me.previousShift)
}

/** "Now", unless the officer is only on the previous shift: then the last minute of that shift, so the time is one they may use. */
export function defaultOccurredAt(me: MeResponse | undefined, nowIso: string): string {
  const prev = me?.previousShift
  if (!prev || me?.user.role === 'ADMIN' || me?.currentShift?.myRole) return nowIso
  const lastMinute = Date.parse(prev.endsAt) - 60_000
  return Date.parse(nowIso) > lastMinute ? new Date(lastMinute).toISOString() : nowIso
}
