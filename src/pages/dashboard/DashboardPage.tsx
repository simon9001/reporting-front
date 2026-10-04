import type { AttentionItemDto } from '@sr/shared'
import { useState, type ReactNode } from 'react'
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
import { Alert, Badge, Card, PageHeader } from '../../components/ui'
import { describeDelta } from '../../lib/deltas'
import { formatDate, formatDateTime, greeting, todayLocal } from '../../lib/format'
import { detectPreset, PRESET_LABELS, presetPeriod, PRESETS, type Period, type PeriodPreset } from '../../lib/periods'
import { errorMessage } from '../../lib/api'
import { useNow } from '../../lib/useNow'
import { useUrlFilters } from '../../lib/urlFilters'
import { IncidentDrawer } from '../incidents/IncidentDrawer'
import { clampRange, dayNightLink, drillRange, explorerLink, resolvePeriod } from './chartData'
import { CategoryBars, DayNightBars, SeverityDonut, TrendChart } from './charts'

export function DashboardPage() {
  const { data: me } = useMe()
  const now = useNow()
  const navigate = useNavigate()
  const today = todayLocal(now)
  const { values, set } = useUrlFilters(['from', 'to'])
  const { period, invalid } = resolvePeriod(values.from, values.to, presetPeriod('month', today))
  const a = useAnalytics(period)
  const [openRef, setOpenRef] = useState<string | null>(null)
  const preset = detectPreset(period, today)
  const s = a.summary.data
  const card = <T,>(q: { data?: T; isError: boolean; error: unknown }, rows: number, render: (d: T) => ReactNode) =>
    q.isError ? <Alert>{errorMessage(q.error)}</Alert> : q.data !== undefined ? render(q.data) : <Skeleton rows={rows} />
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

      {invalid && <p role="status" className="text-sm text-amber-700">Showing this month — choose a period of at most one year.</p>}

      {a.summary.isError && <Alert>{errorMessage(a.summary.error)}</Alert>}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_repeat(4,1fr)]">
        <OnDutyCard currentShift={me?.currentShift ?? null} now={now} canPlan />
        <StatCard label="Total incidents" value={s?.total.current ?? '—'} delta={s ? describeDelta(s.total, 'percent', 'lower') : null} hint={s && describeDelta(s.total, 'percent', 'lower') ? 'vs previous' : undefined} onClick={() => drill({})} />
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
          {card(a.trend, 6, (t) => {
            const range = (b: string) => clampRange(drillRange(b, t.granularity), period)
            return <TrendChart data={t} onBucketClick={(b) => drill({}, range(b))} bucketHref={(b) => explorerLink(range(b))} />
          })}
        </Card>
        <Card title="By severity">
          {card(a.severity, 4, (d) => <SeverityDonut data={d} onSliceClick={(sev) => drill({ severity: sev })} />)}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Most occurring categories">
          {card(a.categories, 4, (d) => <CategoryBars data={d} onBarClick={(id) => drill({ categoryId: id })} barHref={(id) => explorerLink(period, { categoryId: id })} />)}
        </Card>
        <Card title="Hotspot locations">
          {card(a.hotspots, 4, (hs) => hs.length === 0 ? <EmptyState title="No incidents" /> : (
            <ul className="divide-y divide-slate-100">
              {hs.map((h) => (
                <li key={h.key}>
                  <button type="button" onClick={() => drill(h.drill)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:bg-brand-50/50">
                    <span><span className="font-medium text-slate-800">{h.location}</span>{h.topCategory && <span className="block text-xs text-slate-500">Mostly {h.topCategory}</span>}</span>
                    <span className="text-lg font-semibold text-slate-900">{h.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </Card>
        <Card title="Day vs Night shift">
          {card(a.dayNight, 4, (d) => <DayNightBars data={d} onBarClick={(w, code) => navigate(dayNightLink(w, code, period))} barHref={(w, code) => dayNightLink(w, code, period)} />)}
        </Card>
      </div>

      <Card title="Needs your attention" actions={<Link to="/incidents?severity=CRITICAL,HIGH&status=OPEN,IN_PROGRESS,MONITORING" className="text-sm font-medium text-brand-700 hover:underline">All open critical / high</Link>}>
        {a.attention.isError ? <Alert>{errorMessage(a.attention.error)}</Alert> : <DataTable
          columns={attentionColumns}
          rows={a.attention.data ?? []}
          rowKey={(i) => i.id}
          loading={a.attention.isPending}
          onRowClick={(i) => setOpenRef(i.ref)}
          rowLabel={(i) => `Open ${i.ref}`}
          empty={<EmptyState title="Nothing needs attention" description="No open critical or high incidents." />}
        />}
      </Card>

      <IncidentDrawer idOrRef={openRef} onClose={() => setOpenRef(null)} />
    </>
  )
}
