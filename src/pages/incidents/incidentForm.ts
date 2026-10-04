import { RESOLVED_STATUSES, SEVERITY_LABELS, type EscalationRuleDto, type IncidentDto, type IncidentInput, type IncidentStatus, type MeResponse, type Severity } from '@sr/shared'
import { fromWallTimeInput, toWallTimeInput } from '../../lib/zoned'

export interface IncidentFormState {
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
}

export function emptyForm(nowIso: string): IncidentFormState {
  return {
    occurredAt: toWallTimeInput(nowIso), locationId: '', locationDetail: '', categoryId: '', severity: '',
    description: '', immediateAction: '', escalatedTo: '', escalatedAt: '', assignedTo: '', status: 'OPEN', resolvedAt: '', resolution: '',
  }
}

export function formFromIncident(i: IncidentDto): IncidentFormState {
  return {
    occurredAt: toWallTimeInput(i.occurredAt),
    locationId: String(i.location.id),
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
  }
}

export const isResolved = (s: IncidentStatus) => (RESOLVED_STATUSES as readonly string[]).includes(s)

export function formToInput(f: IncidentFormState): IncidentInput {
  return {
    occurredAt: f.occurredAt ? fromWallTimeInput(f.occurredAt) : '',
    locationId: Number(f.locationId) || 0,
    locationDetail: f.locationDetail || null,
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
