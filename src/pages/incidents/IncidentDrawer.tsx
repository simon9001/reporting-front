import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useDeleteIncident, useIncident } from '../../api/incidents'
import { Drawer } from '../../components/Drawer'
import { Skeleton } from '../../components/EmptyState'
import { Alert, Button } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { IncidentDetail } from './IncidentDetail'
import { IncidentFormDrawer } from './IncidentFormDrawer'

export function IncidentDrawer({ idOrRef, onClose }: { idOrRef: string | null; onClose: () => void }) {
  const q = useIncident(idOrRef)
  const remove = useDeleteIncident()
  const [editing, setEditing] = useState(false)
  const incident = q.data
  const close = () => { remove.reset(); onClose() }
  const deleteIncident = () => {
    if (incident && confirm(`Delete ${incident.ref}? This cannot be undone.`)) remove.mutate(incident.id, { onSuccess: close })
  }
  return (
    <>
      <Drawer
        open={!!idOrRef}
        onClose={close}
        wide
        title={
          <span className="flex items-center gap-3">
            <span>{incident?.ref ?? 'Incident'}</span>
            {incident && <Link to={`/incidents/${incident.ref}`} className="inline-flex items-center gap-1 text-xs font-medium text-link hover:underline"><ExternalLink className="size-3.5" />Open full page</Link>}
          </span>
        }
        footer={incident?.canEdit ? (
          <div className="flex items-center justify-end gap-2">
            {incident.canDelete && <Button variant="secondary" onClick={deleteIncident} disabled={remove.isPending}><Trash2 className="size-4" />Delete</Button>}
            <Button onClick={() => setEditing(true)}><Pencil className="size-4" />Edit</Button>
          </div>
        ) : undefined}
      >
        {remove.isError && <div className="mb-3"><Alert>{errorMessage(remove.error)}</Alert></div>}
        {q.isPending ? <Skeleton rows={8} /> : q.isError ? <Alert>{errorMessage(q.error)}</Alert> : <IncidentDetail incident={q.data} />}
      </Drawer>
      {incident && <IncidentFormDrawer open={editing} onClose={() => setEditing(false)} incident={incident} onSaved={() => setEditing(false)} />}
    </>
  )
}
