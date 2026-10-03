import { ExternalLink, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useIncident } from '../../api/incidents'
import { Drawer } from '../../components/Drawer'
import { Skeleton } from '../../components/EmptyState'
import { Alert, Button } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { IncidentDetail } from './IncidentDetail'
import { IncidentFormDrawer } from './IncidentFormDrawer'

export function IncidentDrawer({ idOrRef, onClose }: { idOrRef: string | null; onClose: () => void }) {
  const q = useIncident(idOrRef)
  const [editing, setEditing] = useState(false)
  const incident = q.data
  return (
    <>
      <Drawer
        open={!!idOrRef}
        onClose={onClose}
        wide
        title={
          <span className="flex items-center gap-3">
            <span>{incident?.ref ?? 'Incident'}</span>
            {incident && <Link to={`/incidents/${incident.ref}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"><ExternalLink className="size-3.5" />Open full page</Link>}
          </span>
        }
        footer={incident?.canEdit ? <Button onClick={() => setEditing(true)}><Pencil className="size-4" />Edit</Button> : undefined}
      >
        {q.isPending ? <Skeleton rows={8} /> : q.isError ? <Alert>{errorMessage(q.error)}</Alert> : <IncidentDetail incident={q.data} />}
      </Drawer>
      {incident && <IncidentFormDrawer open={editing} onClose={() => setEditing(false)} incident={incident} onSaved={() => setEditing(false)} />}
    </>
  )
}
