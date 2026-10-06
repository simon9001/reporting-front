import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { pushLayer } from './layers'
import { cx, IconButton } from './ui'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Drawer({ open, onClose, title, children, footer, wide }: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  useEffect(() => { closeRef.current = onClose })
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const layer = pushLayer()
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (!layer.isTop()) return
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) {
        e.preventDefault()
        panel.current.focus()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (!panel.current.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      layer.pop()
      previous?.focus()
    }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-asphalt-900/40 backdrop-blur-[2px]" onClick={() => closeRef.current()} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx('relative flex h-full w-full flex-col bg-white shadow-2xl outline-none sm:rounded-l-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-xl')}
      >
        <header className="flex items-center justify-between gap-3 border-b border-silver-200 px-6 py-4">
          <div id={titleId} className="min-w-0 font-display text-lg font-semibold text-asphalt-900">{title}</div>
          <IconButton label="Close" onClick={() => closeRef.current()}><X /></IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="border-t border-silver-200 bg-white px-6 py-3 sm:rounded-bl-2xl">{footer}</footer>}
      </div>
    </div>
  )
}
