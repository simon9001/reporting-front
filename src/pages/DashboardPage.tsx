import { Link } from 'react-router'
import { useMe } from '../auth/hooks'
import { OnDutyCard } from '../components/OnDutyCard'
import { Card, PageHeader } from '../components/ui'
import { useNow } from '../lib/useNow'

export function DashboardPage() {
  const { data } = useMe()
  const now = useNow()
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Who is on duty right now." />
      <OnDutyCard currentShift={data?.currentShift ?? null} now={now} canPlan />
      <Card title="Roster">
        <Link to="/roster" className="text-sm font-medium text-brand-600 underline">Plan Day and Night shifts</Link>
      </Card>
    </div>
  )
}
