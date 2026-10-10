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
import { Tabs } from '../../components/Tabs'
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
import { dashboardPanels, hotspotKind, type HotspotKind } from './dashboardLayout'

const OPEN_CRITICAL_HIGH = { severity: 'CRITICAL,HIGH', status: 'OPEN,IN_PROGRESS,MONITORING' }
const hotspotItems = (hs: HotspotDto[], kind: HotspotKind) =>
  hs.filter((h) => h.kind === kind).map((h) => ({ key: h.key, label: h.location, detail: h.topCategory && `Mostly ${h.topCategory}`, count: h.count }))

type OverTimeTab = 'trend' | 'daynight'
type UnitsTab = 'units' | 'health' | 'platforms'

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
  const [overTime, setOverTime] = useState<OverTimeTab>('trend')
  const [hotspotChoice, setHotspotChoice] = useState<HotspotKind>('station')
  const [unitsTab, setUnitsTab] = useState<UnitsTab>('units')
  const preset = detectPreset(period, today)
  const panels = dashboardPanels(side)
  const kind = hotspotKind(side, hotspotChoice)
  const s = a.summary.data
  const split = !side && s ? s.bySide : null
  const card = <T,>(q: { data?: T; isError: boolean; error: unknown }, rows: number, render: (d: T) => ReactNode) =>
    q.isError ? <Alert>{errorMessage(q.error)}</Alert> : q.data !== undefined ? render(q.data) : <Skeleton rows={rows} />
  const drill = (extra: Record<string, string>, range: Period = period) => navigate(explorerLink(range, withSide(extra, side)))
  const openCriticalHighLink = `/incidents?${new URLSearchParams(withSide(OPEN_CRITICAL_HIGH, side)).toString()}`
  const drillHotspot = (key: string) => { const h = a.hotspots.data?.find((x) => x.key === key); if (h) drill(h.drill) }
  const noIncidents = (k: HotspotKind) => (k === 'station' ? 'No static weighbridge incidents' : 'No mobile weighbridge incidents')

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
  const attentionMobile = (i: AttentionItemDto) => (
    <span className="block space-y-1">
      <span className="flex flex-wrap items-center gap-1.5"><span className="font-semibold text-asphalt-900">{i.ref}</span><SideBadge side={i.side} /><SeverityBadge severity={i.severity} /></span>
      <span className="block truncate text-slate-600">{i.vehicle ? `${i.vehicle} · ${i.location}` : i.location}</span>
      {i.reasons.length > 0 && <span className="flex flex-wrap gap-1">{i.reasons.map((r) => <Badge key={r} tone="red">{r}</Badge>)}</span>}
    </span>
  )

  return (
    <>
      <PageHeader
        title={`Good ${greeting(now)}, ${me?.user.fullName.split(' ')[0] ?? ''}`}
        description={`Incident overview · ${formatDate(period.from)} – ${formatDate(period.to)}${s ? ` · compared with ${formatDate(s.previousFrom)} – ${formatDate(s.previousTo)}` : ''}`}
        actions={
          <>
            {/* The two switches scroll sideways on phones; the date picker stays outside so its popover is never clipped. */}
            <div className="-m-1 flex max-w-[calc(100%+0.5rem)] items-center gap-2 overflow-x-auto p-1">
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
            </div>
            <DateRangePicker value={period} onChange={(p) => p && set({ from: p.from, to: p.to })} today={today} allowAll={false} />
          </>
        }
      />

      {invalid && <p role="status" className="text-[13px] text-amber-700">Showing this month — choose a period of at most one year.</p>}
      {a.summary.isError && <Alert>{errorMessage(a.summary.error)}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <div className="col-span-2 sm:col-span-1">
          <OnDutyCard currentShift={me?.currentShift ?? null} now={now} canPlan />
        </div>
        <StatCard
          tone="charcoal" label="Total incidents" value={s?.total.current ?? '—'} delta={s ? describeDelta(s.total, 'percent', 'lower') : null}
          hint={s && describeDelta(s.total, 'percent', 'lower') ? 'vs previous' : undefined} footnote={split && sideSplit(split, (x) => x.total)} onClick={() => drill({})}
        />
        <StatCard
          tone="red" label="Open critical / high" value={s?.openCriticalHigh ?? '—'}
          hint={s && s.openCriticalHighOver24h > 0 ? `${s.openCriticalHighOver24h} over 24 h old` : 'right now'}
          footnote={split && sideSplit(split, (x) => x.openCriticalHigh)} onClick={() => navigate(openCriticalHighLink)}
        />
        <StatCard
          tone="yellow" label="Avg. time to resolve" value={s?.avgMinutesToResolve.current != null ? `${s.avgMinutesToResolve.current} min` : '—'}
          delta={s ? describeDelta(s.avgMinutesToResolve, 'minutes', 'lower') : null} footnote={split && sideSplit(split, (x) => x.avgMinutesToResolve, ' min')}
        />
        <StatCard
          tone="blue" label="Escalated on time" value={s?.escalatedOnTimePct.current != null ? `${s.escalatedOnTimePct.current}%` : '—'}
          delta={s ? describeDelta(s.escalatedOnTimePct, 'points', 'higher') : null} footnote={split && sideSplit(split, (x) => x.escalatedOnTimePct, '%')}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
        <Card title="Incidents over time" className="md:col-span-2">
          <Tabs<OverTimeTab> label="Incidents over time" value={overTime} onChange={setOverTime} tabs={[{ value: 'trend', label: 'Trend' }, { value: 'daynight', label: 'Day vs Night' }]}>
            {overTime === 'trend'
              ? card(a.trend, 6, (t) => {
                  const range = (b: string) => clampRange(drillRange(b, t.granularity), period)
                  return <TrendChart data={t} onBucketClick={(b) => drill({}, range(b))} bucketHref={(b) => explorerLink(range(b), withSide({}, side))} />
                })
              : card(a.dayNight, 4, (d) => <DayNightBars data={d} onBarClick={(w, code) => navigate(dayNightLink(w, code, period, side))} barHref={(w, code) => dayNightLink(w, code, period, side)} />)}
          </Tabs>
        </Card>

        <Card title="By severity">
          {card(a.severity, 4, (d) => <SeverityDonut data={d} bySide={!side} onSliceClick={(sev) => drill({ severity: sev })} />)}
        </Card>

        {panels.sideTrend && (
          <Card title="Static vs Mobile" className="xl:col-span-2">
            {card(a.sideTrend, 6, (t) => (
              <SideTrendChart data={t} onBarClick={(b, x) => navigate(sideTrendLink(b, t.granularity, x, period))} barHref={(b, x) => sideTrendLink(b, t.granularity, x, period)} />
            ))}
          </Card>
        )}

        <Card title="Most occurring categories">
          {card(a.categories, 4, (d) => (
            <CategoryBars data={d} bySide={!side} onBarClick={(id) => drill({ categoryId: id })} barHref={(id) => explorerLink(period, withSide({ categoryId: id }, side))} />
          ))}
        </Card>

        <Card
          title="Hotspots"
          actions={panels.hotspotSwitch && (
            <Segmented<HotspotKind> label="Hotspot type" value={hotspotChoice} onChange={setHotspotChoice} options={[{ value: 'station', label: 'Static' }, { value: 'place', label: 'Mobile' }]} />
          )}
        >
          {card(a.hotspots, 4, (hs) => <RankedList items={hotspotItems(hs, kind)} onSelect={drillHotspot} empty={noIncidents(kind)} />)}
        </Card>

        {panels.mobileUnits && (
          <Card title="Mobile units">
            <Tabs<UnitsTab> label="Mobile units" value={unitsTab} onChange={setUnitsTab} tabs={[{ value: 'units', label: 'Top units' }, { value: 'health', label: 'Equipment health' }, { value: 'platforms', label: 'Platforms' }]}>
              {unitsTab === 'units' && card(a.vehicles, 4, (v) => (
                <RankedList items={v.map((x) => ({ key: x.key, label: x.label, count: x.count }))} onSelect={(id) => drill({ side: 'MOBILE', vehicleId: id })} empty="No mobile weighbridge incidents" />
              ))}
              {unitsTab === 'health' && card(a.mobileHealth, 4, (m) => <MobileHealthPanel data={m} onSelect={(f) => drill({ side: 'MOBILE', ...f })} />)}
              {unitsTab === 'platforms' && card(a.mobileHealth, 3, (m) => (
                <RankedList items={m.platforms.map((p) => ({ key: p.key, label: p.label, count: p.count }))} onSelect={(id) => drill({ side: 'MOBILE', platformId: id })} empty="No mobile weighbridge incidents" />
              ))}
            </Tabs>
          </Card>
        )}

        <Card title="Needs your attention" className="col-span-full" actions={<Link to={openCriticalHighLink} className="text-[13px] font-medium text-link hover:underline">All open critical / high</Link>}>
          {a.attention.isError ? <Alert>{errorMessage(a.attention.error)}</Alert> : (
            <DataTable
              columns={attentionColumns}
              rows={a.attention.data ?? []}
              rowKey={(i) => i.id}
              loading={a.attention.isPending}
              onRowClick={(i) => setOpenRef(i.ref)}
              rowLabel={(i) => `Open ${i.ref}`}
              mobile={attentionMobile}
              empty={<EmptyState title="Nothing needs attention" description="No open critical or high incidents." />}
            />
          )}
        </Card>
      </div>

      <IncidentDrawer idOrRef={openRef} onClose={() => setOpenRef(null)} />
    </>
  )
}
