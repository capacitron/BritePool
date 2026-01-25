import 'dotenv/config'
import { Resend } from 'resend'

// Lazy-initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  // Debug logging
  console.log('[Email] RESEND_API_KEY status:', apiKey ? `SET (${apiKey.substring(0, 10)}...)` : 'NOT SET')
  // Check if API key exists and is not a placeholder
  if (!apiKey || apiKey.includes('your_api_key') || apiKey === 'undefined' || apiKey.length < 20) {
    console.log('[Email] Falling back to mock mode')
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

// Email configuration - exported for use in other modules
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@britepool.org'
export const FROM_NAME = process.env.FROM_NAME || 'BRITE POOL'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export interface SendEmailResult {
  success: boolean
  mock?: boolean
  data?: unknown
  error?: unknown
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<SendEmailResult> {
  const resend = getResendClient()

  if (!resend) {
    console.warn('[Email] WARNING: RESEND_API_KEY not configured - email NOT sent')
    console.warn(`[Email] Would have sent to: ${to}, Subject: ${subject}`)
    return { success: false, mock: true, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(email: string, name: string, temporaryPassword?: string) {
  const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to BRITE POOL</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a365d; margin: 0; font-size: 28px;">BRITE POOL</h1>
          <p style="color: #64748b; margin: 5px 0;">Ministerium of Empowerment</p>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1a365d; margin-top: 0;">Welcome, ${name}!</h2>
          <p>Your account has been created on the BRITE POOL platform.</p>

          ${
            temporaryPassword
              ? `
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Your temporary password:</p>
            <code style="background: #f1f5f9; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 16px;">${temporaryPassword}</code>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #64748b;">Please change this password after logging in.</p>
          </div>
          `
              : ''
          }

          <a href="${loginUrl}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 15px;">Sign In to Your Account</a>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">
          If you have any questions, please contact our support team.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to BRITE POOL',
    html,
    text: `Welcome to BRITE POOL, ${name}! Your account has been created. ${temporaryPassword ? `Your temporary password is: ${temporaryPassword}` : ''} Sign in at: ${loginUrl}`,
  })
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a365d; margin: 0; font-size: 28px;">BRITE POOL</h1>
          <p style="color: #64748b; margin: 5px 0;">Ministerium of Empowerment</p>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1a365d; margin-top: 0;">Reset Your Password</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>

          <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0;">Reset Password</a>

          <p style="font-size: 14px; color: #64748b;">This link will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #64748b;">If you didn't request this reset, you can safely ignore this email.</p>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">
          If you have any questions, please contact our support team.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Reset Your BRITE POOL Password',
    html,
    text: `Hi ${name}, Reset your password by visiting: ${resetUrl} This link expires in 1 hour.`,
  })
}

export async function sendContentApprovedEmail(
  email: string,
  name: string,
  contentType: string,
  contentTitle: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Content Approved</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a365d; margin: 0; font-size: 28px;">BRITE POOL</h1>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 30px;">
          <h2 style="color: #166534; margin-top: 0;">Content Approved!</h2>
          <p>Hi ${name},</p>
          <p>Great news! Your ${contentType} "<strong>${contentTitle}</strong>" has been reviewed and approved.</p>
          <p>It is now visible to the community.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Your content has been approved - BRITE POOL',
    html,
    text: `Hi ${name}, Your ${contentType} "${contentTitle}" has been approved and is now visible.`,
  })
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a365d; margin: 0; font-size: 28px;">BRITE POOL</h1>
          <p style="color: #64748b; margin: 5px 0;">Ministerium of Empowerment</p>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #1a365d; margin-top: 0;">Verify Your Email Address</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering with BRITE POOL. Please verify your email address by clicking the button below:</p>

          <a href="${verifyUrl}" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0;">Verify Email</a>

          <p style="font-size: 14px; color: #64748b;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #64748b;">If you didn't create an account, you can safely ignore this email.</p>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">
          If you have any questions, please contact our support team.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Verify Your BRITE POOL Email',
    html,
    text: `Hi ${name}, Please verify your email by visiting: ${verifyUrl} This link expires in 24 hours.`,
  })
}

export async function sendContentRejectedEmail(
  email: string,
  name: string,
  contentType: string,
  contentTitle: string,
  reason: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Content Review Update</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a365d; margin: 0; font-size: 28px;">BRITE POOL</h1>
        </div>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 30px;">
          <h2 style="color: #991b1b; margin-top: 0;">Content Not Approved</h2>
          <p>Hi ${name},</p>
          <p>Your ${contentType} "<strong>${contentTitle}</strong>" was not approved for publishing.</p>

          <div style="background: #fff; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <p style="margin: 0; font-weight: 600;">Reason:</p>
            <p style="margin: 10px 0 0 0;">${reason}</p>
          </div>

          <p>Please review and resubmit with the necessary changes.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Content review update - BRITE POOL',
    html,
    text: `Hi ${name}, Your ${contentType} "${contentTitle}" was not approved. Reason: ${reason}`,
  })
}
