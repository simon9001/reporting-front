import {
  ESCALATION_RESULT_LABELS, INCIDENT_SIDE_SHORT, INCIDENT_STATUS_LABELS, LINK_STATUS_LABELS, OUTSTANDING_STATUSES, SEVERITY_LABELS, VEHICLE_STATUS_LABELS,
  type EscalationResult, type IncidentSide, type IncidentStatus, type LinkStatus, type Severity, type VehicleStatus,
} from '@sr/shared'
import { cx } from './ui'

export const SEVERITY_COLORS: Record<Severity, string> = { CRITICAL: '#dc2626', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e' }
const SEVERITY_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  LOW: 'bg-green-100 text-green-800',
}
const pill = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium'

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cx(pill, SEVERITY_CLASS[severity])}>
      <span className="size-1.5 rounded-full" style={{ background: SEVERITY_COLORS[severity] }} aria-hidden />
      {SEVERITY_LABELS[severity]}
    </span>
  )
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const open = OUTSTANDING_STATUSES.includes(status)
  return <span className={cx(pill, open ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700')}>{INCIDENT_STATUS_LABELS[status]}</span>
}

export function EscalationBadge({ result, minutes }: { result: EscalationResult; minutes?: number | null }) {
  if (result === 'NOT_REQUIRED') return <span className="text-xs text-slate-400">{ESCALATION_RESULT_LABELS[result]}</span>
  const tone = result === 'ON_TIME' ? 'bg-green-100 text-green-800' : result === 'ESCALATED' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-800'
  return <span className={cx(pill, tone)}>{ESCALATION_RESULT_LABELS[result]}{minutes != null ? ` · ${minutes} min` : ''}</span>
}

export const SIDE_COLORS: Record<IncidentSide, string> = { STATIC: '#0f766e', MOBILE: '#7c3aed' }
const SIDE_CLASS: Record<IncidentSide, string> = { STATIC: 'bg-teal-50 text-teal-800 ring-1 ring-teal-200', MOBILE: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200' }

export function SideBadge({ side }: { side: IncidentSide }) {
  return <span className={cx(pill, SIDE_CLASS[side])}>{INCIDENT_SIDE_SHORT[side]}</span>
}

const LINK_CLASS: Record<LinkStatus, string> = { ONLINE: 'bg-green-100 text-green-800', OFFLINE: 'bg-red-100 text-red-800', UNKNOWN: 'bg-slate-100 text-slate-700' }

export function LinkChip({ label, status }: { label: string; status: LinkStatus }) {
  return <span className={cx(pill, LINK_CLASS[status])}>{label}: {LINK_STATUS_LABELS[status]}</span>
}

export function VehicleStatusChip({ status }: { status: VehicleStatus }) {
  return <span className={cx(pill, status === 'OFFLINE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>Vehicle: {VEHICLE_STATUS_LABELS[status]}</span>
}
