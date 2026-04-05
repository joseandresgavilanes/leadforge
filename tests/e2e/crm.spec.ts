import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const DEMO_EMAIL = 'admin@demo.leadforge.io'
const DEMO_PASSWORD = 'Demo1234!'

test.describe('LeadForge CRM — E2E Suite', () => {
  // ── Auth ────────────────────────────────────────────────────────────
  test('login page loads in EN and ES', async ({ page }) => {
    await page.goto(`${BASE}/en/login`)
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()

    await page.goto(`${BASE}/es/login`)
    await expect(page.getByRole('heading', { name: /Bienvenido/i })).toBeVisible()
  })

  test('signup page loads', async ({ page }) => {
    await page.goto(`${BASE}/en/signup`)
    await expect(page.getByRole('heading', { name: /free trial/i })).toBeVisible()
  })

  test('login with demo credentials', async ({ page }) => {
    await page.goto(`${BASE}/en/login`)
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 10000 })
  })

  // ── Marketing ───────────────────────────────────────────────────────
  test('home page loads', async ({ page }) => {
    await page.goto(`${BASE}/en`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    await page.goto(`${BASE}/en/pricing`)
    await expect(page).toHaveURL(/\/en\/pricing/)
  })

  // ── Locale Switch ───────────────────────────────────────────────────
  test('switch locale EN → ES on marketing page', async ({ page }) => {
    await page.goto(`${BASE}/en`)
    // Find language button
    const langBtn = page.getByText('English')
    await langBtn.click()
    await page.getByText('Español').click()
    await expect(page).toHaveURL(/\/es/)
    await expect(page.getByText(/nunca pierdas/i)).toBeVisible()
  })

  // ── Dashboard ───────────────────────────────────────────────────────
  test('dashboard shows stats after login', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/dashboard`)
    await expect(page.getByText(/Pipeline Value/i)).toBeVisible()
    await expect(page.getByText(/New Leads/i)).toBeVisible()
  })

  // ── Leads ───────────────────────────────────────────────────────────
  test('leads list page loads', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/leads`)
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible()
  })

  test('create a new lead', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/leads/new`)
    await page.fill('input[name="firstName"]', 'TestLead')
    await page.fill('input[name="lastName"]', 'E2E')
    await page.fill('input[name="email"]', 'testlead@e2e.test')
    await page.fill('input[name="company"]', 'E2E Corp')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/leads\//, { timeout: 8000 })
    await expect(page.getByText('TestLead E2E')).toBeVisible()
  })

  // ── Opportunities ───────────────────────────────────────────────────
  test('opportunities kanban loads', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/opportunities`)
    await expect(page.getByText(/Prospecting/i)).toBeVisible()
  })

  test('create opportunity', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/opportunities/new`)
    await page.fill('input[name="name"]', 'E2E Opportunity')
    await page.fill('input[name="value"]', '25000')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/opportunities\//, { timeout: 8000 })
  })

  // ── Tasks ───────────────────────────────────────────────────────────
  test('tasks list loads', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/tasks`)
    await expect(page.getByRole('heading', { name: /Tasks/i })).toBeVisible()
  })

  test('create a task', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/tasks/new`)
    await page.fill('input[name="title"]', 'E2E Test Task')
    await page.click('button[type="submit"]')
    await expect(page.getByText('E2E Test Task')).toBeVisible({ timeout: 8000 })
  })

  // ── Quotes ──────────────────────────────────────────────────────────
  test('quotes list loads', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/quotes`)
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible()
  })

  // ── Billing ─────────────────────────────────────────────────────────
  test('billing page loads', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/billing`)
    await expect(page.getByText(/Billing/i)).toBeVisible()
    await expect(page.getByText(/Growth/i)).toBeVisible()
  })

  test('billing shows upgrade CTAs', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/billing`)
    await expect(page.getByRole('button', { name: /Upgrade to Pro/i })).toBeVisible()
  })

  // ── Lead conversion ─────────────────────────────────────────────────
  test('lead detail shows convert section', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/leads`)
    await page.getByRole('link', { name: /View/i }).first().click()
    await expect(page).toHaveURL(/\/app\/leads\//)
    await expect(page.getByText(/Convert Lead|convert/i)).toBeVisible()
  })

  // ── Opportunity stage ───────────────────────────────────────────────
  test('opportunity detail can change stage', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/opportunities?view=table`)
    await page.getByRole('link', { name: /View/i }).first().click()
    await expect(page).toHaveURL(/\/app\/opportunities\/[^/]+$/)
    await page.getByLabel(/Stage/i).selectOption({ index: 1 })
    await page.waitForTimeout(500)
  })

  // ── Quote create ──────────────────────────────────────────────────
  test('create quote flow', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/quotes/new`)
    await page.fill('input[id="title"]', 'E2E Quote')
    await page.getByPlaceholder('Description').first().fill('E2E line')
    await page.getByPlaceholder('Qty').first().fill('1')
    await page.getByPlaceholder('Unit Price').first().fill('100')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/quotes\//, { timeout: 12000 })
  })

  // ── Locale in App ───────────────────────────────────────────────────
  test('app locale switch EN → ES', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto(`${BASE}/en/app/dashboard`)
    // Find language button in topbar
    await page.getByText('English').click()
    await page.getByText('Español').click()
    await expect(page).toHaveURL(/\/es\/app\/dashboard/, { timeout: 8000 })
    await expect(page.getByText(/Panel/i)).toBeVisible()
  })
})

// Helper
async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/en/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/app\/dashboard/, { timeout: 10000 })
}
