import type { AuditLogDto } from '@sr/shared'
import { useAuditLog } from '../../api/audit'
import { DataTable, Pagination } from '../../components/DataTable'
import { DateRangePicker } from '../../components/DateRangePicker'
import { EmptyState } from '../../components/EmptyState'
import { FilterBar } from '../../components/FilterBar'
import { Alert, Badge, Card, PageHeader, Select } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { formatDateTime, todayLocal } from '../../lib/format'
import { useUrlFilters } from '../../lib/urlFilters'
import { recordNumberFilter } from './auditFilters'

const ENTITIES = ['User', 'Shift', 'Incident', 'IncidentAttachment', 'ShiftDefinition', 'EscalationRule', 'SystemSetting', 'LookupItem', 'Vehicle']

export function AuditPage() {
  const { values, set, clear } = useUrlFilters(['entityId', 'entity', 'from', 'to', 'page'])
  const page = Number(values.page ?? 1) || 1
  const record = recordNumberFilter(values.entityId)
  const log = useAuditLog({ entity: values.entity, entityId: record.value, from: values.from, to: values.to, page })
  const period = values.from && values.to ? { from: values.from, to: values.to } : null
  const items = log.data?.items ?? []

  return (
    <>
      <PageHeader title="Audit log" description="Every change, sign-in and sign-out, newest first." />
      <Card>
        <div className="space-y-4">
          <FilterBar search={values.entityId ?? ''} onSearchChange={(v) => set({ entityId: v || undefined })} placeholder="Record number (e.g. 42)…" canClear={!!(values.entityId || values.entity || values.from || values.to)} onClear={clear}>
            <Select aria-label="Record type" className="w-auto" value={values.entity ?? ''} onChange={(e) => set({ entity: e.target.value || undefined })}>
              <option value="">All record types</option>
              {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
            <DateRangePicker value={period} onChange={(p) => set({ from: p?.from, to: p?.to })} today={todayLocal()} />
          </FilterBar>
          {record.invalid && <p role="status" className="text-sm text-amber-700">Enter a whole record number greater than zero, such as 42. The filter is not applied yet.</p>}
          {log.isError && <Alert>{errorMessage(log.error)}</Alert>}
          <DataTable<AuditLogDto>
            columns={[
              { key: 'at', header: 'When', className: 'whitespace-nowrap', render: (r) => formatDateTime(r.at) },
              { key: 'who', header: 'Who', render: (r) => r.user?.fullName ?? 'System' },
              { key: 'action', header: 'Action', render: (r) => <Badge>{r.action}</Badge> },
              { key: 'record', header: 'Record', render: (r) => `${r.entity}${r.entityId ? ` #${r.entityId}` : ''}` },
              {
                key: 'details', header: 'Details', render: (r) => (r.before !== null || r.after !== null) && (
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-link">Show</summary>
                    <pre className="mt-2 max-w-xl overflow-x-auto rounded-md bg-slate-50 p-2 text-xs">{JSON.stringify({ before: r.before, after: r.after }, null, 2)}</pre>
                  </details>
                ),
              },
            ]}
            rows={items}
            rowKey={(r) => r.id}
            loading={log.isPending}
            empty={<EmptyState title="No entries match" />}
          />
          {log.data && log.data.total > 0 && <Pagination page={page} pageSize={log.data.pageSize} total={log.data.total} onPageChange={(p) => set({ page: String(p) })} />}
        </div>
      </Card>
    </>
  )
}
