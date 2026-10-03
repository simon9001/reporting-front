import { expect, test, type Page } from '@playwright/test'
import { addDays, DEFAULT_TIMEZONE, localDateString } from '@sr/shared'

/** Mirrors the default Day 08:00-17:00 / Night 17:00-08:00 pattern. */
function currentShift(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: DEFAULT_TIMEZONE, hour: '2-digit', hour12: false }).format(now))
  const today = localDateString(now, DEFAULT_TIMEZONE)
  if (hour >= 8 && hour < 17) return { date: today, code: 'DAY' }
  return { date: hour >= 17 ? today : addDays(today, -1), code: 'NIGHT' }
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function changePassword(page: Page, current: string, next: string) {
  await expect(page).toHaveURL(/\/change-password$/)
  await page.getByLabel('Current password').fill(current)
  await page.getByLabel('New password', { exact: true }).fill(next)
  await page.getByLabel('Confirm new password').fill(next)
  await page.getByRole('button', { name: 'Change password' }).click()
}

test('admin adds officers and rosters them; the supervisor sees their shift', async ({ page }) => {
  await signIn(page, 'e2e-admin@test.local', 'AdminTemp2026')
  await changePassword(page, 'AdminTemp2026', 'AdminFinal2026')
  await expect(page).toHaveURL(/\/admin\/users$/)

  for (const [name, email] of [['Antony Ochieng', 'antony@test.local'], ['Simon Gatungo', 'simon@test.local']] as const) {
    const form = page.getByRole('form', { name: 'Add user' })
    await form.getByLabel('Full name').fill(name)
    await form.getByLabel('Email').fill(email)
    await form.getByLabel('Role').selectOption({ label: 'Control Room Officer' })
    await form.getByLabel('Temporary password').fill('OfficerTemp2026')
    await form.getByRole('button', { name: 'Add user' }).click()
    await expect(page.getByRole('cell', { name: email })).toBeVisible()
  }

  await page.getByRole('link', { name: 'Roster' }).click()
  const { date, code } = currentShift()
  const cell = page.getByTestId(`cell-${date}-${code}`)
  await cell.getByLabel('Supervisor').selectOption({ label: 'Antony Ochieng' })
  await cell.getByLabel('Officer').selectOption({ label: 'Simon Gatungo' })
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Saved 1 shift.')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await signIn(page, 'antony@test.local', 'OfficerTemp2026')
  await changePassword(page, 'OfficerTemp2026', 'AntonyFinal2026')
  await expect(page).toHaveURL(/\/my-shift$/)
  await expect(page.getByText('You are the Shift Supervisor for this shift.')).toBeVisible()
  await expect(page.getByText('Simon Gatungo').first()).toBeVisible()
})
