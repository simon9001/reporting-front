import { Popover } from './Popover'

export interface Option { value: string; label: string }

export function MultiSelect({ label, options, value, onChange }: { label: string; options: Option[]; value: string[]; onChange: (v: string[]) => void }) {
  const summary = value.length === 0 ? 'Any' : value.length === 1 ? options.find((o) => o.value === value[0])?.label ?? '1 selected' : `${value.length} selected`
  return (
    <Popover label={<span><span className="text-slate-500">{label}:</span> {summary}</span>}>
      {() => (
        <div className="max-h-72 space-y-0.5 overflow-y-auto">
          {options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={value.includes(o.value)}
                onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
              />
              {o.label}
            </label>
          ))}
          {value.length > 0 && <button type="button" className="mt-1 px-2 text-xs font-medium text-brand-700" onClick={() => onChange([])}>Clear</button>}
        </div>
      )}
    </Popover>
  )
}
