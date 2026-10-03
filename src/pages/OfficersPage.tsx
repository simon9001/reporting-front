import { useUsers } from '../api/users'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { FilterBar } from '../components/FilterBar'
import { Segmented } from '../components/Segmented'
import { Alert, Badge, Card, PageHeader } from '../components/ui'
import { errorMessage } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { useUrlFilters } from '../lib/urlFilters'
import { filterUsers } from './admin/userFilters'

export function OfficersPage() {
  const { values, set, clear } = useUrlFilters(['q', 'status'])
  const users = useUsers({ role: 'OFFICER' })
  const status = (values.status ?? 'active') as 'active' | 'inactive' | 'all'
  const rows = filterUsers(users.data ?? [], { q: values.q, status: status === 'all' ? undefined : status })
  return (
    <>
      <PageHeader title="Officers" description="Control Room Officers who can be rostered as Shift Supervisor or Officer." />
      <Card>
        <div className="space-y-4">
          <FilterBar search={values.q ?? ''} onSearchChange={(q) => set({ q: q || undefined })} placeholder="Search name or email…" canClear={!!values.q || !!values.status} onClear={clear}>
            <Segmented label="Status" value={status} onChange={(v) => set({ status: v === 'active' ? undefined : v })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'all', label: 'All' }]} />
          </FilterBar>
          {users.isError && <Alert>{errorMessage(users.error)}</Alert>}
          <DataTable
            columns={[
              { key: 'name', header: 'Name', render: (u) => <span className="font-medium text-slate-900">{u.fullName}</span> },
              { key: 'email', header: 'Email', render: (u) => u.email },
              { key: 'status', header: 'Status', render: (u) => (u.isActive ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>) },
              { key: 'login', header: 'Last sign-in', render: (u) => (u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—') },
            ]}
            rows={rows}
            rowKey={(u) => u.id}
            loading={users.isPending}
            empty={<EmptyState title="No officers match" />}
          />
        </div>
      </Card>
    </>
  )
}
