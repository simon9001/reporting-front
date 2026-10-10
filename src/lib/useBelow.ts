import { useSyncExternalStore } from 'react'
import { BREAKPOINTS, type Breakpoint } from './breakpoints'

const query = (bp: Breakpoint) => `(max-width: ${BREAKPOINTS[bp] - 0.02}px)`

/** True while the viewport is narrower than the breakpoint. Re-renders when that changes. */
export function useBelow(bp: Breakpoint): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query(bp))
      m.addEventListener('change', onChange)
      return () => m.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query(bp)).matches,
    () => false,
  )
}

/** Below md: tables become stacked rows. */
export const useCompact = () => useBelow('md')
