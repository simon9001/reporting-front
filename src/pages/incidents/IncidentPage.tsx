import { incidentPlace } from '@sr/shared'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useDeleteIncident, useIncident } from '../../api/incidents'
import { Skeleton } from '../../components/EmptyState'
import { Alert, Button, Card, PageHeader } from '../../components/ui'
import { ApiError, errorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { IncidentDetail } from './IncidentDetail'
import { IncidentFormDrawer } from './IncidentFormDrawer'

export function IncidentPage() {
  const { ref: rawRef = '' } = useParams()
  const ref = rawRef.trim().toUpperCase()
  const q = useIncident(ref)
  const remove = useDeleteIncident()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  return (
    <>
      <Link to="/incidents" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft className="size-4" />Incident explorer</Link>
      {q.isPending ? <Skeleton rows={8} /> : q.isError ? (
        <Alert>{q.error instanceof ApiError && q.error.status === 404 ? 'Incident not found' : q.error instanceof ApiError && q.error.status === 403 ? "You don't have access to this incident" : errorMessage(q.error)}</Alert>
      ) : (
        <>
          <PageHeader
            title={q.data.ref}
            description={`${q.data.category.value} at ${incidentPlace(q.data)} · ${formatDateTime(q.data.occurredAt)}`}
            actions={q.data.canEdit && (
              <>
                {q.data.canDelete && (
                  <Button variant="secondary" disabled={remove.isPending} onClick={() => { if (confirm(`Delete ${q.data.ref}? This cannot be undone.`)) remove.mutate(q.data.id, { onSuccess: () => navigate('/incidents', { replace: true }) }) }}>
                    <Trash2 className="size-4" />Delete
                  </Button>
                )}
                <Button onClick={() => setEditing(true)}><Pencil className="size-4" />Edit</Button>
              </>
            )}
          />
          {remove.isError && <Alert>{errorMessage(remove.error)}</Alert>}
          <Card><IncidentDetail incident={q.data} /></Card>
          <IncidentFormDrawer open={editing} onClose={() => setEditing(false)} incident={q.data} onSaved={() => setEditing(false)} />
        </>
      )}
    </>
  )
}
