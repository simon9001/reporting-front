import { X } from 'lucide-react'
import { useId, useRef, type ReactNode } from 'react'
import { cx, IconButton } from './ui'
import { useModalLayer } from './useModalLayer'

export function Drawer({ open, onClose, title, children, footer, wide, fullScreenOnMobile = true }: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  /** Below sm the drawer covers the whole screen (default). When false it is 85% wide. */
  fullScreenOnMobile?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useModalLayer(open, panel, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-asphalt-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          'relative flex h-full flex-col bg-white shadow-card outline-none focus-visible:shadow-none sm:w-full sm:rounded-l-lg',
          fullScreenOnMobile ? 'w-full' : 'w-[85vw]',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-silver-200 px-4">
          <div id={titleId} className="min-w-0 truncate font-display text-[15px] font-semibold text-asphalt-900">{title}</div>
          <IconButton label="Close" onClick={onClose}><X /></IconButton>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <footer className="border-t border-silver-200 bg-white px-4 py-2.5 sm:rounded-bl-lg">{footer}</footer>}
      </div>
    </div>
  )
}
