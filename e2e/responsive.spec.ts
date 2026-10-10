import { execSync } from 'node:child_process'
import { expect, request, test, type Page } from '@playwright/test'

const WIDTHS: [number, number][] = [[360, 780], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1920, 1080], [2560, 1440]]

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function noHorizontalScroll(page: Page, name: string, w: number, h: number) {
  await page.waitForLoadState('load')
  // Wait for real content: no Skeleton ("Loading") or Spinner ("Loading…") placeholders left, then two frames to settle layout.
  // Queries mount after `load`, so a single zero count can be a gap before they start: require it to stay zero for 1s.
  const loading = page.locator('[role="status"][aria-label^="Loading"]')
  await expect(async () => {
    await expect(loading).toHaveCount(0, { timeout: 1000 })
    await page.waitForTimeout(1000)
    await expect(loading).toHaveCount(0, { timeout: 1000 })
  }).toPass({ timeout: 30_000 })
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), { message: `${name} scrolls sideways at ${w}px` }).toBe(true)
  await page.screenshot({ path: `e2e-screens/${name}-${w}x${h}.png`, fullPage: true })
}

test.beforeAll(() => {
  execSync('pnpm --filter backend e2e:prepare', { stdio: 'inherit' })
})

// Real content: the prepared database has no incidents, so seed some (long text included) as the supervisor.
test.beforeAll(async () => {
  test.setTimeout(120_000)
  const api = await request.newContext({ baseURL: 'http://localhost:5174' })
  const login = await api.post('/api/auth/login', { data: { email: 'e2e-sup@test.local', password: 'SupervisorPass2026' } })
  expect(login.ok()).toBe(true)
  const lookups = (await (await api.get('/api/config/lookups')).json()) as { id: number; listType: string; value: string }[]
  const vehicles = (await (await api.get('/api/config/vehicles')).json()) as { id: number; unitId: string }[]
  const pick = (listType: string, value?: string) => lookups.find((l) => l.listType === listType && (!value || l.value === value))!.id
  const at = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
  const long = 'Weighbridge indicator lost communication with the controller repeatedly during peak hours and the operator reported intermittent faults across several lanes while trucks queued beyond the gate; engineers were called and the matter was escalated for follow up. '.repeat(1).slice(0, 300)
  const bodies: Record<string, unknown>[] = [
    { side: 'STATIC', occurredAt: at(10), locationId: pick('LOCATION'), locationDetail: 'Lane 3 inbound weighbridge cabin, north gantry, behind the old customs shed', categoryId: pick('CATEGORY'), severity: 'CRITICAL', description: long, status: 'OPEN' },
    { side: 'STATIC', occurredAt: at(25), locationId: pick('LOCATION'), categoryId: pick('CATEGORY'), severity: 'HIGH', description: 'Camera WB04 went offline', status: 'OPEN' },
    { side: 'STATIC', occurredAt: at(40), locationId: pick('LOCATION'), categoryId: pick('CATEGORY'), severity: 'LOW', description: 'Minor glare on lane 2 camera', status: 'OPEN' },
    {
      side: 'MOBILE', occurredAt: at(15), vehicleId: vehicles.find((v) => v.unitId === 'KDG 143S')!.id, locationText: 'Mlolongo',
      vehicleStatus: 'ONLINE', gpsStatus: 'ONLINE', dashcamStatus: 'OFFLINE', platformId: pick('PLATFORM', 'Tracksolid'),
      categoryId: pick('CATEGORY', 'Tracksolid'), severity: 'HIGH', description: 'Inside camera blank on KDG 143S', status: 'OPEN',
    },
  ]
  for (const data of bodies) {
    const res = await api.post('/api/incidents', { data })
    expect(res.ok(), await res.text()).toBe(true)
  }
  await api.dispose()
})

test('no page scrolls sideways at any supported width', async ({ browser }) => {
  test.setTimeout(600_000)
  for (const [w, h] of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await ctx.newPage()
    await page.goto('/login')
    await noHorizontalScroll(page, 'login', w, h)
    await signIn(page, 'e2e-dd@test.local', 'DirectorPass2026')
    await expect(page).toHaveURL(/\/dashboard$/)
    await noHorizontalScroll(page, 'dashboard-all', w, h)
    await page.goto('/dashboard?side=MOBILE')
    await noHorizontalScroll(page, 'dashboard-mobile', w, h)
    await page.goto('/incidents')
    await noHorizontalScroll(page, 'explorer', w, h)
    if (w < 1024) {
      await page.getByRole('button', { name: /^Filters/ }).click()
      await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
      await page.getByRole('dialog', { name: 'Filters' }).getByRole('button', { name: /^Severity:/ }).click()
      await expect(page.getByRole('checkbox').first()).toBeInViewport({ ratio: 1 })
      await noHorizontalScroll(page, 'explorer-filters', w, h)
      await page.keyboard.press('Escape')
      await page.keyboard.press('Escape')
    }
    await page.goto('/roster')
    await noHorizontalScroll(page, 'roster', w, h)
    await ctx.close()

    const octx = await browser.newContext({ viewport: { width: w, height: h } })
    const officer = await octx.newPage()
    await signIn(officer, 'e2e-sup@test.local', 'SupervisorPass2026')
    await expect(officer).toHaveURL(/\/my-shift$/)
    await noHorizontalScroll(officer, 'my-shift', w, h)
    await officer.getByRole('button', { name: 'Log incident' }).click()
    await expect(officer.getByRole('dialog')).toBeVisible()
    await noHorizontalScroll(officer, 'log-incident', w, h)
    await octx.close()
  }
})

test('exactly one Roster link is exposed on tablet and desktop', async ({ browser }) => {
  for (const width of [768, 1366]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    await signIn(page, 'e2e-dd@test.local', 'DirectorPass2026')
    await expect(page.getByRole('link', { name: 'Roster' })).toHaveCount(1)
    await ctx.close()
  }
})

test('phone menu traps focus and returns it to the menu button on Escape', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await signIn(page, 'e2e-dd@test.local', 'DirectorPass2026')
  const menuButton = page.getByRole('button', { name: 'Open menu' })
  await menuButton.click()
  const menu = page.getByRole('dialog', { name: 'Menu' })
  await expect(menu).toBeVisible()
  for (let i = 0; i < 15; i++) await page.keyboard.press('Tab')
  expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(menuButton).toBeFocused()
  await ctx.close()
})

test('the dashboard date picker is not clipped on phones', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await signIn(page, 'e2e-dd@test.local', 'DirectorPass2026')
  // The date picker's trigger is a button labelled with periodLabel(): "This month" by default (the Period switch's "This month" is a radio).
  await page.getByRole('button', { name: 'This month' }).click()
  await expect(page.getByRole('button', { name: 'Apply' })).toBeInViewport({ ratio: 1 })
  await ctx.close()
})

test('widening past lg removes the rail overlay instead of doubling the sidebar', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } })
  const page = await ctx.newPage()
  await signIn(page, 'e2e-dd@test.local', 'DirectorPass2026')
  await page.getByRole('button', { name: 'Expand menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  await page.setViewportSize({ width: 1366, height: 768 })
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Roster' })).toHaveCount(1)
  // narrowing again must not bring the stale overlay back
  await page.setViewportSize({ width: 768, height: 1024 })
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Expand menu' })).toHaveAttribute('aria-expanded', 'false')
  await ctx.close()
})

test('Escape in the command palette closes only the palette, not the dialog beneath it', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await ctx.newPage()
  await signIn(page, 'e2e-sup@test.local', 'SupervisorPass2026')
  await page.getByRole('button', { name: 'Log incident' }).click()
  const dialog = page.getByRole('dialog', { name: 'Log incident' })
  const description = dialog.locator('label', { hasText: /^Description/ }).locator('textarea')
  await description.fill('Keep this text')
  await page.keyboard.press('Control+K')
  await expect(page.getByRole('combobox', { name: 'Search' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('combobox', { name: 'Search' })).toHaveCount(0)
  await expect(dialog).toBeVisible()
  await expect(description).toHaveValue('Keep this text')
  await ctx.close()
})
