'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2 } from 'lucide-react'
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
import { loginSchema } from '@/lib/validations/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

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

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        // Fetch session to determine redirect destination
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role

        // Use hard redirect to ensure proper navigation after auth
        const destination =
          role === 'WEB_STEWARD' || role === 'BOARD_CHAIR' ? '/dashboard/admin' : '/dashboard'
        window.location.href = destination
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to connect to the authentication service. Please refresh the page and try again.'
      setError(message)
    } finally {
      setIsLoading(false)
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
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Account created successfully!</p>
                  <p className="mt-1">You can now sign in with your email and password.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
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
