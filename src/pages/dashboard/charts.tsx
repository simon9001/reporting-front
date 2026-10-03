import type { CountByDto, DayNightDto, IncidentTrendDto, Severity } from '@sr/shared'
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SEVERITY_COLORS } from '../../components/badges'
import { EmptyState } from '../../components/EmptyState'
import { bucketLabel, weekLabel } from './chartData'

const axis = { fontSize: 11, fill: '#6b7280' }
const tooltipStyle = { borderRadius: 8, border: '1px solid #eef0f2', fontSize: 12 }

export function TrendChart({ data, onBucketClick }: { data: IncidentTrendDto; onBucketClick: (bucket: string) => void }) {
  if (data.points.every((p) => p.total === 0)) return <EmptyState title="No incidents in this period" />
  const rows = data.points.map((p) => ({ ...p, label: bucketLabel(p.bucket, data.granularity) }))
  const click = (_: unknown, index: number) => { const p = rows[index]; if (p) onBucketClick(p.bucket) }
  return (
    <div className="h-64" role="img" aria-label="Incidents over time by severity">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f0faf8' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Severity[]).map((s) => (
            <Bar key={s} dataKey={s} name={s[0] + s.slice(1).toLowerCase()} stackId="sev" fill={SEVERITY_COLORS[s]} onClick={click} cursor="pointer" maxBarSize={28} />
          ))}
          {data.granularity === 'day' && <Line dataKey="movingAvg" name="7-day average" stroke="#0f766e" strokeDasharray="4 3" dot={false} strokeWidth={2} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SeverityDonut({ data, onSliceClick }: { data: CountByDto[]; onSliceClick: (severity: Severity) => void }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <EmptyState title="No incidents" />
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`Incidents by severity, ${total} in total`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius="62%" outerRadius="95%" paddingAngle={1.5} stroke="none" onClick={(_, index) => { const d = data[index]; if (d) onSliceClick(d.key as Severity) }} cursor="pointer">
              {data.map((d) => <Cell key={d.key} fill={SEVERITY_COLORS[d.key as Severity]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500">incidents</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.key}>
            <button type="button" className="flex items-center gap-2 hover:underline" onClick={() => onSliceClick(d.key as Severity)}>
              <span className="size-2.5 rounded-sm" style={{ background: SEVERITY_COLORS[d.key as Severity] }} aria-hidden />
              <span className="text-slate-700">{d.label}</span>
              <span className="font-semibold text-slate-900">{d.count}</span>
              <span className="text-xs text-slate-400">{Math.round((d.count / total) * 100)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const TEALS = ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1']

export function CategoryBars({ data, onBarClick }: { data: CountByDto[]; onBarClick: (key: string) => void }) {
  if (data.length === 0) return <EmptyState title="No incidents" />
  return (
    <div style={{ height: Math.max(120, data.length * 34) }} role="img" aria-label="Most occurring incident categories">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="label" width={110} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f0faf8' }} />
          <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]} maxBarSize={18} cursor="pointer" label={{ position: 'right', fontSize: 11, fill: '#374151' }}
            onClick={(_, index) => { const d = data[index]; if (d) onBarClick(d.key) }}>
            {data.map((d, i) => <Cell key={d.key} fill={TEALS[i % TEALS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DayNightBars({ data }: { data: DayNightDto }) {
  if (data.points.every((p) => Object.values(p.counts).every((n) => n === 0))) return <EmptyState title="No incidents" />
  const rows = data.points.map((p) => ({ label: weekLabel(p.weekStart), ...p.counts }))
  const colors = ['#5eead4', '#0f766e', '#14b8a6']
  return (
    <div className="h-48" role="img" aria-label="Incidents per week by shift">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f0faf8' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          {data.shifts.map((s, i) => <Bar key={s.code} dataKey={s.code} name={s.name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={22} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
