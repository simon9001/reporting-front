import { useRef } from 'react'
import { cx } from './ui'

export function Segmented<V extends string>({ label, options, value, onChange }: {
  label: string
  options: { value: V; label: string }[]
  value: V
  onChange: (v: V) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const checkedIndex = options.findIndex((o) => o.value === value)
  const tabbable = checkedIndex >= 0 ? checkedIndex : 0
  const move = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length
    onChange(options[next]!.value)
    refs.current[next]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-9 overflow-hidden rounded-md border border-slate-200 bg-white text-sm shadow-sm">
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={i === tabbable ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i, 1) }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i, -1) }
          }}
          className={cx('px-3 font-medium', value === o.value ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
