import { INCIDENT_SIDE_LABELS, INCIDENT_SIDES, type IncidentSide } from '@sr/shared'
import { Scale, Truck, type LucideIcon } from 'lucide-react'
import { useId, useRef } from 'react'
import { cx } from '../../components/ui'

const DETAILS: Record<IncidentSide, { icon: LucideIcon; hint: string }> = {
  STATIC: { icon: Scale, hint: 'A fixed weighbridge station — Incident Register' },
  MOBILE: { icon: Truck, hint: 'A vehicle unit — Mobile Weighbridge sheet' },
}

/** Two large radio cards. Accessible names stay exactly "Static weighbridge" / "Mobile weighbridge". */
export function WeighbridgeChoice({ value, onChange }: { value: IncidentSide; onChange: (v: IncidentSide) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()
  const move = (from: number, step: number) => {
    const next = (from + step + INCIDENT_SIDES.length) % INCIDENT_SIDES.length
    onChange(INCIDENT_SIDES[next]!)
    refs.current[next]?.focus()
  }
  return (
    <div role="radiogroup" aria-label="Weighbridge" className="grid gap-3 sm:grid-cols-2">
      {INCIDENT_SIDES.map((side, i) => {
        const { icon: Icon, hint } = DETAILS[side]
        const checked = value === side
        return (
          <button
            key={side}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={INCIDENT_SIDE_LABELS[side]}
            aria-describedby={`${id}-${side}`}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(side)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i, 1) }
              else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i, -1) }
            }}
            className={cx(
              'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition duration-200 active:scale-[.99]',
              checked ? 'border-asphalt-800 bg-highway-50 shadow-card' : 'border-silver-200 bg-white hover:border-silver-400',
            )}
          >
            <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-xl', checked ? 'bg-highway-400 text-asphalt-900' : 'bg-silver-100 text-slate-500')}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-display text-base font-semibold text-asphalt-900">{INCIDENT_SIDE_LABELS[side]}</span>
              <span id={`${id}-${side}`} className="mt-0.5 block text-xs text-slate-500">{hint}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}