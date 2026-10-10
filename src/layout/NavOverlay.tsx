import { useRef, type ReactNode } from 'react'
import { useModalLayer } from '../components/useModalLayer'

/** Off-canvas sidebar for phones (w-72) and the expanded rail on tablets (w-56). Escape, backdrop and navigation close it. */
export function NavOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  useModalLayer(open, panel, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-asphalt-900/50" onClick={onClose} aria-hidden />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menu" className="relative h-full w-72 max-w-[85vw] shadow-card outline-none focus-visible:shadow-none sm:w-56">
        {children}
      </div>
    </div>
  )
}
