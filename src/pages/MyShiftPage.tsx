import { useMe } from '../auth/hooks'
import { OnDutyCard } from '../components/OnDutyCard'
import { Alert, PageHeader } from '../components/ui'
import { useNow } from '../lib/useNow'

export function MyShiftPage() {
  const { data } = useMe()
  const now = useNow()
  const currentShift = data?.currentShift ?? null
  const role = currentShift?.myRole ?? null

  return (
    <div className="space-y-6">
      <PageHeader title="My Shift" />
      {role === 'SUPERVISOR' && <Alert tone="success">You are the Shift Supervisor for this shift.</Alert>}
      {role === 'OFFICER' && <Alert tone="info">You are the Control Room Officer for this shift.</Alert>}
      {role === null && <Alert tone="info">You are not on the current shift. You can view records but cannot log entries for it.</Alert>}
      <OnDutyCard currentShift={currentShift} now={now} canPlan={false} />
    </div>
  )
}
