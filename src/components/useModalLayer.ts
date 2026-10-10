import { useEffect, useRef, type RefObject } from 'react'
import { pushLayer } from './layers'

export const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * While `open`: joins the layer stack (so only the topmost overlay reacts to keys and the page stays scroll-locked),
 * focuses the panel, traps Tab inside it, closes on Escape, and returns focus to the previously focused element on close.
 */
export function useModalLayer(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void): void {
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const layer = pushLayer()
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !layer.isTop()) return
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      const box = panel.current
      if (e.key !== 'Tab' || !box) return
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) {
        e.preventDefault()
        box.focus()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === box)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (!box.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      layer.pop()
      // the opener may be gone or hidden (e.g. the rail's expand button after a resize): fall back to the main landmark
      if (previous?.isConnected && previous.offsetParent !== null) previous.focus()
      else document.getElementById('main')?.focus()
    }
  }, [open, panel])
}
