import type { AttentionItemDto } from '@sr/shared'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAnalytics } from '../../api/analytics'
import { useMe } from '../../auth/hooks'
import { SeverityBadge, StatusBadge } from '../../components/badges'
import { DataTable } from '../../components/DataTable'
import { DateRangePicker } from '../../components/DateRangePicker'
import { EmptyState, Skeleton } from '../../components/EmptyState'
import { OnDutyCard } from '../../components/OnDutyCard'
import { Segmented } from '../../components/Segmented'
import { StatCard } from '../../components/StatCard'
import { Badge, Card, PageHeader } from '../../components/ui'
import { describeDelta } from '../../lib/deltas'
import { formatDate, formatDateTime, greeting, todayLocal } from '../../lib/format'
import { detectPreset, PRESET_LABELS, presetPeriod, PRESETS, type Period, type PeriodPreset } from '../../lib/periods'
import { useNow } from '../../lib/useNow'
import { useUrlFilters } from '../../lib/urlFilters'
import { IncidentDrawer } from '../incidents/IncidentDrawer'
import { drillRange, explorerLink } from './chartData'
import { CategoryBars, DayNightBars, SeverityDonut, TrendChart } from './charts'

export function DashboardPage() {
  const { data: me } = useMe()
  const now = useNow()
  const navigate = useNavigate()
  const today = todayLocal(now)
  const { values, set } = useUrlFilters(['from', 'to'])
  const period: Period = values.from && values.to ? { from: values.from, to: values.to } : presetPeriod('month', today)
  const a = useAnalytics(period)
  const [openRef, setOpenRef] = useState<string | null>(null)
  const preset = detectPreset(period, today)
  const s = a.summary.data
  const drill = (extra: Record<string, string>, range: Period = period) => navigate(explorerLink(range, extra))

  const attentionColumns = [
    { key: 'ref', header: 'Incident', render: (i: AttentionItemDto) => <span className="font-semibold text-slate-900">{i.ref}</span> },
    { key: 'when', header: 'When', render: (i: AttentionItemDto) => <span className="whitespace-nowrap">{formatDateTime(i.occurredAt)}</span> },
    { key: 'where', header: 'Location', render: (i: AttentionItemDto) => i.location },
    { key: 'cat', header: 'Category', render: (i: AttentionItemDto) => i.category },
    { key: 'sev', header: 'Severity', render: (i: AttentionItemDto) => <SeverityBadge severity={i.severity} /> },
    { key: 'status', header: 'Status', render: (i: AttentionItemDto) => <StatusBadge status={i.status} /> },
    { key: 'why', header: 'Why', render: (i: AttentionItemDto) => <span className="flex flex-wrap gap-1">{i.reasons.length ? i.reasons.map((r) => <Badge key={r} tone="red">{r}</Badge>) : <span className="text-slate-400">Open</span>}</span> },
  ]

  return (
    <>
      <PageHeader
        title={`Good ${greeting(now)}, ${me?.user.fullName.split(' ')[0] ?? ''}`}
        description={`Incident overview · ${formatDate(period.from)} – ${formatDate(period.to)}${s ? ` · compared with ${formatDate(s.previousFrom)} – ${formatDate(s.previousTo)}` : ''}`}
        actions={
          <>
            <Segmented<PeriodPreset>
              label="Period"
              value={preset}
              onChange={(p) => { if (p !== 'custom') { const r = presetPeriod(p, today); set({ from: r.from, to: r.to }) } }}
              options={PRESETS.map((p) => ({ value: p, label: PRESET_LABELS[p] }))}
            />
            <DateRangePicker value={period} onChange={(p) => p && set({ from: p.from, to: p.to })} today={today} allowAll={false} />
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_repeat(4,1fr)]">
        <OnDutyCard currentShift={me?.currentShift ?? null} now={now} canPlan />
        <StatCard label="Total incidents" value={s?.total.current ?? '—'} delta={s ? describeDelta(s.total, 'percent', 'lower') : null} hint="vs previous" onClick={() => drill({})} />
        <StatCard
          label="Open critical / high"
          value={s?.openCriticalHigh ?? '—'}
          hint={s && s.openCriticalHighOver24h > 0 ? `${s.openCriticalHighOver24h} over 24 h old` : 'right now'}
          onClick={() => navigate('/incidents?severity=CRITICAL,HIGH&status=OPEN,IN_PROGRESS,MONITORING')}
        />
        <StatCard label="Avg. time to resolve" value={s?.avgMinutesToResolve.current != null ? `${s.avgMinutesToResolve.current} min` : '—'} delta={s ? describeDelta(s.avgMinutesToResolve, 'minutes', 'lower') : null} />
        <StatCard label="Escalated on time" value={s?.escalatedOnTimePct.current != null ? `${s.escalatedOnTimePct.current}%` : '—'} delta={s ? describeDelta(s.escalatedOnTimePct, 'points', 'higher') : null} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Incidents over time" className="xl:col-span-2">
          {a.trend.data ? <TrendChart data={a.trend.data} onBucketClick={(b) => drill({}, drillRange(b, a.trend.data!.granularity))} /> : <Skeleton rows={6} />}
        </Card>
        <Card title="By severity">
          {a.severity.data ? <SeverityDonut data={a.severity.data} onSliceClick={(sev) => drill({ severity: sev })} /> : <Skeleton rows={4} />}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Most occurring categories">
          {a.categories.data ? <CategoryBars data={a.categories.data} onBarClick={(id) => drill({ categoryId: id })} /> : <Skeleton rows={4} />}
        </Card>
        <Card title="Hotspot locations">
          {!a.hotspots.data ? <Skeleton rows={4} /> : a.hotspots.data.length === 0 ? <EmptyState title="No incidents" /> : (
            <ul className="divide-y divide-slate-100">
              {a.hotspots.data.map((h) => (
                <li key={h.locationId}>
                  <button type="button" onClick={() => drill({ locationId: String(h.locationId) })} className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:bg-brand-50/50">
                    <span><span className="font-medium text-slate-800">{h.location}</span>{h.topCategory && <span className="block text-xs text-slate-500">Mostly {h.topCategory}</span>}</span>
                    <span className="text-lg font-semibold text-slate-900">{h.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Day vs Night shift">
          {a.dayNight.data ? <DayNightBars data={a.dayNight.data} /> : <Skeleton rows={4} />}
        </Card>
      </div>

      <Card title="Needs your attention" actions={<Link to="/incidents?severity=CRITICAL,HIGH&status=OPEN,IN_PROGRESS,MONITORING" className="text-sm font-medium text-brand-700 hover:underline">All open critical / high</Link>}>
        <DataTable
          columns={attentionColumns}
          rows={a.attention.data ?? []}
          rowKey={(i) => i.id}
          loading={a.attention.isPending}
          onRowClick={(i) => setOpenRef(i.ref)}
          rowLabel={(i) => `Open ${i.ref}`}
          empty={<EmptyState title="Nothing needs attention" description="No open critical or high incidents." />}
        />
      </Card>

      <IncidentDrawer idOrRef={openRef} onClose={() => setOpenRef(null)} />
    </>
  )
}
