import { INCIDENT_STATUS_LABELS, INCIDENT_STATUSES, SEVERITIES, SEVERITY_LABELS } from '@sr/shared'
import { Download, Paperclip } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useShiftDefinitions, useLookups } from '../../api/config'
import { useIncidents } from '../../api/incidents'
import { useMe } from '../../auth/hooks'
import { DataTable, Pagination } from '../../components/DataTable'
import { DateRangePicker } from '../../components/DateRangePicker'
import { EmptyState } from '../../components/EmptyState'
import { FilterBar } from '../../components/FilterBar'
import { MultiSelect } from '../../components/MultiSelect'
import { filterButtonClass } from '../../components/Popover'
import { Segmented } from '../../components/Segmented'
import { Alert, Badge, Card, cx, PageHeader } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { downloadFile } from '../../lib/download'
import { todayLocal } from '../../lib/format'
import { csvToList, listToCsv, useUrlFilters } from '../../lib/urlFilters'
import { incidentColumns } from './columns'
import { EXPLORER_KEYS, explorerQuery, FILTER_KEYS, hasActiveFilters, lastPage } from './explorerQuery'
import { IncidentDrawer } from './IncidentDrawer'

export function IncidentExplorerPage() {
  const { values, set, clear } = useUrlFilters(EXPLORER_KEYS, FILTER_KEYS)
  const { data: me } = useMe()
  const categories = useLookups('CATEGORY')
  const locations = useLookups('LOCATION')
  const defs = useShiftDefinitions()
  const query = explorerQuery(values)
  const list = useIncidents(query)
  const leader = me?.user.role === 'DEPUTY_DIRECTOR' || me?.user.role === 'ADMIN'
  const exportQuery = { ...query, page: undefined, pageSize: undefined }
  const period = values.from && values.to ? { from: values.from, to: values.to } : null
  const keepPage = { page: values.page }
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  const total = list.data?.total ?? 0
  const last = lastPage(total, query.pageSize)
  useEffect(() => {
    if (total > 0 && query.page > last) set({ page: String(last) })
  }, [total, query.page, last, set])

  async function runExport() {
    setExporting(true)
    setExportError(null)
    setTruncated(false)
    try {
      const r = await downloadFile('/incidents/export.xlsx', exportQuery)
      setTruncated(r.truncated)
    } catch (e) {
      setExportError(errorMessage(e))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Incident explorer"
        description={list.data ? `${list.data.total} incident${list.data.total === 1 ? '' : 's'} match` : 'Every incident ever recorded'}
        actions={leader && (
          <button type="button" onClick={runExport} disabled={exporting} aria-busy={exporting} className={filterButtonClass}>
            <Download className="size-4 text-slate-500" />{exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        )}
      />
      <Card>
        <div className="space-y-4">
          <FilterBar
            search={values.q ?? ''}
            onSearchChange={(q) => set({ q: q || undefined })}
            placeholder="Search ID, description, location, officer…"
            canClear={hasActiveFilters(values)}
            onClear={clear}
          >
            <DateRangePicker value={period} onChange={(p) => set({ from: p?.from, to: p?.to })} today={todayLocal()} />
            <MultiSelect label="Severity" options={[...SEVERITIES].reverse().map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))} value={csvToList(values.severity)} onChange={(v) => set({ severity: listToCsv(v) })} />
            <MultiSelect label="Status" options={INCIDENT_STATUSES.map((s) => ({ value: s, label: INCIDENT_STATUS_LABELS[s] }))} value={csvToList(values.status)} onChange={(v) => set({ status: listToCsv(v) })} />
            <MultiSelect label="Category" options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.value }))} value={csvToList(values.categoryId)} onChange={(v) => set({ categoryId: listToCsv(v) })} />
            <MultiSelect label="Location" options={(locations.data ?? []).map((l) => ({ value: String(l.id), label: l.value }))} value={csvToList(values.locationId)} onChange={(v) => set({ locationId: listToCsv(v) })} />
            <Segmented
              label="Shift"
              value={values.shiftCode ?? ''}
              onChange={(v) => set({ shiftCode: v || undefined })}
              options={[{ value: '', label: 'Any shift' }, ...(defs.data ?? []).filter((d) => d.isActive).map((d) => ({ value: d.code, label: d.name }))]}
            />
            <button
              type="button"
              aria-pressed={values.hasAttachments === 'true'}
              onClick={() => set({ hasAttachments: values.hasAttachments === 'true' ? undefined : 'true' })}
              className={cx(filterButtonClass, values.hasAttachments === 'true' && 'border-brand-600 bg-brand-50 text-brand-700')}
            >
              <Paperclip className="size-4" />Has snapshots
            </button>
          </FilterBar>
          {values.shiftId && <Badge tone="blue">Showing one shift only <button type="button" className="ml-1 font-semibold" onClick={() => set({ shiftId: undefined })} aria-label="Show all shifts">×</button></Badge>}
          {exportError && <Alert>{exportError}</Alert>}
          {truncated && <Alert tone="warning">Only the first 10,000 rows were exported. Narrow the filters to export everything.</Alert>}
          {list.isError && <Alert>{errorMessage(list.error)}</Alert>}
          <DataTable
            columns={incidentColumns()}
            rows={list.data?.items ?? []}
            rowKey={(i) => i.id}
            loading={list.isPending}
            sort={query.sort}
            onSortChange={(sort) => set({ sort })}
            onRowClick={(i) => set({ open: i.ref, ...keepPage })}
            rowLabel={(i) => `Open ${i.ref}`}
            empty={<EmptyState title="No incidents match" description="Try a wider date range or fewer filters." action={hasActiveFilters(values) ? <button type="button" className="text-sm font-medium text-brand-700" onClick={clear}>Clear filters</button> : undefined} />}
          />
          {list.data && list.data.total > 0 && <Pagination page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPageChange={(p) => set({ page: String(p) })} />}
        </div>
      </Card>
      <IncidentDrawer idOrRef={values.open ?? null} onClose={() => set({ open: undefined, ...keepPage })} />
    </>
  )
}
