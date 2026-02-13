'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
import { resetPasswordSchema } from '@/lib/validations/auth'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showRequestNew, setShowRequestNew] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // No token provided
  if (!token) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Invalid Reset Link</CardTitle>
          <CardDescription>This password reset link is invalid</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-earth-100 border border-earth-300 text-earth-700 px-4 py-3 rounded-lg text-sm font-body">
            The reset link is missing or invalid. Please request a new password reset.
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">Request New Reset Link</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      token,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const parsed = resetPasswordSchema.safeParse(data)
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          const errors: Record<string, string> = {}
          result.errors.forEach((err: { field: string; message: string }) => {
            errors[err.field] = err.message
          })
          setFieldErrors(errors)
        } else {
          // Show the specific error from the API (expired, already used, etc.)
          // and include a link back to forgot-password for convenience
          setError(result.error || 'An error occurred. Please try again.')
          setShowRequestNew(true)
        }
      } else {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch {
      setError('Unable to connect to the server. Please refresh the page and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Password Reset Successful</CardTitle>
          <CardDescription>Your password has been updated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-forest-50 border border-forest-200 text-forest-700 px-4 py-3 rounded-lg text-sm font-body">
            Your password has been reset successfully. You will be redirected to the login page
            shortly.
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">Sign In Now</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-earth-100 border border-earth-300 text-earth-700 px-4 py-3 rounded-lg text-sm font-body">
              <p>{error}</p>
              {showRequestNew && (
                <p className="mt-2">
                  <Link href="/forgot-password" className="text-forest-700 hover:text-forest-800 underline font-medium">
                    Request a new reset link
                  </Link>
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
            />
            {fieldErrors.password && (
              <p className="text-sm text-earth-600 font-body">{fieldErrors.password}</p>
            )}
            <p className="text-xs text-forest-500 font-body">
              Must be at least 8 characters with uppercase, lowercase, and a number
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-earth-600 font-body">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
          <p className="text-sm text-forest-600 text-center font-body">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-forest-700 hover:text-forest-800 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-forest-600">Loading...</div>
          </CardContent>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
