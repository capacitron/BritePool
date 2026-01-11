import { test, expect } from '@playwright/test'

test.describe('Public Pages', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/')

    // Should have proper title
    await expect(page).toHaveTitle(/Brite Pool/i)
  })

  test('should load login page without errors', async ({ page }) => {
    await page.goto('/login')

    // Should have no console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForLoadState('networkidle')

    // Filter out common non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('hydration')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('should load register page without errors', async ({ page }) => {
    await page.goto('/register')

    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForLoadState('networkidle')

    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('hydration')
    )

    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Page Navigation', () => {
  test('should have proper page titles', async ({ page }) => {
    // Test login page title
    await page.goto('/login')
    await expect(page).toHaveTitle(/Brite Pool/i)

    // Test register page title
    await page.goto('/register')
    await expect(page).toHaveTitle(/Brite Pool/i)
  })

  test('should have responsive meta viewport', async ({ page }) => {
    await page.goto('/')

    const viewport = await page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveAttribute('content', /width=device-width/i)
  })
})

test.describe('Accessibility Basics', () => {
  test('login page should have accessible elements', async ({ page }) => {
    await page.goto('/login')

    // Check for form labels
    const emailLabel = page.getByLabel(/email/i)
    await expect(emailLabel).toBeVisible()

    const passwordLabel = page.getByLabel(/password/i)
    await expect(passwordLabel).toBeVisible()

    // Submit button should be visible and clickable
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
  })

  test('register page should have accessible elements', async ({ page }) => {
    await page.goto('/register')

    // Check for form inputs using labels
    const nameLabel = page.getByLabel(/full name/i)
    await expect(nameLabel).toBeVisible()

    const emailLabel = page.getByLabel(/email/i)
    await expect(emailLabel).toBeVisible()

    // Submit button
    const submitButton = page.getByRole('button', { name: /create account/i })
    await expect(submitButton).toBeVisible()
  })
})
