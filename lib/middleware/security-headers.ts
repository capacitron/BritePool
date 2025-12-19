import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Enable XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://*.cloudinary.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; '),
}

// Production-only headers
export const productionOnlyHeaders = {
  // HSTS - only enable in production with HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

export function applySecurityHeaders(
  response: NextResponse,
  isProduction = process.env.NODE_ENV === 'production'
): NextResponse {
  // Apply base security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply production-only headers
  if (isProduction) {
    Object.entries(productionOnlyHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}

// Middleware function for security headers
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

// Request ID generator for tracing
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Add request ID to response headers
export function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('X-Request-Id', requestId)
  return response
}
