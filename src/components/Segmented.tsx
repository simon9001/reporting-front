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
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 gap-0.5 rounded-[10px] border border-silver-200 bg-white p-0.5 text-sm shadow-sm">
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
          className={cx('rounded-lg px-3 font-medium transition duration-200', value === o.value ? 'bg-asphalt-800 text-white shadow-sm focus-visible:focus-halo' : 'text-slate-600 hover:bg-silver-100 hover:text-asphalt-800')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
