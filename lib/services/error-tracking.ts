import { logger } from '@/lib/logger'

interface ErrorContext {
  userId?: string
  requestId?: string
  path?: string
  method?: string
  userAgent?: string
  extra?: Record<string, unknown>
}

interface ErrorReport {
  id: string
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  context: ErrorContext
  environment: string
  version?: string
}

/**
 * Error tracking service
 * Replace with Sentry, Bugsnag, or similar in production
 */
class ErrorTracker {
  private errors: ErrorReport[] = []
  private readonly maxStoredErrors = 100

  constructor() {
    // In production, initialize Sentry here:
    // Sentry.init({ dsn: process.env.SENTRY_DSN })
  }

  captureException(error: Error, context: ErrorContext = {}): string {
    const errorId = this.generateErrorId()

    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version,
    }

    // Store locally for development
    this.storeError(report)

    // Log the error
    logger.error(
      {
        errorId,
        error: error.name,
        message: error.message,
        ...context,
      },
      'Exception captured'
    )

    // In production, send to external service:
    // Sentry.captureException(error, { extra: context })

    return errorId
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context: ErrorContext = {}
  ): string {
    const errorId = this.generateErrorId()

    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: level.toUpperCase(),
        message,
      },
      context,
      environment: process.env.NODE_ENV || 'development',
    }

    this.storeError(report)

    logger[level === 'warning' ? 'warn' : level]({ errorId, ...context }, message)

    return errorId
  }

  setUser(userId: string, email?: string, role?: string): void {
    // In production: Sentry.setUser({ id: userId, email, role })
    logger.debug({ userId, email, role }, 'User context set')
  }

  clearUser(): void {
    // In production: Sentry.setUser(null)
    logger.debug('User context cleared')
  }

  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
    // In production: Sentry.addBreadcrumb({ category, message, data })
    logger.debug({ category, message, data }, 'Breadcrumb added')
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private storeError(report: ErrorReport): void {
    this.errors.unshift(report)

    // Keep only the last N errors in memory
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors)
    }
  }

  // Development utilities
  getRecentErrors(limit = 10): ErrorReport[] {
    return this.errors.slice(0, limit)
  }

  getErrorById(id: string): ErrorReport | undefined {
    return this.errors.find((e) => e.id === id)
  }

  clearErrors(): void {
    this.errors = []
  }
}

// Export singleton
export const errorTracker = new ErrorTracker()

// Helper for API routes
export function withErrorTracking<T>(
  handler: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T> {
  return handler().catch((error) => {
    errorTracker.captureException(error, context)
    throw error
  })
}

// React Error Boundary helper
export function captureReactError(error: Error, errorInfo: { componentStack: string }): void {
  errorTracker.captureException(error, {
    extra: { componentStack: errorInfo.componentStack },
  })
}

export default errorTracker
