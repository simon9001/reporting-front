/** Tailwind min-width breakpoints in px (3xl is defined in index.css). */
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, '3xl': 1920 } as const
export type Breakpoint = keyof typeof BREAKPOINTS

export const isBelow = (width: number, bp: Breakpoint): boolean => width < BREAKPOINTS[bp]

/** Below md, tables render as stacked rows. */
export const isCompact = (width: number): boolean => isBelow(width, 'md')

export type ShellMode = 'phone' | 'rail' | 'full'
/** App frame: off-canvas menu on phones, icon rail on tablets, full sidebar from lg. */
export function shellMode(width: number): ShellMode {
  if (isBelow(width, 'sm')) return 'phone'
  if (isBelow(width, 'lg')) return 'rail'
  return 'full'
}
