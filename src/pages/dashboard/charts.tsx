import { INCIDENT_SIDE_SHORT, INCIDENT_SIDES, SEVERITY_LABELS, type CountByDto, type DayNightDto, type IncidentSide, type IncidentTrendDto, type MobileHealthDto, type Severity, type SideTrendDto, type TrendPointDto } from '@sr/shared'
import { useId, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SEVERITY_COLORS, SIDE_COLORS } from '../../components/badges'
import { EmptyState } from '../../components/EmptyState'
import { bucketLabel, HEALTH_TILES, shiftColor, weekLabel } from './chartData'

const axis = { fontSize: 11, fill: '#6b7280' }
function SrTable({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:mt-3 focus-within:overflow-x-auto focus-within:rounded-lg focus-within:border focus-within:border-line focus-within:bg-white focus-within:p-2 focus-within:text-xs">
    <table className="w-full text-left [&_a]:rounded [&_a]:text-link [&_a]:underline">
      <caption className="mb-1 text-left font-medium">{caption}</caption>
      <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
    </table>
    </div>
  )
}

const tooltipStyle = { borderRadius: 8, border: 'none', boxShadow: '0 8px 24px -12px rgb(20 23 27 / 0.3)', fontSize: 12 }
const GRID = '#eceef1'

const AREA_COLOR = '#f5c400'

function TrendTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: TrendPointDto & { label: string } }[] }) {
  const p = payload?.[0]?.payload
  if (!active || !p) return null
  return (
    <div className="rounded-lg bg-white p-2 text-xs text-asphalt-800 shadow-[0_8px_24px_-12px_rgb(20_23_27/0.3)]">
      <p className="font-semibold">{p.label} · {p.total} incident{p.total === 1 ? '' : 's'}</p>
      <ul className="mt-1 space-y-0.5">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((s) => (
          <li key={s} className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: SEVERITY_COLORS[s] }} aria-hidden />{SEVERITY_LABELS[s]} {p[s]}</li>
        ))}
      </ul>
      {p.movingAvg !== null && <p className="mt-1 text-slate-500">7-day average {p.movingAvg}</p>}
    </div>
  )
}

/** Incidents over time on the dark highlight panel: one series, so the panel title names it; severities are in the tooltip and table. */
export function TrendArea({ data, onBucketClick, bucketHref }: { data: IncidentTrendDto; onBucketClick: (bucket: string) => void; bucketHref: (bucket: string) => string }) {
  const gradientId = useId()
  if (data.points.every((p) => p.total === 0)) return <p className="flex h-[180px] items-center justify-center text-[13px] text-white/75">No incidents in this period</p>
  const rows = data.points.map((p) => ({ ...p, label: bucketLabel(p.bucket, data.granularity) }))
  const axisOnDark = { fontSize: 11, fill: 'rgb(255 255 255 / 0.75)' }
  return (
    <>
    <div className="h-[180px]" role="img" aria-label="Incidents over time (table follows)">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          onClick={(state) => { const p = rows[Number(state.activeTooltipIndex)]; if (p) onBucketClick(p.bucket) }}
          style={{ cursor: 'pointer' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={AREA_COLOR} stopOpacity={0.45} />
              <stop offset="100%" stopColor={AREA_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.12)" />
          <XAxis dataKey="label" tick={axisOnDark} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis allowDecimals={false} tick={axisOnDark} tickLine={false} axisLine={false} />
          <Tooltip content={TrendTooltip} cursor={{ stroke: 'rgb(255 255 255 / 0.4)' }} />
          <Area type="monotone" dataKey="total" name="Incidents" stroke={AREA_COLOR} strokeWidth={2} fill={`url(#${gradientId})`} activeDot={{ r: 5, stroke: '#10312f', strokeWidth: 2, fill: AREA_COLOR }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <SrTable
      caption="Incidents over time by severity"
      head={['Period', 'Low', 'Medium', 'High', 'Critical', 'Total']}
      rows={rows.map((r) => [<Link key="l" to={bucketHref(r.bucket)}>{r.label}</Link>, r.LOW, r.MEDIUM, r.HIGH, r.CRITICAL, r.total])}
    />
    </>
  )
}

export function SeverityDonut({ data, onSliceClick }: { data: CountByDto[]; onSliceClick: (severity: Severity) => void }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <EmptyState title="No incidents" />
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative size-[132px] shrink-0" role="img" aria-label={`Incidents by severity, ${total} in total`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius="68%" outerRadius="98%" paddingAngle={2} cornerRadius={3} stroke="none" onClick={(_, index) => { const d = data[index]; if (d) onSliceClick(d.key as Severity) }} cursor="pointer">
              {data.map((d) => <Cell key={d.key} fill={SEVERITY_COLORS[d.key as Severity]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-semibold text-slate-900 tabular-nums">{total}</span>
          <span className="text-xs text-slate-500">incidents</span>
        </div>
      </div>
      <ul className="min-w-40 flex-1 space-y-1 text-[13px]">
        {data.map((d) => (
          <li key={d.key}>
            <button type="button" className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-silver-100" onClick={() => onSliceClick(d.key as Severity)}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: SEVERITY_COLORS[d.key as Severity] }} aria-hidden />
              <span className="flex-1 text-slate-700">{d.label}</span>
              <span className="font-semibold text-slate-900 tabular-nums">{d.count}</span>
              <span className="w-9 text-right text-xs text-slate-500 tabular-nums">{Math.round((d.count / total) * 100)}%</span>
            </button>
          </li>
        ))}
      </ul>
      <SrTable caption="Incidents by severity" head={['Severity', 'Incidents', 'Static', 'Mobile']} rows={data.map((d) => [d.label, d.count, d.static, d.mobile])} />
    </div>
  )
}

export function CategoryBars({ data, onBarClick, barHref, bySide = false }: { data: CountByDto[]; onBarClick: (key: string) => void; barHref: (key: string) => string; bySide?: boolean }) {
  if (data.length === 0) return <EmptyState title="No incidents" />
  const click = (_: unknown, index: number) => { const d = data[index]; if (d) onBarClick(d.key) }
  return (
    <>
    <div className="h-[180px]" role="img" aria-label="Most occurring incident categories (table follows)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="label" width={100} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f2f4' }} />
          {bySide ? (
            <>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="static" name="Static" stackId="side" fill={SIDE_COLORS.STATIC} stroke="#fff" strokeWidth={2} maxBarSize={18} cursor="pointer" onClick={click} />
              <Bar dataKey="mobile" name="Mobile" stackId="side" fill={SIDE_COLORS.MOBILE} stroke="#fff" strokeWidth={2} radius={[0, 4, 4, 0]} maxBarSize={18} cursor="pointer" onClick={click} />
            </>
          ) : (
            <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]} maxBarSize={18} cursor="pointer" label={{ position: 'right', fontSize: 11, fill: '#374151' }} onClick={click}>
              {data.map((d, i) => <Cell key={d.key} fill={i === 0 ? '#f5c400' : '#1c1f24'} stroke={i === 0 ? '#1c1f24' : undefined} strokeWidth={i === 0 ? 1 : 0} />)}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
    <SrTable
      caption="Most occurring incident categories"
      head={bySide ? ['Category', 'Static', 'Mobile', 'Total'] : ['Category', 'Incidents']}
      rows={data.map((d) => (bySide ? [<Link key="l" to={barHref(d.key)}>{d.label}</Link>, d.static, d.mobile, d.count] : [<Link key="l" to={barHref(d.key)}>{d.label}</Link>, d.count]))}
    />
    </>
  )
}

export function SideTrendChart({ data, onBarClick, barHref }: {
  data: SideTrendDto
  onBarClick: (bucket: string, side: IncidentSide) => void
  barHref: (bucket: string, side: IncidentSide) => string
}) {
  if (data.points.every((p) => p.total === 0)) return <EmptyState title="No incidents in this period" />
  const rows = data.points.map((p) => ({ ...p, label: bucketLabel(p.bucket, data.granularity) }))
  const click = (side: IncidentSide) => (_: unknown, index: number) => { const p = rows[index]; if (p) onBarClick(p.bucket, side) }
  return (
    <>
    <div className="h-[200px]" role="img" aria-label="Static and mobile weighbridge incidents over time (table follows)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f2f4' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          {INCIDENT_SIDES.map((s) => <Bar key={s} dataKey={s} name={INCIDENT_SIDE_SHORT[s]} fill={SIDE_COLORS[s]} radius={[4, 4, 0, 0]} maxBarSize={18} cursor="pointer" onClick={click(s)} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
    <SrTable
      caption="Static and mobile weighbridge incidents over time"
      head={['Period', 'Static', 'Mobile', 'Total']}
      rows={rows.map((r) => [
        r.label,
        ...INCIDENT_SIDES.map((s) => <Link key={s} to={barHref(r.bucket, s)} aria-label={`${r[s]} ${INCIDENT_SIDE_SHORT[s].toLowerCase()} incidents, ${r.label}`}>{r[s]}</Link>),
        r.total,
      ])}
    />
    </>
  )
}

export interface RankedItem { key: string; label: string; detail?: string | null; count: number }

/** A ranked list of buttons; each opens the explorer for that item. */
export function RankedList({ items, onSelect, empty = 'No incidents' }: { items: RankedItem[]; onSelect: (key: string) => void; empty?: string }) {
  if (items.length === 0) return <EmptyState title={empty} />
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((i) => (
        <li key={i.key}>
          <button type="button" onClick={() => onSelect(i.key)} className="flex w-full items-center justify-between gap-3 py-2 text-left text-[13px] transition duration-200 hover:bg-highway-50">
            <span><span className="font-medium text-slate-800">{i.label}</span>{i.detail && <span className="block text-xs text-slate-500">{i.detail}</span>}</span>
            <span className="text-[15px] font-semibold text-slate-900 tabular-nums">{i.count}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function MobileHealthPanel({ data, onSelect }: { data: MobileHealthDto; onSelect: (filter: Record<string, string>) => void }) {
  if (data.total === 0) return <EmptyState title="No mobile weighbridge incidents" />
  return (
    <ul className="grid grid-cols-2 gap-2">
      {HEALTH_TILES.map((t) => (
        <li key={t.key}>
          <button type="button" onClick={() => onSelect(t.filter)} className="w-full rounded-md bg-silver-100 p-2.5 text-left transition duration-200 hover:bg-highway-50 hover:shadow-[inset_0_0_0_1px_var(--color-highway-400)]">
            <span className="block text-xs text-slate-500">{t.label}</span>
            <span className="text-lg font-semibold text-slate-900 tabular-nums">{data[t.key]}</span>
            <span className="text-xs text-slate-400"> of {data.total}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}


export function DayNightBars({ data, onBarClick, barHref }: {
  data: DayNightDto
  onBarClick: (weekStart: string, shiftCode: string) => void
  barHref: (weekStart: string, shiftCode: string) => string
}) {
  if (data.points.every((p) => Object.values(p.counts).every((n) => n === 0))) return <EmptyState title="No incidents" />
  const rows = data.points.map((p) => ({ label: weekLabel(p.weekStart), ...p.counts }))
  const click = (code: string) => (_: unknown, index: number) => { const p = data.points[index]; if (p) onBarClick(p.weekStart, code) }
  return (
    <>
    <div className="h-[180px]" role="img" aria-label="Incidents per week by shift (table follows)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f2f4' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          {data.shifts.map((s) => <Bar key={s.code} dataKey={s.code} name={s.name} fill={shiftColor(s.code)} radius={[4, 4, 0, 0]} maxBarSize={22} cursor="pointer" onClick={click(s.code)} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
    <SrTable
      caption="Incidents per week by shift"
      head={['Week', ...data.shifts.map((x) => x.name)]}
      rows={data.points.map((p) => [
        weekLabel(p.weekStart),
        ...data.shifts.map((x) => <Link key={x.code} to={barHref(p.weekStart, x.code)} aria-label={`${p.counts[x.code] ?? 0} ${x.name} incidents, ${weekLabel(p.weekStart)}`}>{p.counts[x.code] ?? 0}</Link>),
      ])}
    />
    </>
  )
}
