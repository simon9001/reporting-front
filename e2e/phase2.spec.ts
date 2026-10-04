import { execSync } from 'node:child_process'
import { expect, test, type Page } from '@playwright/test'
import { DEFAULT_TIMEZONE, localDateString } from '@sr/shared'

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test.beforeAll(() => {
  // Fresh data for this file (the Phase 1 test changes the roster).
  execSync('pnpm --filter backend e2e:prepare', { stdio: 'inherit' })
})

test('officer logs an incident with a snapshot; the Deputy Director sees it live and finds it in the explorer', async ({ browser }) => {
  const ddContext = await browser.newContext()
  const dd = await ddContext.newPage()
  await signIn(dd, 'e2e-dd@test.local', 'DirectorPass2026')
  await expect(dd).toHaveURL(/\/dashboard$/)
  await expect(dd.getByText('Nothing needs attention')).toBeVisible()
  await expect(dd.getByText('Live', { exact: true })).toBeVisible()

  const officerContext = await browser.newContext()
  const officer = await officerContext.newPage()
  await signIn(officer, 'e2e-sup@test.local', 'SupervisorPass2026')
  await expect(officer).toHaveURL(/\/my-shift$/)
  await expect(officer.getByText('You are the Shift Supervisor for this shift.')).toBeVisible()

  await officer.getByRole('button', { name: 'Log incident' }).click()
  await officer.getByRole('dialog').locator('label', { hasText: /^Location(?! detail)/ }).locator('select').selectOption({ label: 'Weighbridge 04' })
  await officer.getByRole('dialog').locator('label', { hasText: /^Category/ }).locator('select').selectOption({ label: 'CCTV' })
  await officer.getByRole('radio', { name: 'High' }).click()
  await officer.getByRole('dialog').locator('label', { hasText: /^Description/ }).locator('textarea').fill('Camera WB04 went offline (e2e)')
  await officer.getByLabel('Add snapshots').setInputFiles({ name: 'wb04.png', mimeType: 'image/png', buffer: PNG })
  await officer.getByRole('button', { name: 'Save incident' }).click()

  const drawerTitle = officer.getByRole('dialog').getByText(/^INC-\d{4}-\d{4}$/)
  await expect(drawerTitle).toBeVisible()
  const ref = (await drawerTitle.textContent())!.trim()
  await expect(officer.getByRole('img', { name: 'wb04.png' })).toBeVisible()

  // No reload on the Deputy Director's screen: the live update brings it in.
  await expect(dd.getByRole('row', { name: `Open ${ref}` })).toBeVisible({ timeout: 15_000 })

  const today = localDateString(new Date(), process.env.SR_APP_TIMEZONE ?? DEFAULT_TIMEZONE)
  await dd.goto(`/incidents?from=${today}&to=${today}`)
  await dd.getByRole('row', { name: `Open ${ref}` }).click()
  const record = dd.getByRole('dialog')
  await expect(record.getByText('Camera WB04 went offline (e2e)')).toBeVisible()
  await expect(record.getByText('Snapshots (1)')).toBeVisible()
  await expect(record.getByRole('img', { name: 'wb04.png' })).toBeVisible()

  await ddContext.close()
  await officerContext.close()
})

test('officer logs a mobile weighbridge incident; the Deputy Director sees it under Mobile and finds it by unit', async ({ browser }) => {
  // The Deputy Director is already on the Mobile dashboard before the officer saves, so the row must arrive live.
  const ddContext = await browser.newContext()
  const dd = await ddContext.newPage()
  await signIn(dd, 'e2e-dd@test.local', 'DirectorPass2026')
  await expect(dd).toHaveURL(/\/dashboard$/)
  await dd.getByRole('radiogroup', { name: 'Side' }).getByRole('radio', { name: 'Mobile' }).click()
  await expect(dd).toHaveURL(/side=MOBILE/)

  const officerContext = await browser.newContext()
  const officer = await officerContext.newPage()
  await signIn(officer, 'e2e-sup@test.local', 'SupervisorPass2026')
  await expect(officer).toHaveURL(/\/my-shift$/)

  await officer.getByRole('button', { name: 'Log incident' }).click()
  const form = officer.getByRole('dialog')
  await form.getByRole('radio', { name: 'Mobile weighbridge' }).click()
  const unit = form.locator('label', { hasText: /^Vehicle \/ unit/ }).locator('select')
  await unit.selectOption(await unit.locator('option', { hasText: 'KDG 143S' }).getAttribute('value'))
  await form.locator('label', { hasText: /^Location/ }).locator('input').fill('Mlolongo')
  await form.locator('label', { hasText: /^Platform/ }).locator('select').selectOption({ label: 'Tracksolid' })
  await form.locator('label', { hasText: /^Vehicle status/ }).locator('select').selectOption({ label: 'Online' })
  await form.locator('label', { hasText: /^GPS status/ }).locator('select').selectOption({ label: 'Online' })
  await form.locator('label', { hasText: /^Dashcam status/ }).locator('select').selectOption({ label: 'Offline' })
  await form.locator('label', { hasText: /^Event \/ incident/ }).locator('textarea').fill('Inside camera blank on KDG 143S (e2e)')
  await form.locator('label', { hasText: /^Category/ }).locator('select').selectOption({ label: 'Tracksolid' })
  await form.getByRole('radio', { name: 'High' }).click()
  await officer.getByRole('button', { name: 'Save incident' }).click()

  const title = officer.getByRole('dialog').getByText(/^MWB-\d{4}-\d{4}$/)
  await expect(title).toBeVisible()
  const ref = (await title.textContent())!.trim()

  // No reload on the Deputy Director's screen: the live update brings it in.
  await expect(dd.getByRole('row', { name: `Open ${ref}` })).toBeVisible({ timeout: 15_000 })

  await dd.goto(`/incidents?q=${encodeURIComponent('KDG 143S')}`)
  await dd.getByRole('row', { name: `Open ${ref}` }).click()
  const record = dd.getByRole('dialog')
  await expect(record.getByText('Inside camera blank on KDG 143S (e2e)')).toBeVisible()
  await expect(record.getByText('Dashcam: Offline')).toBeVisible()

  await ddContext.close()
  await officerContext.close()
})
