import { prisma } from './prisma'
import { sendEmail } from './email'
import { broadcastNotification } from '@/lib/realtime'
import { NotificationType, Prisma } from '@prisma/client'

// Environment configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const FROM_NAME = process.env.FROM_NAME || 'BRITE POOL'

// Notification metadata interface
export interface NotificationMetadata {
  contentType?: string
  contentTitle?: string
  reason?: string
  eventTitle?: string
  eventDate?: string
  taskTitle?: string
  committeeName?: string
  poolName?: string
  wgoTitle?: string
  [key: string]: string | number | boolean | undefined
}

// Email template configuration
interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Get user email by userId
async function getUserEmail(userId: string): Promise<{ email: string; name: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })
  return user
}

// Generate email template based on notification type
function generateEmailTemplate(
  type: NotificationType,
  title: string,
  message: string,
  link: string | null,
  metadata: NotificationMetadata | null,
  recipientName: string
): EmailTemplate {
  const linkButton = link
    ? `<a href="${BASE_URL}${link}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 15px;">View Details</a>`
    : ''

  const baseHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a365d; margin: 0; font-size: 28px;">${FROM_NAME}</h1>
          <p style="color: #64748b; margin: 5px 0;">Ministerium of Empowerment</p>
        </div>
        {{CONTENT}}
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
          If you have any questions, please contact our support team.
        </p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          You are receiving this email because you have notifications enabled on your BRITE POOL account.
        </p>
      </body>
    </html>
  `

  switch (type) {
    case 'EVENT_REMINDER':
      return {
        subject: `Reminder: ${metadata?.eventTitle || title}`,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1e40af; margin-top: 0;">Event Reminder</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${
              metadata?.eventDate
                ? `<p style="font-weight: 600;">Date: ${metadata.eventDate}</p>`
                : ''
            }
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }

    case 'TASK_ASSIGNED':
      return {
        subject: `Task Assigned: ${metadata?.taskTitle || title}`,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 30px;">
            <h2 style="color: #854d0e; margin-top: 0;">New Task Assigned</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }

    case 'CONTENT_APPROVED':
      return {
        subject: `Content Approved: ${metadata?.contentTitle || 'Your submission'}`,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 30px;">
            <h2 style="color: #166534; margin-top: 0;">Content Approved!</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${
              metadata?.contentType && metadata?.contentTitle
                ? `<p>Your ${metadata.contentType} "<strong>${metadata.contentTitle}</strong>" is now visible to the community.</p>`
                : ''
            }
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }

    case 'CONTENT_REJECTED':
      return {
        subject: `Content Review Update: ${metadata?.contentTitle || 'Your submission'}`,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 30px;">
            <h2 style="color: #991b1b; margin-top: 0;">Content Not Approved</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${
              metadata?.reason
                ? `
              <div style="background: #fff; border-radius: 6px; padding: 15px; margin: 15px 0;">
                <p style="margin: 0; font-weight: 600;">Reason:</p>
                <p style="margin: 10px 0 0 0;">${metadata.reason}</p>
              </div>
            `
                : ''
            }
            <p>Please review and resubmit with the necessary changes.</p>
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${metadata?.reason ? ` Reason: ${metadata.reason}` : ''}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }

    case 'COMMITTEE_INVITE':
      return {
        subject: `Committee Invitation: ${metadata?.committeeName || 'Join a Committee'}`,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 30px;">
            <h2 style="color: #5b21b6; margin-top: 0;">Committee Invitation</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }

    case 'SYSTEM_ANNOUNCEMENT':
      return {
        subject: `[Important] ${title}`,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">System Announcement</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }

    case 'POOL_UPDATE':
      return {
        subject: `Pool Update: ${metadata?.poolName || title}`,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 30px;">
            <h2 style="color: #047857; margin-top: 0;">Investment Pool Update</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }

    case 'WGO_UPDATE':
      return {
        subject: `WGO Update: ${metadata?.wgoTitle || title}`,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 30px;">
            <h2 style="color: #c2410c; margin-top: 0;">Wealth Growth Opportunity Update</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }

    default:
      return {
        subject: title,
        html: baseHtml.replace(
          '{{CONTENT}}',
          `
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1a365d; margin-top: 0;">${title}</h2>
            <p>Hi ${recipientName},</p>
            <p>${message}</p>
            ${linkButton}
          </div>
        `
        ),
        text: `Hi ${recipientName}, ${message}${link ? ` View at: ${BASE_URL}${link}` : ''}`,
      }
  }
}

/**
 * Send notification email to a specific email address
 * This is a low-level function that sends the email directly
 */
export async function sendNotificationEmail(
  email: string,
  recipientName: string,
  type: NotificationType,
  title: string,
  message: string,
  link: string | null = null,
  metadata: NotificationMetadata | null = null
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const template = generateEmailTemplate(type, title, message, link, metadata, recipientName)

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return result
  } catch (error) {
    console.error('Failed to send notification email:', error)
    return { success: false, error }
  }
}

/**
 * Create a notification in the database AND send an email notification
 * This is the main function to use for creating notifications
 *
 * @param userId - The user ID to notify
 * @param type - The notification type (from NotificationType enum)
 * @param title - The notification title
 * @param message - The notification message
 * @param link - Optional link to include in the notification
 * @param metadata - Optional additional metadata
 * @param sendEmailNotification - Whether to send an email (default: true)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string | null,
  metadata?: NotificationMetadata | null,
  sendEmailNotification: boolean = true
): Promise<{
  notification: {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    link: string | null
    isRead: boolean
    metadata: unknown
    createdAt: Date
  }
  emailSent: boolean
  emailError?: unknown
}> {
  // Create the notification in the database
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  })

  // Broadcast to user's real-time connection
  try {
    broadcastNotification(userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
    })
  } catch (error) {
    // Log but don't fail the notification creation
    console.error('Failed to broadcast notification:', error)
  }

  let emailSent = false
  let emailError: unknown = undefined

  // Send email notification if enabled
  if (sendEmailNotification) {
    const user = await getUserEmail(userId)

    if (user) {
      // Fire and forget - don't block the main request
      sendNotificationEmail(
        user.email,
        user.name,
        type,
        title,
        message,
        link || null,
        metadata || null
      )
        .then((result) => {
          if (!result.success) {
            console.error('Email notification failed:', result.error)
          }
        })
        .catch((err) => {
          console.error('Email notification error:', err)
        })

      emailSent = true // Mark as sent (async)
    } else {
      console.warn(`User not found for notification: ${userId}`)
      emailError = 'User not found'
    }
  }

  return {
    notification,
    emailSent,
    emailError,
  }
}

/**
 * Create notifications for multiple users (batch operation)
 * Useful for announcements or group notifications
 */
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string | null,
  metadata?: NotificationMetadata | null,
  sendEmailNotifications: boolean = true
): Promise<{
  notificationsCreated: number
  emailsSent: number
  errors: Array<{ userId: string; error: unknown }>
}> {
  const errors: Array<{ userId: string; error: unknown }> = []
  let emailsSent = 0

  // Create all notifications in a batch
  const notifications = await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    })),
  })

  // Send emails if enabled
  if (sendEmailNotifications) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    })

    // Send emails asynchronously
    for (const user of users) {
      sendNotificationEmail(
        user.email,
        user.name,
        type,
        title,
        message,
        link || null,
        metadata || null
      )
        .then((result) => {
          if (!result.success) {
            errors.push({ userId: user.id, error: result.error })
          }
        })
        .catch((err) => {
          errors.push({ userId: user.id, error: err })
        })

      emailsSent++
    }
  }

  return {
    notificationsCreated: notifications.count,
    emailsSent,
    errors,
  }
}

// Convenience functions for common notification types

/**
 * Send an event reminder notification
 */
export async function notifyEventReminder(
  userId: string,
  eventTitle: string,
  eventDate: string,
  eventId: string
) {
  return createNotification(
    userId,
    'EVENT_REMINDER',
    `Upcoming Event: ${eventTitle}`,
    `Don't forget! "${eventTitle}" is coming up on ${eventDate}.`,
    `/dashboard/events/${eventId}`,
    { eventTitle, eventDate }
  )
}

/**
 * Send a task assigned notification
 */
export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  taskId: string,
  assignerName?: string
) {
  const message = assignerName
    ? `${assignerName} has assigned you a new task: "${taskTitle}".`
    : `You have been assigned a new task: "${taskTitle}".`

  return createNotification(
    userId,
    'TASK_ASSIGNED',
    `New Task: ${taskTitle}`,
    message,
    `/dashboard/tasks/${taskId}`,
    {
      taskTitle,
    }
  )
}

/**
 * Send a content approved notification
 */
export async function notifyContentApproved(
  userId: string,
  contentType: string,
  contentTitle: string,
  contentLink?: string
) {
  return createNotification(
    userId,
    'CONTENT_APPROVED',
    'Content Approved',
    `Great news! Your ${contentType} "${contentTitle}" has been approved and is now visible.`,
    contentLink || null,
    { contentType, contentTitle }
  )
}

/**
 * Send a content rejected notification
 */
export async function notifyContentRejected(
  userId: string,
  contentType: string,
  contentTitle: string,
  reason: string,
  contentLink?: string
) {
  return createNotification(
    userId,
    'CONTENT_REJECTED',
    'Content Not Approved',
    `Your ${contentType} "${contentTitle}" was not approved for publishing.`,
    contentLink || null,
    { contentType, contentTitle, reason }
  )
}

/**
 * Send a committee invite notification
 */
export async function notifyCommitteeInvite(
  userId: string,
  committeeName: string,
  committeeId: string,
  inviterName?: string
) {
  const message = inviterName
    ? `${inviterName} has invited you to join the ${committeeName} committee.`
    : `You have been invited to join the ${committeeName} committee.`

  return createNotification(
    userId,
    'COMMITTEE_INVITE',
    `Committee Invitation: ${committeeName}`,
    message,
    `/dashboard/committees/${committeeId}`,
    { committeeName }
  )
}

/**
 * Send a system announcement notification
 */
export async function notifySystemAnnouncement(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  return createNotification(userId, 'SYSTEM_ANNOUNCEMENT', title, message, link || null)
}

/**
 * Send a pool update notification
 */
export async function notifyPoolUpdate(
  userId: string,
  poolName: string,
  updateMessage: string,
  poolId: string
) {
  return createNotification(
    userId,
    'POOL_UPDATE',
    `Pool Update: ${poolName}`,
    updateMessage,
    `/dashboard/pools/${poolId}`,
    { poolName }
  )
}

/**
 * Send a WGO update notification
 */
export async function notifyWGOUpdate(
  userId: string,
  wgoTitle: string,
  updateMessage: string,
  wgoId: string
) {
  return createNotification(
    userId,
    'WGO_UPDATE',
    `WGO Update: ${wgoTitle}`,
    updateMessage,
    `/dashboard/wgo/${wgoId}`,
    { wgoTitle }
  )
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  } = {}
) {
  const { limit = 20, offset = 0, unreadOnly = false } = options

  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

/**
 * Delete old notifications (cleanup utility)
 */
export async function deleteOldNotifications(daysOld: number = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  return prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true,
    },
  })
}
