import { test, expect, type Page } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const UNIQUE = Date.now()
const TEST_USER = {
  fullName: `Test User ${UNIQUE}`,
  username: `testuser_${UNIQUE}`,
  email: `test_${UNIQUE}@example.com`,
  password: 'TestPass123!',
}

async function register(page: Page) {
  await page.goto(BASE_URL + '/register')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Full Name').fill(TEST_USER.fullName)
  await page.getByLabel('Username').fill(TEST_USER.username)
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.locator('input[type="password"]').first().fill(TEST_USER.password)
  await page.locator('input[type="password"]').last().fill(TEST_USER.password)
  await page.click('button[type="submit"]')

  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/login', { timeout: 15000 })
  const homeReady = page.locator('h1:has-text("Welcome"), h1:has-text("Dashboard"), nav a:has-text("Play")').first()
  await homeReady.waitFor({ state: 'visible', timeout: 15000 })
}

async function login(page: Page) {
  await page.goto(BASE_URL + '/login')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Password').fill(TEST_USER.password)
  await page.click('button[type="submit"]')

  await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

async function navigateTo(page: Page, path: string) {
  await page.goto(BASE_URL + path)
  await page.waitForLoadState('networkidle')
}

function setupMonitoring(page: Page) {
  const consoleErrors = []
  const apiErrors = []
  const api401s = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  page.on('response', (response) => {
    if (response.status() === 401) {
      api401s.push({
        url: response.url(),
        method: response.request().method(),
      })
    } else if (response.status() >= 400) {
      apiErrors.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
      })
    }
  })

  return { consoleErrors, apiErrors, api401s }
}

test('Queen Chess Authenticated E2E Smoke Test', async ({ page }) => {
  // 1. Register
  const monitors = setupMonitoring(page)
  await register(page)
  let bodyText = await page.textContent('body')
  expect(bodyText?.length).toBeGreaterThan(100)
  expect(monitors.consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ERR_CONNECTION_REFUSED'))).toHaveLength(0)
  expect(monitors.apiErrors.filter(e => e.status >= 500)).toHaveLength(0)

  // 2. Home/Dashboard
  monitors.consoleErrors.length = 0
  monitors.apiErrors.length = 0
  monitors.api401s.length = 0
  await navigateTo(page, '/')
  await expect(page.locator('body')).toBeVisible()
  bodyText = await page.textContent('body')
  expect(bodyText?.length).toBeGreaterThan(100)
  expect(monitors.consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ERR_CONNECTION_REFUSED'))).toHaveLength(0)
  expect(monitors.apiErrors.filter(e => e.status >= 500)).toHaveLength(0)
  expect(monitors.api401s).toHaveLength(0)

  // 3. Play
  monitors.consoleErrors.length = 0
  monitors.apiErrors.length = 0
  monitors.api401s.length = 0
  await navigateTo(page, '/play')
  await expect(page.locator('body')).toBeVisible()
  bodyText = await page.textContent('body')
  expect(bodyText?.length).toBeGreaterThan(100)
  expect(monitors.consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ERR_CONNECTION_REFUSED'))).toHaveLength(0)
  expect(monitors.apiErrors.filter(e => e.status >= 500)).toHaveLength(0)
  expect(monitors.api401s).toHaveLength(0)

  // 4. My Games (Analysis)
  monitors.consoleErrors.length = 0
  monitors.apiErrors.length = 0
  monitors.api401s.length = 0
  await navigateTo(page, '/my-games')
  await expect(page.locator('body')).toBeVisible()
  bodyText = await page.textContent('body')
  expect(bodyText?.length).toBeGreaterThan(50)
  expect(monitors.consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ERR_CONNECTION_REFUSED'))).toHaveLength(0)
  expect(monitors.apiErrors.filter(e => e.status >= 500)).toHaveLength(0)
  expect(monitors.api401s).toHaveLength(0)

  // 5. Learning
  monitors.consoleErrors.length = 0
  monitors.apiErrors.length = 0
  monitors.api401s.length = 0
  await navigateTo(page, '/learning')
  await expect(page.locator('body')).toBeVisible()
  bodyText = await page.textContent('body')
  expect(bodyText?.length).toBeGreaterThan(100)
  expect(monitors.consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ERR_CONNECTION_REFUSED'))).toHaveLength(0)
  expect(monitors.apiErrors.filter(e => e.status >= 500)).toHaveLength(0)
  expect(monitors.api401s).toHaveLength(0)

  // 6. Opening Search (within Learning)
  const openingSearchBtn = page.locator('button:has-text("Opening Search")')
  if (await openingSearchBtn.count() > 0) {
    await openingSearchBtn.first().click()
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
  }

  // 7. Quiz/Puzzle
  monitors.consoleErrors.length = 0
  monitors.apiErrors.length = 0
  monitors.api401s.length = 0
  await navigateTo(page, '/quiz')
  await expect(page.locator('body')).toBeVisible()
  bodyText = await page.textContent('body')
  expect(bodyText?.length).toBeGreaterThan(50)
  expect(monitors.consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ERR_CONNECTION_REFUSED'))).toHaveLength(0)
  expect(monitors.apiErrors.filter(e => e.status >= 500)).toHaveLength(0)
  expect(monitors.api401s).toHaveLength(0)

  // 8. Profile
  monitors.consoleErrors.length = 0
  monitors.apiErrors.length = 0
  monitors.api401s.length = 0
  await navigateTo(page, '/profile')
  await expect(page.locator('body')).toBeVisible()
  bodyText = await page.textContent('body')
  expect(bodyText?.length).toBeGreaterThan(50)
  expect(monitors.consoleErrors.filter(e => !e.includes('favicon') && !e.includes('ERR_CONNECTION_REFUSED'))).toHaveLength(0)
  expect(monitors.apiErrors.filter(e => e.status >= 500)).toHaveLength(0)
  expect(monitors.api401s).toHaveLength(0)

  // 9. Logout / Login state handling
  await navigateTo(page, '/profile')
  await page.waitForLoadState('networkidle')

  // Clear auth state manually since there's no visible logout button
  await page.evaluate(() => {
    localStorage.removeItem('qc_token')
    localStorage.removeItem('qc_user')
  })

  // Reload to let AuthContext pick up the cleared state
  await page.reload()
  await page.waitForLoadState('networkidle')

  bodyText = await page.textContent('body')
  const isLoginPage = bodyText?.toLowerCase().includes('sign in') || bodyText?.toLowerCase().includes('login')
  const isLandingPage = bodyText?.toLowerCase().includes('queen chess') && !bodyText?.toLowerCase().includes('play')
  expect(isLoginPage || isLandingPage || await page.locator('input[type="email"]').count() > 0).toBeTruthy()
})
