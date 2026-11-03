import { INCIDENT_SIDE_SHORT, INCIDENT_SIDES, type AttentionItemDto, type HotspotDto, type IncidentSide } from '@sr/shared'
import { Activity, Clock, FileWarning, ShieldCheck, Siren } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAnalytics } from '../../api/analytics'
import { useReports } from '../../api/reports'
import { useMe } from '../../auth/hooks'
import { SeverityBadge, SideBadge, StatusBadge } from '../../components/badges'
import { DataTable } from '../../components/DataTable'
import { DateRangePicker } from '../../components/DateRangePicker'
import { EmptyState, Skeleton } from '../../components/EmptyState'
import { OnDutyCard } from '../../components/OnDutyCard'
import { Segmented } from '../../components/Segmented'
import { Tabs } from '../../components/Tabs'
import { Alert, Badge, cx, PageHeader } from '../../components/ui'
import { errorMessage } from '../../lib/api'
import { describeDelta } from '../../lib/deltas'
import { formatDate, formatDateTime, greeting, todayLocal } from '../../lib/format'
import { detectPreset, PRESET_LABELS, presetPeriod, PRESETS, type Period, type PeriodPreset } from '../../lib/periods'
import { useNow } from '../../lib/useNow'
import { useUrlFilters } from '../../lib/urlFilters'
import { IncidentDrawer } from '../incidents/IncidentDrawer'
import { ReportsTile } from '../reports/ReportsTile'
import { clampRange, dayNightLink, drillRange, explorerLink, parseSide, resolvePeriod, sideSplit, sideTrendLink, trendHighlights, withSide } from './chartData'
import { CategoryBars, DayNightBars, MobileHealthPanel, RankedList, SeverityDonut, SideTrendChart, TrendArea } from './charts'
import { dashboardPanels, hotspotKind, type HotspotKind } from './dashboardLayout'
import { KpiTile, MiniStat, Panel, TrendHero } from './panels'

const OPEN_CRITICAL_HIGH = { severity: 'CRITICAL,HIGH', status: 'OPEN,IN_PROGRESS,MONITORING' }
const hotspotItems = (hs: HotspotDto[], kind: HotspotKind) =>
  hs.filter((h) => h.kind === kind).map((h) => ({ key: h.key, label: h.location, detail: h.topCategory && `Mostly ${h.topCategory}`, count: h.count }))

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
  const overdue = useReports({ status: 'OVERDUE', page: 1 })
  const [openRef, setOpenRef] = useState<string | null>(null)
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
  const highlights = a.trend.data ? trendHighlights(a.trend.data) : null
  const dayNightPanel = (
    <Panel title="Day vs Night" className="flex-1">
      {card(a.dayNight, 4, (d) => <DayNightBars data={d} onBarClick={(w, code) => navigate(dayNightLink(w, code, period, side))} barHref={(w, code) => dayNightLink(w, code, period, side)} />)}
    </Panel>
  )
  const noIncidents = (k: HotspotKind) => (k === 'station' ? 'No static weighbridge incidents' : 'No mobile weighbridge incidents')

  const attentionColumns = [
    { key: 'ref', header: 'Incident', render: (i: AttentionItemDto) => <span className="whitespace-nowrap font-semibold text-slate-900">{i.ref}</span> },
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

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-3">
          <KpiTile
            big icon={Activity} iconClass="bg-highway-400 text-asphalt-900" label="Total incidents" value={s?.total.current ?? '—'}
            delta={s ? describeDelta(s.total, 'percent', 'lower') : null} hint="vs previous period" footnote={split && sideSplit(split, (x) => x.total)} onClick={() => drill({})}
          />
          <div className="grid flex-1 grid-cols-2 gap-3">
            <KpiTile
              icon={Siren} iconClass="bg-red-100 text-red-700" label="Open critical / high" value={s?.openCriticalHigh ?? '—'}
              hint={s && s.openCriticalHighOver24h > 0 ? `${s.openCriticalHighOver24h} over 24 h old` : 'right now'}
              footnote={split && sideSplit(split, (x) => x.openCriticalHigh)} onClick={() => navigate(openCriticalHighLink)}
            />
            <KpiTile
              icon={Clock} iconClass="bg-amber-100 text-amber-800" label="Avg. time to resolve" value={s?.avgMinutesToResolve.current != null ? `${s.avgMinutesToResolve.current} min` : '—'}
              delta={s ? describeDelta(s.avgMinutesToResolve, 'minutes', 'lower') : null} footnote={split && sideSplit(split, (x) => x.avgMinutesToResolve, ' min')}
            />
            <KpiTile
              icon={ShieldCheck} iconClass="bg-teal-100 text-teal-800" label="Escalated on time" value={s?.escalatedOnTimePct.current != null ? `${s.escalatedOnTimePct.current}%` : '—'}
              delta={s ? describeDelta(s.escalatedOnTimePct, 'points', 'higher') : null} footnote={split && sideSplit(split, (x) => x.escalatedOnTimePct, '%')}
            />
            <KpiTile
              icon={FileWarning} iconClass="bg-violet-100 text-violet-800" label="Reports overdue" value={overdue.data?.total ?? '—'}
              hint="shifts with no report yet" onClick={() => navigate('/reports?status=OVERDUE')}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="By severity" className="flex flex-1 flex-col">
            {card(a.severity, 4, (d) => <SeverityDonut data={d} onSliceClick={(sev) => drill({ severity: sev })} />)}
            {s && (
              <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
                <MiniStat label="Static" value={s.bySide.STATIC.total} />
                <MiniStat label="Mobile" value={s.bySide.MOBILE.total} />
                <MiniStat label="Open critical / high" value={s.openCriticalHigh} />
              </div>
            )}
          </Panel>
          <ReportsTile />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <OnDutyCard currentShift={me?.currentShift ?? null} now={now} canPlan />
          {panels.sideTrend ? (
            <Panel title="Static vs Mobile" className="flex-1">
              {card(a.sideTrend, 6, (t) => (
                <SideTrendChart data={t} onBarClick={(b, x) => navigate(sideTrendLink(b, t.granularity, x, period))} barHref={(b, x) => sideTrendLink(b, t.granularity, x, period)} />
              ))}
            </Panel>
          ) : dayNightPanel}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
        <TrendHero
          className="md:col-span-2 xl:col-span-5"
          total={s?.total.current ?? null}
          stats={[
            { label: 'Previous period', value: s?.total.previous ?? '—' },
            { label: highlights ? highlights.averageLabel : 'Average', value: highlights?.average ?? '—' },
            { label: 'Busiest', value: highlights?.busiest ?? '—' },
          ]}
        >
          {a.trend.isError ? <Alert>{errorMessage(a.trend.error)}</Alert> : a.trend.data ? (() => {
            const t = a.trend.data
            const range = (b: string) => clampRange(drillRange(b, t.granularity), period)
            return <TrendArea data={t} onBucketClick={(b) => drill({}, range(b))} bucketHref={(b) => explorerLink(range(b), withSide({}, side))} />
          })() : <div className="h-[180px] animate-pulse rounded-md bg-white/10" />}
        </TrendHero>

        <Panel title="Most occurring categories" className="xl:col-span-4">
          {card(a.categories, 4, (d) => (
            <CategoryBars data={d} bySide={!side} onBarClick={(id) => drill({ categoryId: id })} barHref={(id) => explorerLink(period, withSide({ categoryId: id }, side))} />
          ))}
        </Panel>

        <Panel
          title="Hotspots"
          className="xl:col-span-3"
          actions={panels.hotspotSwitch && (
            <Segmented<HotspotKind> label="Hotspot type" value={hotspotChoice} onChange={setHotspotChoice} options={[{ value: 'station', label: 'Static' }, { value: 'place', label: 'Mobile' }]} />
          )}
        >
          {card(a.hotspots, 4, (hs) => <RankedList items={hotspotItems(hs, kind)} onSelect={drillHotspot} empty={noIncidents(kind)} />)}
        </Panel>
      </div>

      {(panels.sideTrend || panels.mobileUnits) && (
        <div className={cx('grid gap-3', panels.sideTrend && panels.mobileUnits && 'md:grid-cols-2')}>
          {panels.sideTrend && dayNightPanel}
          {panels.mobileUnits && (
            <Panel title="Mobile units">
              <Tabs<UnitsTab> label="Mobile units" value={unitsTab} onChange={setUnitsTab} tabs={[{ value: 'units', label: 'Top units' }, { value: 'health', label: 'Equipment health' }, { value: 'platforms', label: 'Platforms' }]}>
                {unitsTab === 'units' && card(a.vehicles, 4, (v) => (
                  <RankedList items={v.map((x) => ({ key: x.key, label: x.label, count: x.count }))} onSelect={(id) => drill({ side: 'MOBILE', vehicleId: id })} empty="No mobile weighbridge incidents" />
                ))}
                {unitsTab === 'health' && card(a.mobileHealth, 4, (m) => <MobileHealthPanel data={m} onSelect={(f) => drill({ side: 'MOBILE', ...f })} />)}
                {unitsTab === 'platforms' && card(a.mobileHealth, 3, (m) => (
                  <RankedList items={m.platforms.map((p) => ({ key: p.key, label: p.label, count: p.count }))} onSelect={(id) => drill({ side: 'MOBILE', platformId: id })} empty="No mobile weighbridge incidents" />
                ))}
              </Tabs>
            </Panel>
          )}
        </div>
      )}

      <Panel title="Needs your attention" actions={<Link to={openCriticalHighLink} className="text-[13px] font-medium text-link hover:underline">All open critical / high</Link>}>
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
      </Panel>

      <IncidentDrawer idOrRef={openRef} onClose={() => setOpenRef(null)} />
    </>
  )
}
