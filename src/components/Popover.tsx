import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from './ui'

export const filterButtonClass = 'inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm hover:bg-slate-50'

export function Popover({ label, children, align = 'left', buttonClassName }: {
  label: ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  buttonClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" aria-expanded={open} aria-haspopup="dialog" className={cx(filterButtonClass, buttonClassName)} onClick={() => setOpen((o) => !o)}>
        {label}
        <ChevronDown className="size-3.5 text-slate-400" aria-hidden />
      </button>
      {open && (
        <div role="dialog" className={cx('absolute z-30 mt-1 min-w-56 rounded-lg border border-line bg-white p-2 shadow-lg', align === 'right' ? 'right-0' : 'left-0')}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
