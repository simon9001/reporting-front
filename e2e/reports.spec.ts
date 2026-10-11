import { execSync } from 'node:child_process'
import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test.beforeAll(() => {
  execSync('pnpm --filter backend e2e:prepare', { stdio: 'inherit' })
})

test('the supervisor submits the shift report; the Deputy Director sees it arrive live and downloads the PDF', async ({ browser }) => {
  test.setTimeout(120_000)
  const ddContext = await browser.newContext()
  const dd = await ddContext.newPage()
  await signIn(dd, 'e2e-dd@test.local', 'DirectorPass2026')
  await expect(dd).toHaveURL(/\/dashboard$/)
  await dd.goto('/reports')
  await expect(dd.getByRole('heading', { name: 'Reports' })).toBeVisible()

  const supContext = await browser.newContext()
  const sup = await supContext.newPage()
  await signIn(sup, 'e2e-sup@test.local', 'SupervisorPass2026')
  await expect(sup).toHaveURL(/\/my-shift$/)
  await sup.getByRole('link', { name: 'Open report' }).first().click()
  await expect(sup).toHaveURL(/\/reports\/\d+$/)

  await sup.getByRole('radiogroup', { name: 'Overall status' }).getByRole('radio', { name: 'Normal' }).click()
  for (const label of [
    'All incidents for this shift have been reviewed and are complete',
    'All critical and high incidents were escalated',
    'Outstanding items have been handed over to the next shift',
    'This report is submitted to management',
  ]) await sup.getByLabel(label).check()
  // Type and submit immediately: the pending autosave must be flushed before submitting.
  await sup.getByLabel('Shift overview').fill('Quiet shift, all systems normal (e2e)')
  await sup.getByRole('button', { name: 'Submit report' }).click()
  const confirm = sup.getByRole('dialog', { name: 'Submit report' })
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Yes, submit' }).click()
  await expect(sup.getByText('Submitted — this report can no longer be changed.')).toBeVisible({ timeout: 15_000 })
  await expect(sup.getByText('Quiet shift, all systems normal (e2e)')).toBeVisible()

  // Live: no reload on the Deputy Director's archive.
  const row = dd.getByRole('row', { name: /^Open .* shift report / }).first()
  await expect(row).toContainText('Submitted', { timeout: 15_000 })
  await row.click()
  await expect(dd).toHaveURL(/\/reports\/\d+$/)
  const [download] = await Promise.all([dd.waitForEvent('download'), dd.getByRole('link', { name: 'Download PDF' }).click()])
  expect(download.suggestedFilename()).toMatch(/^Shift-report-\d{4}-\d{2}-\d{2}-[A-Z]+\.pdf$/)

  await ddContext.close()
  await supContext.close()
})
