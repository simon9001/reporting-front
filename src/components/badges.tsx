import {
  ESCALATION_RESULT_LABELS, INCIDENT_STATUS_LABELS, OUTSTANDING_STATUSES, SEVERITY_LABELS,
  type EscalationResult, type IncidentStatus, type Severity,
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
