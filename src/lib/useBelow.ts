import { useSyncExternalStore } from 'react'
import { BREAKPOINTS, type Breakpoint } from './breakpoints'

const query = (bp: Breakpoint) => `(max-width: ${BREAKPOINTS[bp] - 0.02}px)`

const subscribers = new Map<Breakpoint, (onChange: () => void) => () => void>()
/** One stable subscribe function per breakpoint, so useSyncExternalStore does not resubscribe every render. */
function subscribeFor(bp: Breakpoint) {
  let sub = subscribers.get(bp)
  if (!sub) {
    sub = (onChange) => {
      const m = window.matchMedia(query(bp))
      m.addEventListener('change', onChange)
      return () => m.removeEventListener('change', onChange)
    }
    subscribers.set(bp, sub)
  }
  return sub
}

/** True while the viewport is narrower than the breakpoint. Re-renders when that changes. */
export function useBelow(bp: Breakpoint): boolean {
  return useSyncExternalStore(
    subscribeFor(bp),
    () => window.matchMedia(query(bp)).matches,
    () => false,
  )
}

/** Below md: tables become stacked rows. */
export const useCompact = () => useBelow('md')
