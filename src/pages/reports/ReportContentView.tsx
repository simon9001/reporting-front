import { INCIDENT_STATUS_LABELS, SEVERITY_LABELS, type ReportContentDto, type ReportIncidentRowDto } from '@sr/shared'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router'
import { SeverityBadge, SideBadge, StatusBadge } from '../../components/badges'
import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { StatCard } from '../../components/StatCard'
import { Card, Table } from '../../components/ui'
import { formatTime } from '../../lib/format'

function IncidentList({ title, rows, empty, onOpen }: { title: string; rows: ReportIncidentRowDto[]; empty: string; onOpen: (ref: string) => void }) {
  return (
    <Card title={`${title} (${rows.length})`}>
      <DataTable
        columns={[
          { key: 'ref', header: 'ID', className: 'whitespace-nowrap', render: (r) => <span className="font-semibold text-slate-900">{r.ref}</span> },
          { key: 'side', header: 'Side', render: (r) => <SideBadge side={r.side} /> },
          { key: 'time', header: 'Time', render: (r) => formatTime(r.occurredAt) },
          { key: 'place', header: 'Place / unit', render: (r) => r.place },
          { key: 'cat', header: 'Category', render: (r) => r.category },
          { key: 'sev', header: 'Severity', render: (r) => <SeverityBadge severity={r.severity} /> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => onOpen(r.ref)}
        rowLabel={(r) => `Open ${r.ref}`}
        mobile={(r) => (
          <span className="block space-y-1">
            <span className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><span className="font-semibold text-asphalt-900">{r.ref}</span><SideBadge side={r.side} /></span><span className="text-xs text-slate-500">{formatTime(r.occurredAt)}</span></span>
            <span className="block truncate text-slate-600">{r.place} · {r.category}</span>
            <span className="flex gap-1"><SeverityBadge severity={r.severity} /><StatusBadge status={r.status} /></span>
          </span>
        )}
        empty={<EmptyState title={empty} />}
      />
    </Card>
  )
}

export function ReportContentView({ content: c, onOpen }: { content: ReportContentDto; onOpen: (ref: string) => void }) {
  const f = c.figures
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard tone="charcoal" label="Total incidents" value={f.total} footnote={`Static ${f.bySide.STATIC} · Mobile ${f.bySide.MOBILE}`} />
        <StatCard tone="red" label="Critical / high" value={f.bySeverity.CRITICAL + f.bySeverity.HIGH} />
        <StatCard tone="yellow" label="Open at shift end" value={f.openAtEnd} />
        <StatCard tone="blue" label="Escalated on time" value={f.escalation.ON_TIME} footnote={`Late ${f.escalation.LATE} · Not escalated ${f.escalation.NOT_ESCALATED}`} />
        <StatCard label="Avg. time to resolve" value={f.avgMinutesToResolve === null ? '—' : `${f.avgMinutesToResolve} min`} />
      </div>
      {c.checks.length > 0 && (
        <div role="note" className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="size-4" aria-hidden />Data checks</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {c.checks.map((x, i) => (
              <li key={i}>{x.ref ? <Link to={`/incidents?open=${x.ref}`} className="text-link underline">{x.message}</Link> : x.message}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="By severity">
          <Table head={['Severity', 'Incidents']}>
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => <tr key={s}><td className="px-3 py-2">{SEVERITY_LABELS[s]}</td><td className="px-3 py-2 tabular-nums">{f.bySeverity[s]}</td></tr>)}
          </Table>
        </Card>
        <Card title="By category">
          {f.byCategory.length === 0 ? <EmptyState title="No incidents" /> : (
            <Table head={['Category', 'Incidents']}>
              {f.byCategory.map((x) => <tr key={x.label}><td className="px-3 py-2">{x.label}</td><td className="px-3 py-2 tabular-nums">{x.count}</td></tr>)}
            </Table>
          )}
        </Card>
      </div>
      <IncidentList title="Critical and high incidents" rows={c.criticalHigh} empty="None on this shift" onOpen={onOpen} />
      <IncidentList title="Incidents still open" rows={c.open} empty={`None — ${INCIDENT_STATUS_LABELS.RESOLVED.toLowerCase()} or closed`} onOpen={onOpen} />
    </>
  )
}
