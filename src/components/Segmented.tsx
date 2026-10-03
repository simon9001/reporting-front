import { cx } from './ui'

export function Segmented<V extends string>({ label, options, value, onChange }: {
  label: string
  options: { value: V; label: string }[]
  value: V
  onChange: (v: V) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-9 overflow-hidden rounded-md border border-slate-200 bg-white text-sm shadow-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx('px-3 font-medium', value === o.value ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
