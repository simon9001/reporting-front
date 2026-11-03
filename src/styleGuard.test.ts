/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Folders (relative to src/) whose source must follow the compact density scale. Later tasks extend this list. */
const SCOPE: string[] = ['.']
/** Individual files added ahead of their whole folder. */
const EXTRA_FILES: string[] = []
/** The only files allowed to use a drop shadow: overlays and the sign-in cards. */
const SHADOW_OK: string[] = [
  'components/Drawer.tsx', 'components/Popover.tsx',
  'layout/CommandPalette.tsx', 'layout/UserMenu.tsx', 'layout/NavOverlay.tsx',
  'auth/LoginPage.tsx', 'auth/ChangePasswordPage.tsx',
]

/** The dashboard's softer panels and larger headline numbers. */
const DASHBOARD: string[] = ['pages/dashboard/panels.tsx', 'pages/reports/ReportsTile.tsx', 'components/OnDutyCard.tsx']

/** Each rule: pattern, reason, and the only files (relative to src/) allowed to use it. */
const BANNED: { re: RegExp; why: string; allow?: string[] }[] = [
  { re: /\brounded(-[trblse]{1,2})?-(xl|2xl|3xl)\b/, why: 'panels are rounded-lg, controls rounded-md', allow: DASHBOARD },
  { re: /rounded-\[10px\]/, why: 'controls are rounded-md' },
  { re: /(^|[\s'"`:])h-10\b/, why: 'controls are h-9 sm:h-8' },
  { re: /\btext-2xl\b/, why: 'text-2xl is only the KPI value', allow: ['components/StatCard.tsx', ...DASHBOARD] },
  { re: /\btext-(3xl|4xl|5xl|6xl|7xl)\b/, why: 'largest type is text-xl for titles', allow: DASHBOARD },
  { re: /\btext-\[(2[1-9]|[3-9]\d)px\]/, why: 'arbitrary text above 20px is not allowed', allow: ['pages/NotFoundPage.tsx'] },
  { re: /\bshadow-(sm|md|lg|xl|2xl)\b/, why: 'no drop shadows except shadow-card on overlays' },
  { re: /\bshadow\b(?![-\w])/, why: 'no bare drop shadow (use shadow-card on overlays only)' },
  { re: /\bgap(-[xy])?-(5|6|8)\b/, why: 'grid gaps are gap-3' },
  { re: /\bspace-y-(5|6|8)\b/, why: 'vertical rhythm is space-y-4 at most' },
  { re: /(^|[\s'"`:])p-(5|8)\b/, why: 'panel padding is p-4 (the sign-in cards use p-6)' },
  { re: /\bpx-8\b/, why: 'page padding is px-4 / md:px-6' },
  { re: /\bpy-12\b/, why: 'empty states are py-4 (compact) or py-10 (page)' },
  { re: /\bsize-12\b/, why: 'icon boxes are size-10 at most' },
  { re: /\bh-24\b/, why: 'logo is h-16 at most' },
  { re: /max-w-\[1440px\]/, why: 'content max width is max-w-[2200px]' },
]

const root = import.meta.dirname
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return files(full)
    return /\.(tsx|ts)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : []
  })
}
const rel = (f: string) => relative(root, f).split(sep).join('/')

describe('compact density scale', () => {
  const scoped = [...SCOPE.flatMap((d) => files(join(root, d))), ...EXTRA_FILES.map((f) => join(root, f))]
  it('scans at least one file', () => expect(scoped.length).toBeGreaterThan(0))
  for (const file of scoped) {
    it(`${rel(file)} uses only compact utilities`, () => {
      const src = readFileSync(file, 'utf8')
      const problems: string[] = []
      for (const { re, why, allow } of BANNED) {
        if (allow?.includes(rel(file))) continue
        if (re.test(src)) problems.push(`${re} — ${why}`)
      }
      if (/\bshadow-card\b/.test(src) && !SHADOW_OK.includes(rel(file))) problems.push('shadow-card is only for overlays')
      expect(problems).toEqual([])
    })
  }
})
