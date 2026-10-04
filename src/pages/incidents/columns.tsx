import { incidentPlace, type IncidentListItemDto, type IncidentSide } from '@sr/shared'
import { Paperclip } from 'lucide-react'
import { SeverityBadge, SideBadge, StatusBadge } from '../../components/badges'
import type { Column } from '../../components/DataTable'
import { formatDate, formatDateTime } from '../../lib/format'

const placeHeader = (side?: IncidentSide) => (side === 'MOBILE' ? 'Vehicle · Place' : side === 'STATIC' ? 'Location' : 'Location / unit')

function Where({ i }: { i: IncidentListItemDto }) {
  if (i.side === 'MOBILE') {
    return <span><span className="font-medium text-slate-800">{i.vehicle?.unitId ?? '—'}</span><span className="block text-xs text-slate-500">{incidentPlace(i)}</span></span>
  }
  return <span>{incidentPlace(i)}{i.locationDetail && <span className="block text-xs text-slate-500">{i.locationDetail}</span>}</span>
}

export function incidentColumns({ showShift = true, side }: { showShift?: boolean; side?: IncidentSide } = {}): Column<IncidentListItemDto>[] {
  const cols: Column<IncidentListItemDto>[] = [
    { key: 'ref', header: 'ID', sortKey: 'ref', render: (i) => <span className="font-semibold text-slate-900">{i.ref}</span> },
    { key: 'side', header: 'Side', sortKey: 'side', render: (i) => <SideBadge side={i.side} /> },
    { key: 'occurredAt', header: 'Date / time', sortKey: 'occurredAt', className: 'whitespace-nowrap', render: (i) => formatDateTime(i.occurredAt) },
    { key: 'location', header: placeHeader(side), render: (i) => <Where i={i} /> },
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
