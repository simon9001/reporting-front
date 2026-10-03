import { RESOLVED_STATUSES, SEVERITY_LABELS, type EscalationRuleDto, type IncidentDto, type IncidentInput, type IncidentStatus, type Severity } from '@sr/shared'
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
