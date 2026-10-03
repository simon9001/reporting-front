import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { periodLabel, PRESET_LABELS, presetPeriod, PRESETS, type Period } from '../lib/periods'
import { Popover } from './Popover'
import { Button, Input } from './ui'

function RangePanel({ value, onChange, today, allowAll, close }: { value: Period | null; onChange: (p: Period | null) => void; today: string; allowAll: boolean; close: () => void }) {
  const [from, setFrom] = useState(value?.from ?? today)
  const [to, setTo] = useState(value?.to ?? today)
  const pick = (p: Period | null) => { onChange(p); close() }
  return (
    <div className="w-72 space-y-3 p-1">
      <div className="grid grid-cols-2 gap-1">
        {PRESETS.map((p) => (
          <button key={p} type="button" className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-brand-50" onClick={() => pick(presetPeriod(p, today))}>{PRESET_LABELS[p]}</button>
        ))}
        {allowAll && <button type="button" className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-brand-50" onClick={() => pick(null)}>All dates</button>}
      </div>
      <div className="space-y-2 border-t border-line pt-3">
        <p className="text-xs font-medium text-slate-500">Custom range</p>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" aria-label="From date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" aria-label="To date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button className="w-full" disabled={!from || !to || from > to} onClick={() => pick({ from, to })}>Apply</Button>
      </div>
    </div>
  )
}

export function DateRangePicker({ value, onChange, today, allowAll = true }: { value: Period | null; onChange: (p: Period | null) => void; today: string; allowAll?: boolean }) {
  return (
    <Popover label={<><CalendarDays className="size-4 text-slate-400" aria-hidden />{value ? periodLabel(value, today) : 'All dates'}</>}>
      {(close) => <RangePanel value={value} onChange={onChange} today={today} allowAll={allowAll} close={close} />}
    </Popover>
  )
}
