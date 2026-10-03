import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useIncidents } from '../api/incidents'
import { useMe } from '../auth/hooks'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { OnDutyCard } from '../components/OnDutyCard'
import { Alert, Button, Card, PageHeader } from '../components/ui'
import { greeting } from '../lib/format'
import { useNow } from '../lib/useNow'
import { incidentColumns } from './incidents/columns'
import { IncidentDrawer } from './incidents/IncidentDrawer'
import { IncidentFormDrawer } from './incidents/IncidentFormDrawer'
import { UpcomingShifts } from './UpcomingShifts'

export function MyShiftPage() {
  const { data } = useMe()
  const now = useNow()
  const [logging, setLogging] = useState(false)
  const [openRef, setOpenRef] = useState<string | null>(null)
  const currentShift = data?.currentShift ?? null
  const role = currentShift?.myRole ?? null
  const shiftId = currentShift?.shift?.id
  const incidents = useIncidents({ shiftId, sort: '-occurredAt', pageSize: 25 }, { enabled: !!shiftId })
  const firstName = data?.user.fullName.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        title={`Good ${greeting(now)}, ${firstName}`}
        description="Your shift at a glance. Everything here updates by itself."
        actions={role && <Button onClick={() => setLogging(true)}><Plus className="size-4" />Log incident</Button>}
      />
      {role === null && <Alert tone="info">You are not on the current shift. You can view records but cannot log entries for it.</Alert>}
      <OnDutyCard currentShift={currentShift} now={now} canPlan={false} myRole={role} />
      {shiftId && (
        <Card title="This shift's incidents" actions={<Link to={`/incidents?shiftId=${shiftId}`} className="text-sm font-medium text-brand-700 hover:underline">Open in explorer</Link>}>
          <DataTable
            columns={incidentColumns({ showShift: false })}
            rows={incidents.data?.items ?? []}
            rowKey={(i) => i.id}
            loading={incidents.isPending}
            onRowClick={(i) => setOpenRef(i.ref)}
            rowLabel={(i) => `Open ${i.ref}`}
            empty={<EmptyState title="No incidents logged on this shift yet" description={role ? 'Use “Log incident” as soon as something happens.' : undefined} />}
          />
        </Card>
      )}
      {data && <UpcomingShifts userId={data.user.id} now={now} />}
      <IncidentFormDrawer open={logging} onClose={() => setLogging(false)} onSaved={(dto) => { setLogging(false); setOpenRef(dto.ref) }} />
      <IncidentDrawer idOrRef={openRef} onClose={() => setOpenRef(null)} />
    </>
  )
}
