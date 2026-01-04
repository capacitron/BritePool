'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  fallbackUrl?: string
  fallbackLabel?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const fallbackUrl = this.props.fallbackUrl || '/dashboard'
      const fallbackLabel = this.props.fallbackLabel || 'Go back'

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6 bg-sand-50">
          <div className="text-center max-w-md">
            <div className="mx-auto h-16 w-16 rounded-full bg-earth-500/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-earth-500" />
            </div>
            <h2 className="mt-6 text-2xl font-display font-semibold text-forest-900">
              Something went wrong
            </h2>
            <p className="mt-3 text-forest-600">
              An unexpected error occurred. Please try again or return to safety.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-forest-50 border border-forest-100 p-4 text-left text-xs text-forest-800">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="border-forest-200 text-forest-700 hover:bg-forest-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button asChild className="bg-forest-600 hover:bg-forest-700 text-white">
                <Link href={fallbackUrl}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {fallbackLabel}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
