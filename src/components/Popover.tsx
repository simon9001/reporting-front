import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from './ui'

export const filterButtonClass = 'inline-flex h-10 items-center gap-2 rounded-[10px] border border-silver-200 bg-white px-3 text-sm text-asphalt-800 shadow-sm transition duration-200 hover:bg-silver-100'
/** A filter trigger that currently filters something: charcoal chip with highway-yellow text. */
export const activeFilterClass = 'border-asphalt-800! bg-asphalt-800! text-highway-400! hover:bg-asphalt-700!'

export function Popover({ label, children, align = 'left', buttonClassName, panelLabel }: {
  label: ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  buttonClassName?: string
  panelLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const first = panel.current?.querySelector<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')
    ;(first ?? panel.current)?.focus()
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  // Escape is handled on the root element (not document) so an enclosing Drawer does not also close.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (open && e.key === 'Escape') {
      e.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
  }
  return (
    <div ref={ref} className="relative inline-block" onKeyDown={onKeyDown}>
      <button ref={trigger} type="button" aria-expanded={open} aria-haspopup="dialog" className={cx(filterButtonClass, buttonClassName)} onClick={() => setOpen((o) => !o)}>
        {label}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </button>
      {open && (
        <div
          ref={panel}
          tabIndex={-1}
          role="dialog"
          aria-label={panelLabel ?? (typeof label === 'string' ? label : 'Options')}
          className={cx('absolute z-30 mt-1 min-w-56 rounded-xl border border-silver-200 bg-white p-2 shadow-card outline-none', align === 'right' ? 'right-0' : 'left-0')}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
