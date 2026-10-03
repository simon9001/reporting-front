import { useState } from 'react'
import { useAuditLog } from '../../api/audit'
import { Alert, Button, Card, Field, Input, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/format'

const ENTITIES = ['User', 'Shift', 'ShiftDefinition', 'EscalationRule', 'SystemSetting', 'LookupItem', 'Vehicle']

export function AuditPage() {
  const [entity, setEntity] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const log = useAuditLog({ entity: entity || undefined, from: from || undefined, to: to || undefined, page })
  const pages = log.data ? Math.max(1, Math.ceil(log.data.total / log.data.pageSize)) : 1

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Every change, sign-in and sign-out, newest first." />
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Record type">
            <Select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1) }}>
              <option value="">All</option>
              {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </Field>
          <Field label="From"><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} /></Field>
          <Field label="To"><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} /></Field>
        </div>
      </Card>
      <Card title={log.data ? `${log.data.total} entries` : 'Entries'}>
        {log.isPending ? <Spinner /> : log.isError ? <Alert>{errorMessage(log.error)}</Alert> : (
          <div className="space-y-3">
            <Table head={['When', 'Who', 'Action', 'Record', 'Details']}>
              {log.data.items.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-2">{formatDateTime(row.at)}</td>
                  <td className="px-3 py-2">{row.user?.fullName ?? 'System'}</td>
                  <td className="px-3 py-2">{row.action}</td>
                  <td className="px-3 py-2">{row.entity}{row.entityId ? ` #${row.entityId}` : ''}</td>
                  <td className="px-3 py-2">
                    {(row.before !== null || row.after !== null) && (
                      <details>
                        <summary className="cursor-pointer text-brand-600">Show</summary>
                        <pre className="mt-2 max-w-xl overflow-x-auto rounded bg-slate-50 p-2 text-xs">{JSON.stringify({ before: row.before, after: row.after }, null, 2)}</pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
            <div className="flex items-center gap-2 text-sm">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span>Page {page} of {pages}</span>
              <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
