import type { ShiftDefinitionDto } from '@sr/shared'
import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { FilterBar } from '../../components/FilterBar'
import { Segmented } from '../../components/Segmented'
import { Badge } from '../../components/ui'
import { formatDate } from '../../lib/format'
import { useUrlFilters } from '../../lib/urlFilters'
import type { RosterRow } from './rosterGrid'
import { rosterListRows } from './rosterList'

export function RosterListView({ rows, defs }: { rows: RosterRow[]; defs: ShiftDefinitionDto[] }) {
  const { values, set } = useUrlFilters(['rq', 'rshift', 'rstatus'])
  const list = rosterListRows(rows, defs, {
    q: values.rq,
    shiftCode: values.rshift,
    status: values.rstatus as 'planned' | 'unplanned' | undefined,
  })
  return (
    <div className="space-y-4">
      <FilterBar search={values.rq ?? ''} onSearchChange={(v) => set({ rq: v || undefined })} placeholder="Search officer name…" canClear={!!(values.rq || values.rshift || values.rstatus)} onClear={() => set({ rq: undefined, rshift: undefined, rstatus: undefined })}>
        <Segmented label="Shift" value={values.rshift ?? ''} onChange={(v) => set({ rshift: v || undefined })} options={[{ value: '', label: 'All shifts' }, ...defs.filter((d) => d.isActive).map((d) => ({ value: d.code, label: d.name }))]} />
        <Segmented label="Planning" value={values.rstatus ?? ''} onChange={(v) => set({ rstatus: v || undefined })} options={[{ value: '', label: 'Any' }, { value: 'planned', label: 'Planned' }, { value: 'unplanned', label: 'Not planned' }]} />
      </FilterBar>
      <DataTable
        columns={[
          { key: 'date', header: 'Date', className: 'whitespace-nowrap', render: (r) => formatDate(r.shiftDate) },
          { key: 'shift', header: 'Shift', render: (r) => r.shiftName },
          { key: 'sup', header: 'Shift Supervisor', render: (r) => r.supervisor ?? <span className="text-slate-400">—</span> },
          { key: 'off', header: 'Control Room Officer', render: (r) => r.officer ?? <span className="text-slate-400">—</span> },
          { key: 'status', header: 'Status', render: (r) => (!r.planned ? <Badge tone="amber">Not planned</Badge> : r.needsReassign ? <Badge tone="red">Reassign</Badge> : <Badge tone="green">Planned</Badge>) },
        ]}
        rows={list}
        rowKey={(r) => r.key}
        empty={<EmptyState title="No shifts match" />}
      />
    </div>
  )
}
