import { incidentPlace, type IncidentDto } from '@sr/shared'
import type { ReactNode } from 'react'
import { useDeleteSnapshot } from '../../api/incidents'
import { EscalationBadge, SeverityBadge, StatusBadge } from '../../components/badges'
import { Alert } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { formatDate, formatDateTime, formatDuration } from '../../lib/format'
import { SnapshotGallery } from './SnapshotGallery'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{children}</dd>
    </div>
  )
}

export function IncidentDetail({ incident: i }: { incident: IncidentDto; onEdit?: () => void }) {
  const remove = useDeleteSnapshot()
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2"><SeverityBadge severity={i.severity} /><StatusBadge status={i.status} /><EscalationBadge result={i.escalationResult} minutes={i.escalationMinutes} /></div>
        <p className="text-base font-medium text-slate-900">{i.description}</p>
      </div>
      <dl className="divide-y divide-slate-100">
        <Fact label="Occurred">{formatDateTime(i.occurredAt)}</Fact>
        <Fact label="Location">{incidentPlace(i)}{i.locationDetail && ` · ${i.locationDetail}`}</Fact>
        <Fact label="Category">{i.category.value}</Fact>
        <Fact label="Shift">{i.shiftName} shift of {formatDate(i.shiftDate)}{i.afterMidnight && <span className="text-slate-500"> (after midnight)</span>}<span className="block text-xs text-slate-500">Supervisor {i.supervisorName} · Officer {i.officerName}</span></Fact>
        <Fact label="Reported by">{i.reportedBy.fullName}</Fact>
        {i.immediateAction && <Fact label="Immediate action">{i.immediateAction}</Fact>}
        <Fact label="Escalation">{i.escalatedTo ? <>{i.escalatedTo}{i.escalatedAt && ` at ${formatDateTime(i.escalatedAt)}`}</> : <span className="text-slate-400">Nobody notified</span>}</Fact>
        {i.assignedTo && <Fact label="Assigned to">{i.assignedTo}</Fact>}
        {i.resolvedAt && <Fact label="Resolved">{formatDateTime(i.resolvedAt)}{i.minutesToResolve !== null && <span className="text-slate-500"> · took {formatDuration(i.minutesToResolve * 60_000)}</span>}</Fact>}
        {i.resolution && <Fact label="Resolution / notes">{i.resolution}</Fact>}
      </dl>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Snapshots ({i.attachments.length})</h3>
        {remove.isError && <Alert>{errorMessage(remove.error)}</Alert>}
        <SnapshotGallery attachments={i.attachments} onDelete={(a) => remove.mutate(a.id)} />
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Timeline</h3>
        <ol className="space-y-3 border-l-2 border-brand-200 pl-4">
          {i.events.map((e) => (
            <li key={e.id} className="relative text-sm">
              <span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-brand-600 ring-4 ring-white" aria-hidden />
              <p className="text-slate-800">{e.summary}</p>
              <p className="text-xs text-slate-500">{formatDateTime(e.at)}{e.user && ` · ${e.user.fullName}`}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
