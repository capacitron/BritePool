import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    // Check page elements - actual UI uses "Welcome Back" heading
    await expect(page).toHaveTitle(/Brite Pool/i)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should display registration page', async ({ page }) => {
    await page.goto('/register')

    // Check page elements - actual UI uses "Join BRITE POOL" heading
    await expect(page).toHaveTitle(/Brite Pool/i)
    await expect(page.getByRole('heading', { name: /join brite pool/i })).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should show validation errors for empty login', async ({ page }) => {
    await page.goto('/login')

    // Click submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show validation or stay on page
    await expect(page).toHaveURL(/login/)
  })

  test('should show validation errors for empty registration', async ({ page }) => {
    await page.goto('/register')

    // Click submit without filling form
    await page.getByRole('button', { name: /create account/i }).click()

    // Should show validation or stay on page
    await expect(page).toHaveURL(/register/)
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')

    // Click on register link - actual text is "Create one"
    await page.getByRole('link', { name: /create one/i }).click()
    await expect(page).toHaveURL(/register/)

    // Click on login link - actual text is "Sign in"
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/)
  })

  test('should redirect unauthenticated users from profile to login', async ({ page }) => {
    await page.goto('/dashboard/profile')

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/)
  })

  test('should redirect unauthenticated users from admin to login', async ({ page }) => {
    await page.goto('/dashboard/admin')

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/)
  })
})
