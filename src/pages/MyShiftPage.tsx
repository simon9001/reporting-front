import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useIncidents } from '../api/incidents'
import { useMe } from '../auth/hooks'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { OnDutyCard } from '../components/OnDutyCard'
import { Alert, Button, Card, PageHeader } from '../components/ui'
import { formatDate, greeting } from '../lib/format'
import { useNow } from '../lib/useNow'
import { incidentColumns } from './incidents/columns'
import { canLogIncidents } from './incidents/incidentForm'
import { IncidentDrawer } from './incidents/IncidentDrawer'
import { IncidentFormDrawer } from './incidents/IncidentFormDrawer'
import { UpcomingShifts } from './UpcomingShifts'

function SideCounts({ shiftId }: { shiftId: number }) {
  const s = useIncidents({ shiftId, side: 'STATIC', pageSize: 25 })
  const m = useIncidents({ shiftId, side: 'MOBILE', pageSize: 25 })
  if (!s.data || !m.data) return null
  return <span className="font-normal text-slate-500"> · Static {s.data.total} · Mobile {m.data.total}</span>
}

function ShiftIncidents({ title, shiftId, emptyHint, onOpen }: { title: ReactNode; shiftId: number; emptyHint?: string; onOpen: (ref: string) => void }) {
  const incidents = useIncidents({ shiftId, sort: '-occurredAt', pageSize: 25 })
  return (
    <Card title={<>{title}<SideCounts shiftId={shiftId} /></>} actions={<Link to={`/incidents?shiftId=${shiftId}`} className="text-sm font-medium text-brand-700 hover:underline">Open in explorer</Link>}>
      <DataTable
        columns={incidentColumns({ showShift: false })}
        rows={incidents.data?.items ?? []}
        rowKey={(i) => i.id}
        loading={incidents.isPending}
        onRowClick={(i) => onOpen(i.ref)}
        rowLabel={(i) => `Open ${i.ref}`}
        empty={<EmptyState title="No incidents logged on this shift yet" description={emptyHint} />}
      />
    </Card>
  )
}

export function MyShiftPage() {
  const { data } = useMe()
  const now = useNow()
  const [logging, setLogging] = useState(false)
  const [openRef, setOpenRef] = useState<string | null>(null)
  const currentShift = data?.currentShift ?? null
  const previousShift = data?.previousShift ?? null
  const role = currentShift?.myRole ?? null
  const shiftId = currentShift?.shift?.id
  const canLog = canLogIncidents(data)
  const firstName = data?.user.fullName.split(' ')[0] ?? ''
  const previousName = previousShift ? `${previousShift.shiftName.toLowerCase()} shift of ${formatDate(previousShift.shiftDate)}` : ''

  return (
    <>
      <PageHeader
        title={`Good ${greeting(now)}, ${firstName}`}
        description="Your shift at a glance. Everything here updates by itself."
        actions={canLog && <Button onClick={() => setLogging(true)}><Plus className="size-4" />Log incident</Button>}
      />
      {role === null && !previousShift && <Alert tone="info">You are not on the current shift. You can view records but cannot log entries for it.</Alert>}
      {role === null && previousShift && <Alert tone="info">You are not on the current shift, but you can still log late entries for the {previousName}.</Alert>}
      <OnDutyCard currentShift={currentShift} now={now} canPlan={false} myRole={role} />
      {shiftId && <ShiftIncidents title="This shift's incidents" shiftId={shiftId} emptyHint={role ? 'Use “Log incident” as soon as something happens.' : undefined} onOpen={setOpenRef} />}
      {previousShift && (
        <ShiftIncidents
          title={<>Previous shift <span className="font-normal text-slate-500">· {previousShift.shiftName}, {formatDate(previousShift.shiftDate)} · late entries allowed</span></>}
          shiftId={previousShift.id}
          emptyHint="Anything that happened on that shift can still be logged with its real time."
          onOpen={setOpenRef}
        />
      )}
      {data && <UpcomingShifts userId={data.user.id} now={now} />}
      <IncidentFormDrawer open={logging} onClose={() => setLogging(false)} onSaved={(dto) => { setLogging(false); setOpenRef(dto.ref) }} />
      <IncidentDrawer idOrRef={openRef} onClose={() => setOpenRef(null)} />
    </>
  )
}
