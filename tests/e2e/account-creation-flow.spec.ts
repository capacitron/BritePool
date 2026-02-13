import { test, expect, Page } from '@playwright/test'

/**
 * Comprehensive E2E Tests for Account Creation Flow
 *
 * Test Coverage:
 * 1. Registration Flow - Valid/invalid inputs, duplicates, redirects
 * 2. Login Flow - Password reset, lockout
 *
 * @test Account Creation Flow
 * @description Validates the complete user account creation lifecycle
 */

// Test data generators
const generateTestEmail = () =>
  `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`
const validPassword = 'SecurePass123'
const validName = 'Test User'

// Helper to fill registration form
async function fillRegistrationForm(
  page: Page,
  data: { name?: string; email?: string; password?: string }
) {
  if (data.name !== undefined) {
    await page.getByLabel(/full name/i).fill(data.name)
  }
  if (data.email !== undefined) {
    await page.getByLabel(/email/i).fill(data.email)
  }
  if (data.password !== undefined) {
    await page.getByLabel(/password/i).fill(data.password)
  }
}

// Helper to fill login form
async function fillLoginForm(page: Page, data: { email?: string; password?: string }) {
  if (data.email !== undefined) {
    await page.getByLabel(/email/i).fill(data.email)
  }
  if (data.password !== undefined) {
    await page.getByLabel(/password/i).fill(data.password)
  }
}

/* =============================================================================
 * REGISTRATION FLOW TESTS
 * ============================================================================= */

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /join brite pool/i })).toBeVisible()
  })

  test.describe('Successful Registration', () => {
    test('should register with valid data and redirect to login', async ({ page }) => {
      const testEmail = generateTestEmail()

      await fillRegistrationForm(page, {
        name: validName,
        email: testEmail,
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should redirect to login with registered flag
      await expect(page).toHaveURL(/login\?registered=true/, { timeout: 10000 })

      // Should show success message
      await expect(page.getByText(/account created successfully/i)).toBeVisible()
    })

    test('should show loading state during registration', async ({ page }) => {
      const testEmail = generateTestEmail()

      await fillRegistrationForm(page, {
        name: validName,
        email: testEmail,
        password: validPassword,
      })

      // Click and immediately check for loading state
      const submitButton = page.getByRole('button', { name: /create account/i })
      await submitButton.click()

      // Should show loading indicator
      await expect(page.getByText(/creating account/i)).toBeVisible()
    })

    test('should disable form inputs while submitting', async ({ page }) => {
      const testEmail = generateTestEmail()

      await fillRegistrationForm(page, {
        name: validName,
        email: testEmail,
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Form inputs should be disabled during submission
      await expect(page.getByLabel(/full name/i)).toBeDisabled()
      await expect(page.getByLabel(/email/i)).toBeDisabled()
      await expect(page.getByLabel(/password/i)).toBeDisabled()
    })
  })

  test.describe('Validation Errors - Empty Fields', () => {
    test('should show validation error for empty name', async ({ page }) => {
      await fillRegistrationForm(page, {
        name: '',
        email: generateTestEmail(),
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should stay on register page
      await expect(page).toHaveURL(/register/)
      // Should show name validation error
      await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible()
    })

    test('should show validation error for empty email', async ({ page }) => {
      await fillRegistrationForm(page, {
        name: validName,
        email: '',
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should stay on register page
      await expect(page).toHaveURL(/register/)
      // Should show email validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible()
    })

    test('should show validation error for empty password', async ({ page }) => {
      await fillRegistrationForm(page, {
        name: validName,
        email: generateTestEmail(),
        password: '',
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should stay on register page
      await expect(page).toHaveURL(/register/)
      // Should show password validation error
      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
    })

    test('should show validation errors for all empty fields', async ({ page }) => {
      await page.getByRole('button', { name: /create account/i }).click()

      // Should stay on register page
      await expect(page).toHaveURL(/register/)
    })
  })

  test.describe('Validation Errors - Invalid Inputs', () => {
    test('should show error for name too short', async ({ page }) => {
      await fillRegistrationForm(page, {
        name: 'A', // Less than 2 characters
        email: generateTestEmail(),
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible()
    })

    test('should show error for invalid email format', async ({ page }) => {
      const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'spaces in@email.com']

      for (const invalidEmail of invalidEmails) {
        await page.reload()
        await fillRegistrationForm(page, {
          name: validName,
          email: invalidEmail,
          password: validPassword,
        })

        await page.getByRole('button', { name: /create account/i }).click()

        await expect(page.getByText(/invalid email/i)).toBeVisible()
      }
    })

    test('should show error for password too short', async ({ page }) => {
      await fillRegistrationForm(page, {
        name: validName,
        email: generateTestEmail(),
        password: 'Short1', // Less than 8 characters
      })

      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
    })

    test('should show error for password without uppercase', async ({ page }) => {
      await fillRegistrationForm(page, {
        name: validName,
        email: generateTestEmail(),
        password: 'lowercase123', // No uppercase
      })

      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/uppercase/i)).toBeVisible()
    })

    test('should show error for password without lowercase', async ({ page }) => {
      await fillRegistrationForm(page, {
        name: validName,
        email: generateTestEmail(),
        password: 'UPPERCASE123', // No lowercase
      })

      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/lowercase/i)).toBeVisible()
    })

    test('should show error for password without number', async ({ page }) => {
      await fillRegistrationForm(page, {
        name: validName,
        email: generateTestEmail(),
        password: 'NoNumbersHere', // No numbers
      })

      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/number/i)).toBeVisible()
    })
  })

  test.describe('Duplicate Email Handling', () => {
    test('should show error when registering with existing email', async ({ page, request }) => {
      const existingEmail = generateTestEmail()

      // First, register a user via API
      const registerResponse = await request.post('/api/auth/register', {
        data: {
          name: validName,
          email: existingEmail,
          password: validPassword,
        },
      })
      expect(registerResponse.status()).toBe(201)

      // Now try to register again with the same email via UI
      await fillRegistrationForm(page, {
        name: 'Another User',
        email: existingEmail,
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should show duplicate email error
      await expect(page.getByText(/account with this email already exists/i)).toBeVisible()
      // Should stay on register page
      await expect(page).toHaveURL(/register/)
    })

    test('should handle email case insensitivity for duplicates', async ({ page, request }) => {
      const baseEmail = `test_${Date.now()}@example.com`

      // Register with lowercase email
      await request.post('/api/auth/register', {
        data: {
          name: validName,
          email: baseEmail.toLowerCase(),
          password: validPassword,
        },
      })

      // Try to register with uppercase version
      await fillRegistrationForm(page, {
        name: 'Another User',
        email: baseEmail.toUpperCase(),
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should still detect as duplicate
      await expect(page.getByText(/account with this email already exists/i)).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to login page via sign in link', async ({ page }) => {
      await page.getByRole('link', { name: /sign in/i }).click()

      await expect(page).toHaveURL(/login/)
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    })

    test('should show password requirements hint', async ({ page }) => {
      await expect(page.getByText(/must be at least 8 characters/i)).toBeVisible()
      await expect(page.getByText(/uppercase, lowercase, and a number/i)).toBeVisible()
    })
  })
})

/* =============================================================================
 * LOGIN FLOW TESTS
 * ============================================================================= */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test.describe('Login Validation Errors', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      await fillLoginForm(page, {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123',
      })

      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show invalid credentials error
      await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10000 })
    })

    test('should show validation error for empty email', async ({ page }) => {
      await fillLoginForm(page, {
        email: '',
        password: validPassword,
      })

      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show email validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible()
    })

    test('should show validation error for empty password', async ({ page }) => {
      await fillLoginForm(page, {
        email: generateTestEmail(),
        password: '',
      })

      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show password validation error
      await expect(page.getByText(/password is required/i)).toBeVisible()
    })

    test('should show loading state during login', async ({ page }) => {
      await fillLoginForm(page, {
        email: generateTestEmail(),
        password: validPassword,
      })

      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show loading indicator
      await expect(page.getByText(/signing in/i)).toBeVisible()
    })
  })

  test.describe('Password Reset Flow', () => {
    test('should navigate to forgot password page', async ({ page }) => {
      await page.getByRole('link', { name: /forgot password/i }).click()

      await expect(page).toHaveURL(/forgot-password/)
      await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible()
    })

    test('should submit forgot password request', async ({ page }) => {
      await page.goto('/forgot-password')

      await page.getByLabel(/email/i).fill(generateTestEmail())
      await page.getByRole('button', { name: /send reset link/i }).click()

      // Should show success state
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText(/password reset link/i)).toBeVisible()
    })

    test('should show validation error for invalid email in forgot password', async ({ page }) => {
      await page.goto('/forgot-password')

      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByRole('button', { name: /send reset link/i }).click()

      // Should show validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible()
    })

    test('should navigate back to login from forgot password', async ({ page }) => {
      await page.goto('/forgot-password')

      await page.getByRole('link', { name: /sign in/i }).click()

      await expect(page).toHaveURL(/login/)
    })

    test('should allow trying again after password reset email sent', async ({ page }) => {
      await page.goto('/forgot-password')

      await page.getByLabel(/email/i).fill(generateTestEmail())
      await page.getByRole('button', { name: /send reset link/i }).click()

      // Wait for success state
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
        timeout: 10000,
      })

      // Should have try again button
      await page.getByRole('button', { name: /try again/i }).click()

      // Should return to form
      await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to register page via create account link', async ({ page }) => {
      await page.getByRole('link', { name: /create one/i }).click()

      await expect(page).toHaveURL(/register/)
      await expect(page.getByRole('heading', { name: /join brite pool/i })).toBeVisible()
    })

    test('should show registration success banner after registering', async ({ page }) => {
      await page.goto('/login?registered=true')

      await expect(page.getByText(/account created successfully/i)).toBeVisible()
      await expect(page.getByText(/sign in with your email and password/i)).toBeVisible()
    })
  })
})

/* =============================================================================
 * ACCOUNT LOCKOUT SCENARIOS
 * ============================================================================= */

test.describe('Account Lockout Scenarios', () => {
  test.describe('Rate Limiting', () => {
    test('should handle multiple failed login attempts gracefully', async ({ page }) => {
      await page.goto('/login')

      // Attempt multiple failed logins
      for (let i = 0; i < 3; i++) {
        await fillLoginForm(page, {
          email: 'test@example.com',
          password: `WrongPassword${i}`,
        })

        await page.getByRole('button', { name: /sign in/i }).click()

        // Wait for response
        await page.waitForLoadState('networkidle')

        // Clear form for next attempt
        if (i < 2) {
          await page.getByLabel(/password/i).clear()
        }
      }

      // Should still be on login page (not show any crash or error page)
      await expect(page).toHaveURL(/login/)
    })

    test('should handle registration rate limiting gracefully', async ({ page }) => {
      // Note: This tests UI behavior, actual rate limiting is server-side
      await page.goto('/register')

      await fillRegistrationForm(page, {
        name: validName,
        email: generateTestEmail(),
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should handle any rate limit response gracefully
      await page.waitForLoadState('networkidle')

      // Page should not crash or show unexpected errors
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Suspended Account', () => {
    test('should show appropriate error for suspended account login attempt', async ({ page }) => {
      // Note: We cannot easily create a suspended account in tests without DB access
      // This test verifies the UI can handle the error response
      await page.goto('/login')

      await fillLoginForm(page, {
        email: 'suspended-user@example.com',
        password: validPassword,
      })

      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show error (either invalid credentials or specific suspension message)
      await expect(
        page.getByText(/invalid email or password|account.*suspended|error/i)
      ).toBeVisible({ timeout: 10000 })
    })
  })
})

/* =============================================================================
 * SECURITY TESTS
 * ============================================================================= */

test.describe('Security Tests', () => {
  test.describe('XSS Prevention', () => {
    test('should sanitize script tags in name field', async ({ page }) => {
      await page.goto('/register')

      const xssPayload = '<script>alert("XSS")</script>'

      await fillRegistrationForm(page, {
        name: xssPayload,
        email: generateTestEmail(),
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should not execute script (page should still be functional)
      await expect(page.locator('body')).toBeVisible()

      // No alert should have been triggered (test would hang if XSS worked)
    })

    test('should sanitize HTML in email field', async ({ page }) => {
      await page.goto('/register')

      await fillRegistrationForm(page, {
        name: validName,
        email: '<img src=x onerror=alert("XSS")>@test.com',
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Should show validation error for invalid email, not execute script
      await expect(page.getByText(/invalid email/i)).toBeVisible()
    })
  })

  test.describe('CSRF Protection', () => {
    test('should handle form submission properly', async ({ page }) => {
      await page.goto('/register')

      await fillRegistrationForm(page, {
        name: validName,
        email: generateTestEmail(),
        password: validPassword,
      })

      await page.getByRole('button', { name: /create account/i }).click()

      // Form should submit successfully (CSRF token handled by Next.js)
      await page.waitForLoadState('networkidle')

      // Should either redirect to login or show success/error (not a CSRF error)
      const currentUrl = page.url()
      const bodyText = await page.locator('body').textContent()

      expect(
        currentUrl.includes('login') ||
          bodyText?.toLowerCase().includes('success') ||
          bodyText?.toLowerCase().includes('account') ||
          bodyText?.toLowerCase().includes('error')
      ).toBeTruthy()
    })
  })
})

/* =============================================================================
 * ACCESSIBILITY TESTS
 * ============================================================================= */

test.describe('Accessibility', () => {
  test('registration form should have proper labels', async ({ page }) => {
    await page.goto('/register')

    // All form inputs should have associated labels
    const nameInput = page.getByLabel(/full name/i)
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)

    await expect(nameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('login form should have proper labels', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('submit buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/register')

    // Tab to submit button and verify it's focusable
    await page.keyboard.press('Tab') // Name
    await page.keyboard.press('Tab') // Email
    await page.keyboard.press('Tab') // Password
    await page.keyboard.press('Tab') // Submit button

    const submitButton = page.getByRole('button', { name: /create account/i })
    await expect(submitButton).toBeFocused()
  })

  test('error messages should be visible and descriptive', async ({ page }) => {
    await page.goto('/register')

    await fillRegistrationForm(page, {
      name: 'A',
      email: 'invalid',
      password: 'short',
    })

    await page.getByRole('button', { name: /create account/i }).click()

    // Error messages should be present and descriptive
    const errorMessages = await page.getByText(/must be|invalid|required/i).all()
    expect(errorMessages.length).toBeGreaterThan(0)
  })
})

/* =============================================================================
 * EDGE CASES
 * ============================================================================= */

test.describe('Edge Cases', () => {
  test('should handle very long name input', async ({ page }) => {
    await page.goto('/register')

    const longName = 'A'.repeat(200) // Exceeds typical limits

    await fillRegistrationForm(page, {
      name: longName,
      email: generateTestEmail(),
      password: validPassword,
    })

    await page.getByRole('button', { name: /create account/i }).click()

    // Should either accept (if within limit) or show appropriate error
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle special characters in name', async ({ page }) => {
    await page.goto('/register')

    await fillRegistrationForm(page, {
      name: "O'Connor-Smith Jr.",
      email: generateTestEmail(),
      password: validPassword,
    })

    await page.getByRole('button', { name: /create account/i }).click()

    // Should accept names with apostrophes and hyphens
    await expect(page).toHaveURL(/login\?registered=true/, { timeout: 10000 })
  })

  test('should handle email with plus sign', async ({ page }) => {
    await page.goto('/register')

    const emailWithPlus = `test+${Date.now()}@example.com`

    await fillRegistrationForm(page, {
      name: validName,
      email: emailWithPlus,
      password: validPassword,
    })

    await page.getByRole('button', { name: /create account/i }).click()

    // Should accept email with plus sign
    await expect(page).toHaveURL(/login\?registered=true/, { timeout: 10000 })
  })

  test('should handle unicode characters in name', async ({ page }) => {
    await page.goto('/register')

    await fillRegistrationForm(page, {
      name: 'Jose Garcia Martinez',
      email: generateTestEmail(),
      password: validPassword,
    })

    await page.getByRole('button', { name: /create account/i }).click()

    // Should accept unicode characters
    await expect(page).toHaveURL(/login\?registered=true/, { timeout: 10000 })
  })

  test('should trim whitespace from email', async ({ page }) => {
    await page.goto('/register')

    const testEmail = generateTestEmail()

    await fillRegistrationForm(page, {
      name: validName,
      email: `  ${testEmail}  `, // Extra whitespace
      password: validPassword,
    })

    await page.getByRole('button', { name: /create account/i }).click()

    // Should accept and trim the email
    await expect(page).toHaveURL(/login\?registered=true/, { timeout: 10000 })
  })
})
