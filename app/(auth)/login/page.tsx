'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, Mail, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [needsVerification, setNeedsVerification] = useState(false)
  const [attemptedEmail, setAttemptedEmail] = useState<string>('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setNeedsVerification(false)
    setResendSuccess(false)

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const parsed = loginSchema.safeParse(data)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)
    setAttemptedEmail(data.email)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        // Check for email verification error
        if (result.error.includes('verify') || result.error.includes('Verify')) {
          setNeedsVerification(true)
        } else {
          setError('Invalid email or password')
        }
      } else if (result?.ok) {
        // Refresh router and wait for session to propagate
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Check if user is admin and redirect accordingly
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role
        if (role === 'WEB_STEWARD' || role === 'BOARD_CHAIR') {
          router.push('/dashboard/admin')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!attemptedEmail || resendLoading) return

    setResendLoading(true)
    setResendSuccess(false)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: attemptedEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendSuccess(true)
      } else {
        setError(data.error || 'Failed to resend verification email')
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to your BRITE POOL account</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} suppressHydrationWarning>
        <CardContent className="space-y-4" suppressHydrationWarning>
          {/* Success message after registration */}
          {justRegistered && !error && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-body">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Account created successfully!</p>
                  <p className="mt-1">
                    Please check your email and click the verification link before signing in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email verification required - prominent card */}
          {needsVerification && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">Email verification required</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Please verify your email address before signing in. We sent a verification link
                    to:
                  </p>
                  <p className="mt-1 text-sm font-medium text-amber-900">{attemptedEmail}</p>

                  {resendSuccess ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verification email sent! Check your inbox.</span>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-xs text-amber-600 mb-2">
                        Didn't receive the email? Check your spam folder or request a new one.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        className="border-amber-300 text-amber-800 hover:bg-amber-100"
                      >
                        {resendLoading ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Resend verification email
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && !needsVerification && (
            <div className="bg-earth-100 border border-earth-300 text-earth-700 px-4 py-3 rounded-lg text-sm font-body">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="text-sm text-earth-600 font-body">{fieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-forest-600 hover:text-forest-700 hover:underline font-body"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
            />
            {fieldErrors.password && (
              <p className="text-sm text-earth-600 font-body">{fieldErrors.password}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          <p className="text-sm text-forest-600 text-center font-body">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-forest-700 hover:text-forest-800 hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

function LoadingFallback() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to your BRITE POOL account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  )
}
