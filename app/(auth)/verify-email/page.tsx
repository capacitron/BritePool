'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react'

type VerificationState = 'loading' | 'success' | 'error' | 'no-token'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('no-token')
      return
    }

    async function verifyEmail() {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setState('success')
          setMessage(data.message)
        } else {
          setState('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        setState('error')
        setMessage('An error occurred during verification')
      }
    }

    verifyEmail()
  }, [token])

  async function handleResend() {
    if (!resendEmail.trim()) return

    setIsResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      })
      const data = await response.json()
      setResendMessage(data.message || 'Verification email sent!')
    } catch (error) {
      setResendMessage('Failed to send verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  // No token provided - show resend form
  if (state === 'no-token') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sand-50 to-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-forest-600" />
            </div>
            <h1 className="text-2xl font-display font-bold text-forest-800">
              Email Verification
            </h1>
            <p className="text-forest-600 mt-2 font-body">
              Enter your email to receive a new verification link
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="w-full px-4 py-3 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent font-body"
            />
            <Button
              onClick={handleResend}
              disabled={isResending || !resendEmail.trim()}
              className="w-full bg-forest-600 hover:bg-forest-700 text-white"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Send Verification Email
                </>
              )}
            </Button>
            {resendMessage && (
              <p className="text-sm text-center text-forest-600 font-body">
                {resendMessage}
              </p>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-forest-600 hover:text-forest-800 font-body"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sand-50 to-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-forest-600 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-forest-800">
            Verifying Your Email
          </h1>
          <p className="text-forest-600 mt-2 font-body">
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    )
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sand-50 to-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-forest-800">
            Email Verified!
          </h1>
          <p className="text-forest-600 mt-2 mb-6 font-body">
            {message}
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-forest-600 hover:bg-forest-700 text-white"
          >
            Continue to Login
          </Button>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-50 to-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-earth-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-forest-800">
            Verification Failed
          </h1>
          <p className="text-earth-600 mt-2 font-body">
            {message}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-forest-600 text-center font-body">
            Request a new verification link:
          </p>
          <input
            type="email"
            placeholder="Enter your email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            className="w-full px-4 py-3 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent font-body"
          />
          <Button
            onClick={handleResend}
            disabled={isResending || !resendEmail.trim()}
            className="w-full bg-forest-600 hover:bg-forest-700 text-white"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Send New Verification Email
              </>
            )}
          </Button>
          {resendMessage && (
            <p className="text-sm text-center text-forest-600 font-body">
              {resendMessage}
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-forest-600 hover:text-forest-800 font-body"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
