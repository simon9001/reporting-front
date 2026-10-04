import { INCIDENT_SIDE_SHORT, INCIDENT_SIDES, type AttentionItemDto, type HotspotDto, type IncidentSide } from '@sr/shared'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAnalytics } from '../../api/analytics'
import { useMe } from '../../auth/hooks'
import { SeverityBadge, SideBadge, StatusBadge } from '../../components/badges'
import { DataTable } from '../../components/DataTable'
import { DateRangePicker } from '../../components/DateRangePicker'
import { EmptyState, Skeleton } from '../../components/EmptyState'
import { OnDutyCard } from '../../components/OnDutyCard'
import { Segmented } from '../../components/Segmented'
import { StatCard } from '../../components/StatCard'
import { Alert, Badge, Card, PageHeader } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { describeDelta } from '../../lib/deltas'
import { formatDate, formatDateTime, greeting, todayLocal } from '../../lib/format'
import { detectPreset, PRESET_LABELS, presetPeriod, PRESETS, type Period, type PeriodPreset } from '../../lib/periods'
import { useNow } from '../../lib/useNow'
import { useUrlFilters } from '../../lib/urlFilters'
import { IncidentDrawer } from '../incidents/IncidentDrawer'
import { clampRange, dayNightLink, drillRange, explorerLink, parseSide, resolvePeriod, sideSplit, sideTrendLink, withSide } from './chartData'
import { CategoryBars, DayNightBars, MobileHealthPanel, RankedList, SeverityDonut, SideTrendChart, TrendChart } from './charts'

const OPEN_CRITICAL_HIGH = { severity: 'CRITICAL,HIGH', status: 'OPEN,IN_PROGRESS,MONITORING' }
const hotspotItems = (hs: HotspotDto[], kind: HotspotDto['kind']) =>
  hs.filter((h) => h.kind === kind).map((h) => ({ key: h.key, label: h.location, detail: h.topCategory && `Mostly ${h.topCategory}`, count: h.count }))

export function DashboardPage() {
  const { data: me } = useMe()
  const now = useNow()
  const navigate = useNavigate()
  const today = todayLocal(now)
  const { values, set } = useUrlFilters(['from', 'to', 'side'])
  const { period, invalid } = resolvePeriod(values.from, values.to, presetPeriod('month', today))
  const side = parseSide(values.side)
  const a = useAnalytics(period, side)
  const [openRef, setOpenRef] = useState<string | null>(null)
  const preset = detectPreset(period, today)
  const s = a.summary.data
  const split = !side && s ? s.bySide : null
  const card = <T,>(q: { data?: T; isError: boolean; error: unknown }, rows: number, render: (d: T) => ReactNode) =>
    q.isError ? <Alert>{errorMessage(q.error)}</Alert> : q.data !== undefined ? render(q.data) : <Skeleton rows={rows} />
  const drill = (extra: Record<string, string>, range: Period = period) => navigate(explorerLink(range, withSide(extra, side)))
  const openCriticalHighLink = `/incidents?${new URLSearchParams(withSide(OPEN_CRITICAL_HIGH, side)).toString()}`
  const drillHotspot = (key: string) => { const h = a.hotspots.data?.find((x) => x.key === key); if (h) drill(h.drill) }

  const attentionColumns = [
    { key: 'ref', header: 'Incident', render: (i: AttentionItemDto) => <span className="font-semibold text-slate-900">{i.ref}</span> },
    { key: 'side', header: 'Side', render: (i: AttentionItemDto) => <SideBadge side={i.side} /> },
    { key: 'when', header: 'When', render: (i: AttentionItemDto) => <span className="whitespace-nowrap">{formatDateTime(i.occurredAt)}</span> },
    { key: 'where', header: 'Station / unit', render: (i: AttentionItemDto) => (i.vehicle ? <span><span className="font-medium">{i.vehicle}</span><span className="block text-xs text-slate-500">{i.location}</span></span> : i.location) },
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
            <Segmented<IncidentSide | ''>
              label="Side"
              value={side ?? ''}
              onChange={(v) => set({ side: v || undefined })}
              options={[{ value: '', label: 'All' }, ...INCIDENT_SIDES.map((x) => ({ value: x, label: INCIDENT_SIDE_SHORT[x] }))]}
            />
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
        <StatCard
          label="Total incidents" value={s?.total.current ?? '—'} delta={s ? describeDelta(s.total, 'percent', 'lower') : null}
          hint={s && describeDelta(s.total, 'percent', 'lower') ? 'vs previous' : undefined} footnote={split && sideSplit(split, (x) => x.total)} onClick={() => drill({})}
        />
        <StatCard
          label="Open critical / high" value={s?.openCriticalHigh ?? '—'}
          hint={s && s.openCriticalHighOver24h > 0 ? `${s.openCriticalHighOver24h} over 24 h old` : 'right now'}
          footnote={split && sideSplit(split, (x) => x.openCriticalHigh)} onClick={() => navigate(openCriticalHighLink)}
        />
        <StatCard
          label="Avg. time to resolve" value={s?.avgMinutesToResolve.current != null ? `${s.avgMinutesToResolve.current} min` : '—'}
          delta={s ? describeDelta(s.avgMinutesToResolve, 'minutes', 'lower') : null} footnote={split && sideSplit(split, (x) => x.avgMinutesToResolve, ' min')}
        />
        <StatCard
          label="Escalated on time" value={s?.escalatedOnTimePct.current != null ? `${s.escalatedOnTimePct.current}%` : '—'}
          delta={s ? describeDelta(s.escalatedOnTimePct, 'points', 'higher') : null} footnote={split && sideSplit(split, (x) => x.escalatedOnTimePct, '%')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Incidents over time" className="xl:col-span-2">
          {card(a.trend, 6, (t) => {
            const range = (b: string) => clampRange(drillRange(b, t.granularity), period)
            return <TrendChart data={t} onBucketClick={(b) => drill({}, range(b))} bucketHref={(b) => explorerLink(range(b), withSide({}, side))} />
          })}
        </Card>
        <Card title="By severity">
          {card(a.severity, 4, (d) => <SeverityDonut data={d} bySide={!side} onSliceClick={(sev) => drill({ severity: sev })} />)}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {!side && (
          <Card title="Static vs Mobile" className="xl:col-span-2">
            {card(a.sideTrend, 6, (t) => (
              <SideTrendChart data={t} onBarClick={(b, x) => navigate(sideTrendLink(b, t.granularity, x, period))} barHref={(b, x) => sideTrendLink(b, t.granularity, x, period)} />
            ))}
          </Card>
        )}
        <Card title="Most occurring categories" className={side ? 'xl:col-span-3' : ''}>
          {card(a.categories, 4, (d) => (
            <CategoryBars data={d} bySide={!side} onBarClick={(id) => drill({ categoryId: id })} barHref={(id) => explorerLink(period, withSide({ categoryId: id }, side))} />
          ))}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {side !== 'MOBILE' && (
          <Card title="Top stations">
            {card(a.hotspots, 4, (hs) => <RankedList items={hotspotItems(hs, 'station')} onSelect={drillHotspot} empty="No static weighbridge incidents" />)}
          </Card>
        )}
        {side !== 'STATIC' && (
          <Card title="Mobile hotspots">
            {card(a.hotspots, 4, (hs) => <RankedList items={hotspotItems(hs, 'place')} onSelect={drillHotspot} empty="No mobile weighbridge incidents" />)}
          </Card>
        )}
        <Card title="Day vs Night shift">
          {card(a.dayNight, 4, (d) => <DayNightBars data={d} onBarClick={(w, code) => navigate(dayNightLink(w, code, period, side))} barHref={(w, code) => dayNightLink(w, code, period, side)} />)}
        </Card>
      </div>

      {side !== 'STATIC' && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card title="Top units">
            {card(a.vehicles, 4, (v) => (
              <RankedList items={v.map((x) => ({ key: x.key, label: x.label, count: x.count }))} onSelect={(id) => drill({ side: 'MOBILE', vehicleId: id })} empty="No mobile weighbridge incidents" />
            ))}
          </Card>
          <Card title="Equipment health">
            {card(a.mobileHealth, 4, (m) => <MobileHealthPanel data={m} onSelect={(f) => drill({ side: 'MOBILE', ...f })} />)}
          </Card>
          <Card title="Platforms">
            {card(a.mobileHealth, 3, (m) => (
              <RankedList items={m.platforms.map((p) => ({ key: p.key, label: p.label, count: p.count }))} onSelect={(id) => drill({ side: 'MOBILE', platformId: id })} empty="No mobile weighbridge incidents" />
            ))}
          </Card>
        </div>
      )}

      <Card title="Needs your attention" actions={<Link to={openCriticalHighLink} className="text-sm font-medium text-brand-700 hover:underline">All open critical / high</Link>}>
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
