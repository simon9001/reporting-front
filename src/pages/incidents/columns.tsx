import type { IncidentListItemDto } from '@sr/shared'
import { Paperclip } from 'lucide-react'
import { SeverityBadge, StatusBadge } from '../../components/badges'
import type { Column } from '../../components/DataTable'
import { formatDate, formatDateTime } from '../../lib/format'

export function incidentColumns({ showShift = true }: { showShift?: boolean } = {}): Column<IncidentListItemDto>[] {
  const cols: Column<IncidentListItemDto>[] = [
    { key: 'ref', header: 'ID', sortKey: 'ref', render: (i) => <span className="font-semibold text-slate-900">{i.ref}</span> },
    { key: 'occurredAt', header: 'Date / time', sortKey: 'occurredAt', className: 'whitespace-nowrap', render: (i) => formatDateTime(i.occurredAt) },
    { key: 'location', header: 'Location', render: (i) => <span>{i.location.value}{i.locationDetail && <span className="block text-xs text-slate-500">{i.locationDetail}</span>}</span> },
    { key: 'category', header: 'Category', render: (i) => i.category.value },
    { key: 'severity', header: 'Severity', sortKey: 'severity', render: (i) => <SeverityBadge severity={i.severity} /> },
    { key: 'status', header: 'Status', sortKey: 'status', render: (i) => <StatusBadge status={i.status} /> },
  ]
  if (showShift) {
    cols.push({ key: 'shift', header: 'Shift / Supervisor', render: (i) => <span className="text-slate-600">{i.shiftName} {formatDate(i.shiftDate)}<span className="block text-xs text-slate-500">{i.supervisorName}</span></span> })
  }
  cols.push({
    key: 'files', header: <Paperclip className="size-3.5" aria-label="Snapshots" />, className: 'text-right',
    render: (i) => (i.attachmentCount > 0 ? <span className="inline-flex items-center gap-1 text-slate-600"><Paperclip className="size-3.5" aria-hidden />{i.attachmentCount}</span> : <span className="text-slate-300">—</span>),
  })
  return cols
}
