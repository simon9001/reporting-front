import { useId, useRef, type ReactNode } from 'react'
import { nextTabIndex } from './tabsKeys'
import { cx } from './ui'

/** WAI-ARIA tabs with a roving tabindex. One shared panel shows the selected tab's content. */
export function Tabs<V extends string>({ label, tabs, value, onChange, children }: {
  label: string
  tabs: { value: V; label: string }[]
  value: V
  onChange: (v: V) => void
  children: ReactNode
}) {
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const current = Math.max(0, tabs.findIndex((t) => t.value === value))
  const tabId = (v: V) => `${id}-tab-${v}`
  return (
    <div className="min-w-0">
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-silver-200">
        {tabs.map((t, i) => (
          <button
            key={t.value}
            ref={(el) => { refs.current[i] = el }}
            id={tabId(t.value)}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-controls={`${id}-panel`}
            tabIndex={i === current ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => {
              const next = nextTabIndex(i, e.key, tabs.length)
              if (next === null) return
              e.preventDefault()
              onChange(tabs[next]!.value)
              refs.current[next]?.focus()
            }}
            className={cx(
              '-mb-px h-8 shrink-0 whitespace-nowrap border-b-2 px-2.5 text-[13px] font-medium transition-colors duration-150',
              i === current ? 'border-asphalt-800 text-asphalt-900' : 'border-transparent text-slate-500 hover:text-asphalt-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={tabId(tabs[current]!.value)} className="pt-3">{children}</div>
    </div>
  )
}
