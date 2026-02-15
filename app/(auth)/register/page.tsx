'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrength } from '@/components/ui/password-strength'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referrer = searchParams.get('ref')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [showConfirmPassword, setShowConfirmPassword] = useState(true)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const pw = formData.get('password') as string
    const cpw = formData.get('confirmPassword') as string

    if (pw !== cpw) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' })
      return
    }

    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: pw,
    }

    const parsed = registerSchema.safeParse(data)
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, referrer: referrer || undefined }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details?.fieldErrors) {
          setFieldErrors(result.details.fieldErrors)
        } else {
          setError(result.error || 'Registration failed')
        }
        return
      }

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push('/login?registered=true')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Join BRITE POOL</CardTitle>
        <CardDescription>Create your account to begin your journey</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} suppressHydrationWarning>
        <CardContent className="space-y-4" suppressHydrationWarning>
          {referrer && (
            <div className="bg-forest-50 border border-forest-200 text-forest-700 px-4 py-3 rounded-lg text-sm font-body">
              <div className="flex items-start gap-3">
                <UserPlus className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p>
                  You've been invited by <strong>@{referrer}</strong>
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-earth-100 border border-earth-300 text-earth-700 px-4 py-3 rounded-lg text-sm font-body">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              disabled={isLoading}
            />
            {fieldErrors.name && (
              <p className="text-sm text-earth-600 font-body">{fieldErrors.name}</p>
            )}
          </div>
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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-sm text-earth-600 font-body">{fieldErrors.password}</p>
            )}
            <PasswordStrength password={password} className="mt-3" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-earth-600 font-body">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
          <p className="text-sm text-forest-600 text-center font-body">
            Already have an account?{' '}
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Join BRITE POOL</CardTitle>
            <CardDescription>Create your account to begin your journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
            </div>
          </CardContent>
        </Card>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
