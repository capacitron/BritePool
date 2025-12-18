# Specification: Announcement System with Email Notifications

**Feature ID:** F005
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** User Authentication (F002), Communications System (F004)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Flows](#user-flows)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Email System Architecture](#email-system-architecture)
6. [UI Components](#ui-components)
7. [Implementation Details](#implementation-details)
8. [Testing Requirements](#testing-requirements)
9. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Purpose
Implement a comprehensive announcement system with priority levels (URGENT, IMPORTANT, INFO), role-targeted delivery, pinned dashboard announcements, and integrated email notification system. Members receive weekly digest emails consolidating messages, announcements, and event reminders to keep the community informed and engaged without overwhelming their inboxes.

### Key Requirements
- Three priority levels: URGENT, IMPORTANT, INFO with distinct visual styling
- Role-targeted announcement delivery (target specific user roles or all members)
- Pinned dashboard announcements for high-visibility messages
- Expiration dates for time-sensitive announcements
- Instant email notifications for URGENT announcements
- Weekly digest emails consolidating announcements, forum posts, and upcoming events
- SendGrid or Resend integration for transactional and digest emails
- Rich text editor for announcement content with markdown support
- Read/unread tracking for individual announcements
- Search and filter capabilities (by priority, date, role)
- Admin-only announcement creation with preview before publishing

### Success Metrics
- 100% of urgent announcements trigger instant email notifications
- Weekly digest emails sent to all active members every Sunday at 6 PM
- Zero missed digest sends (99.9% reliability with monitoring)
- Members can easily view pinned and recent announcements on dashboard
- Role-targeted announcements reach only intended recipients
- Clear visual distinction between priority levels
- Complete audit trail of all announcements created and sent

---

## User Flows

### Flow 1: Admin Creates and Publishes Announcement

```
1. Admin logs in with WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR role
2. Admin navigates to /dashboard/admin/announcements
3. Admin clicks "Create Announcement" button
4. Announcement creation form opens with fields:
   - Title (required, max 200 chars)
   - Content (required, rich text editor with markdown support)
   - Priority Level (dropdown: URGENT, IMPORTANT, INFO)
   - Target Roles (multi-select: All Members, or specific roles)
   - Pin to Dashboard (checkbox, default: unchecked)
   - Expiration Date (optional, datetime picker)
   - Preview button (shows how announcement will appear)
5. Admin fills form and clicks "Preview"
6. Preview modal displays announcement as members will see it
7. Admin clicks "Publish Announcement" → POST /api/announcements
8. System validates:
   - User has required role (admin)
   - Title and content are not empty
   - At least one target role selected
   - Expiration date (if set) is in the future
9. Announcement record created in database with publishedAt timestamp
10. If priority is URGENT:
    - System immediately triggers email notification to all targeted members
    - Email sent via SendGrid/Resend with URGENT styling
11. If priority is IMPORTANT or INFO:
    - Announcement queued for next weekly digest (no immediate email)
12. System redirects to /dashboard/admin/announcements
13. Success message confirms announcement published
14. Announcement appears on targeted members' dashboards
```

### Flow 2: Member Views Announcements on Dashboard

```
1. Member logs in (any authenticated user)
2. Member navigates to /dashboard or /dashboard/announcements
3. Dashboard displays announcements section showing:
   - Pinned announcements (highlighted at top, isPinned: true)
   - Recent announcements (last 30 days, non-expired)
   - Filtered by member's role (targetRoles includes member's role)
4. Each announcement card displays:
   - Priority badge (URGENT: red, IMPORTANT: yellow, INFO: blue)
   - Title (bold, clickable)
   - Excerpt (first 150 chars of content)
   - Published date (relative time, e.g., "2 days ago")
   - Read/Unread indicator (visual dot or badge)
5. Member clicks announcement title
6. Announcement detail modal opens showing:
   - Full content (rendered markdown)
   - Priority level
   - Published date
   - Expiration date (if set)
   - "Mark as Read" button (if unread)
7. System marks announcement as read for this user
   - Creates AnnouncementRead record with userId and announcementId
8. Member closes modal and returns to dashboard
9. Unread indicator removed from announcement card
```

### Flow 3: Member Receives Weekly Digest Email

```
1. Cron job runs every Sunday at 6:00 PM (system timezone)
2. System queries all active users (subscriptionStatus: ACTIVE)
3. For each user, system gathers:
   - New announcements published in last 7 days (filtered by user role)
   - New forum posts in categories user has access to (last 7 days)
   - Upcoming events in next 14 days (user is registered or invited)
4. If user has new content in any category:
   - System generates personalized digest email HTML
   - Email includes:
     - Header: "Your Weekly BRITE POOL Digest"
     - Announcements section (grouped by priority)
     - Forum Activity section (latest posts with excerpts)
     - Upcoming Events section (next 3 events with RSVP links)
     - Footer: "Manage email preferences" link
   - Email sent via SendGrid/Resend API
5. System logs digest send in EmailLog table:
   - userId
   - emailType: WEEKLY_DIGEST
   - sentAt timestamp
   - status: SENT or FAILED
6. If send fails:
   - System retries up to 3 times with exponential backoff
   - After 3 failures, logs error and sends alert to admin
7. Member receives digest email in inbox
8. Member can click links to view full content on platform
```

### Flow 4: Admin Sends Urgent Announcement with Immediate Email

```
1. Admin creates announcement with priority: URGENT
2. Admin publishes announcement
3. System immediately triggers urgent email notification workflow:
   - Query users matching targetRoles
   - Generate urgent email template with red header/banner
   - Email subject: "🚨 URGENT: [Announcement Title]"
   - Email body includes:
     - Full announcement content
     - "View on Dashboard" CTA button
     - Contact info for urgent questions
4. System sends individual emails to all targeted users
5. Each email send logged in EmailLog table
6. Admin sees confirmation: "Urgent announcement sent to [X] members"
7. Members receive email within 1-2 minutes
8. Announcement also appears on dashboard with URGENT badge
```

### Flow 5: Admin Manages Announcements

```
1. Admin navigates to /dashboard/admin/announcements
2. Admin sees announcement management dashboard:
   - Search bar (search by title or content)
   - Filter dropdowns (Priority, Target Roles, Date Range)
   - Sort options (Newest, Oldest, Priority)
   - Action buttons (Create, Edit, Delete)
3. List displays all announcements with columns:
   - Priority badge
   - Title
   - Target Roles (tags)
   - Published Date
   - Expiration Date
   - Pinned status (pin icon)
   - View count (how many users viewed)
   - Actions (Edit, Delete, Pin/Unpin)
4. Admin can click "Edit" on announcement
5. Edit form pre-populated with existing data
6. Admin updates fields (e.g., extends expiration date)
7. Admin clicks "Save Changes" → PATCH /api/announcements/[id]
8. System validates changes
9. Announcement updated in database
10. If admin changes priority from INFO to URGENT:
    - System triggers immediate email notification to targeted users
11. Admin can delete expired announcements
    - Delete button shows confirmation modal
    - Soft delete (archived, not permanently removed)
```

### Flow 6: Member Manages Email Preferences

```
1. Member logs in and navigates to /dashboard/settings/notifications
2. Member sees email notification preferences:
   - Weekly Digest (toggle: ON/OFF, default: ON)
   - Urgent Announcements (toggle: ON/OFF, default: ON, recommended)
   - Forum Activity (toggle: ON/OFF, default: ON)
   - Event Reminders (toggle: ON/OFF, default: ON)
   - Digest Frequency (dropdown: Weekly, Bi-Weekly, Monthly)
3. Member toggles "Weekly Digest" to OFF
4. System saves preference → PATCH /api/users/[id]/preferences
5. UserProfile updated with emailPreferences JSON field:
   {
     "weeklyDigest": false,
     "urgentAnnouncements": true,
     "forumActivity": true,
     "eventReminders": true,
     "digestFrequency": "weekly"
   }
6. Member excluded from next weekly digest send
7. Member still receives urgent announcements (cannot opt out entirely)
8. Confirmation message: "Email preferences saved"
```

---

## Database Schema

### Existing Model: Announcement

This model already exists in the Prisma schema and will be utilized:

```prisma
model Announcement {
  id          String   @id @default(cuid())
  title       String
  content     String   // Markdown content
  priority    AnnouncementPriority @default(INFO)

  targetRoles UserRole[]  // Array of roles this announcement targets

  isPinned    Boolean  @default(false)
  publishedAt DateTime @default(now())
  expiresAt   DateTime?

  createdById String
  createdBy   User     @relation("AnnouncementsCreated", fields: [createdById], references: [id])

  reads       AnnouncementRead[]  // NEW RELATION
  emailLogs   EmailLog[]          // NEW RELATION

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([publishedAt])
  @@index([isPinned])
  @@index([priority])
  @@index([expiresAt])
}

enum AnnouncementPriority {
  URGENT      // Red badge, immediate email notification
  IMPORTANT   // Yellow badge, included in digest
  INFO        // Blue badge, included in digest
}
```

### New Model: AnnouncementRead

Tracks which users have viewed each announcement:

```prisma
model AnnouncementRead {
  id             String   @id @default(cuid())
  userId         String
  announcementId String

  user           User         @relation("AnnouncementReads", fields: [userId], references: [id], onDelete: Cascade)
  announcement   Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)

  readAt         DateTime @default(now())

  @@unique([userId, announcementId])
  @@index([userId])
  @@index([announcementId])
}
```

### New Model: EmailLog

Comprehensive email tracking and audit log:

```prisma
model EmailLog {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation("EmailLogs", fields: [userId], references: [id], onDelete: Cascade)

  emailType      EmailType
  status         EmailStatus @default(PENDING)

  // Optional relations
  announcementId String?
  announcement   Announcement? @relation(fields: [announcementId], references: [id], onDelete: SetNull)

  eventId        String?
  event          Event?    @relation(fields: [eventId], references: [id], onDelete: SetNull)

  // Email details
  subject        String
  recipient      String   // Email address
  sentAt         DateTime?
  deliveredAt    DateTime?
  openedAt       DateTime?
  clickedAt      DateTime?

  // Error tracking
  errorMessage   String?
  retryCount     Int      @default(0)

  // External provider tracking
  providerMessageId String? // SendGrid/Resend message ID
  providerStatus    String? // Provider-specific status

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId])
  @@index([emailType])
  @@index([status])
  @@index([sentAt])
  @@index([announcementId])
}

enum EmailType {
  URGENT_ANNOUNCEMENT
  WEEKLY_DIGEST
  FORUM_NOTIFICATION
  EVENT_REMINDER
  SYSTEM_NOTIFICATION
}

enum EmailStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  FAILED
  BOUNCED
}
```

### Updates to User Model

Add relations for announcements and email tracking:

```prisma
model User {
  // ... existing fields

  // New relations
  announcementsCreated AnnouncementRead[] @relation("AnnouncementReads")
  announcementsCreated Announcement[]     @relation("AnnouncementsCreated")
  emailLogs            EmailLog[]         @relation("EmailLogs")
}
```

### Updates to UserProfile Model

Add email preferences field:

```prisma
model UserProfile {
  // ... existing fields

  emailPreferences Json?  // Store email notification preferences
  // Example: { weeklyDigest: true, urgentAnnouncements: true, digestFrequency: "weekly" }
}
```

### Updates to Event Model

Add relation for email notifications:

```prisma
model Event {
  // ... existing fields

  emailLogs EmailLog[]  // Track event reminder emails
}
```

### Database Migration

Run Prisma migrations to add new models and relations:

```bash
npx prisma db push
```

---

## API Endpoints

### 1. GET /api/announcements

**Purpose:** List announcements for authenticated user (filtered by role and expiration)

**Authentication:** Required (any authenticated user)

**Query Parameters:**
- `priority` (optional): Filter by priority (URGENT, IMPORTANT, INFO)
- `pinned` (optional, boolean): Show only pinned announcements
- `unreadOnly` (optional, boolean): Show only unread announcements
- `limit` (optional, number): Max results (default: 50)
- `offset` (optional, number): Pagination offset

**Response:**
```json
{
  "announcements": [
    {
      "id": "clx123...",
      "title": "Sanctuary Winter Schedule Update",
      "content": "Starting December 20th, all committee meetings will shift to virtual format...",
      "priority": "IMPORTANT",
      "targetRoles": ["STEWARD", "COMMITTEE_LEADER"],
      "isPinned": true,
      "publishedAt": "2025-12-15T10:00:00Z",
      "expiresAt": "2025-12-31T23:59:59Z",
      "isRead": false,
      "createdBy": {
        "id": "user_456",
        "name": "Admin User"
      }
    }
  ],
  "total": 12,
  "unreadCount": 3
}
```

**Error Cases:**
- User not authenticated → 401

---

### 2. POST /api/announcements (Admin Only)

**Purpose:** Create new announcement

**Authentication:** Required, role: WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR

**Request Body:**
```json
{
  "title": "Important Security Update",
  "content": "We've implemented new security measures for all member accounts...",
  "priority": "URGENT",
  "targetRoles": ["STEWARD", "PARTNER", "RESIDENT"],
  "isPinned": true,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "announcement": {
    "id": "clx789...",
    "title": "Important Security Update",
    "priority": "URGENT",
    "publishedAt": "2025-12-17T14:30:00Z",
    "emailsSent": 145
  }
}
```

**Error Cases:**
- User not authorized → 403
- Missing required fields → 400
- Invalid priority level → 400
- Invalid target roles → 400
- Expiration date in past → 400

---

### 3. PATCH /api/announcements/[id] (Admin Only)

**Purpose:** Update existing announcement

**Authentication:** Required, role: WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "isPinned": false,
  "expiresAt": "2026-01-15T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "announcement": {
    "id": "clx789...",
    "title": "Updated Title",
    "updatedAt": "2025-12-17T15:00:00Z"
  }
}
```

**Error Cases:**
- User not authorized → 403
- Announcement not found → 404
- Invalid update data → 400

---

### 4. DELETE /api/announcements/[id] (Admin Only)

**Purpose:** Delete (archive) announcement

**Authentication:** Required, role: WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR

**Response:**
```json
{
  "success": true,
  "message": "Announcement deleted successfully"
}
```

**Error Cases:**
- User not authorized → 403
- Announcement not found → 404

---

### 5. POST /api/announcements/[id]/read

**Purpose:** Mark announcement as read by current user

**Authentication:** Required (any authenticated user)

**Request Body:** (empty or minimal)

**Response:**
```json
{
  "success": true,
  "readAt": "2025-12-17T16:00:00Z"
}
```

**Error Cases:**
- User not authenticated → 401
- Announcement not found → 404
- User not authorized to view this announcement → 403

---

### 6. POST /api/admin/announcements/[id]/pin (Admin Only)

**Purpose:** Toggle pinned status of announcement

**Authentication:** Required, role: WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR

**Response:**
```json
{
  "success": true,
  "isPinned": true
}
```

---

### 7. GET /api/admin/announcements/stats (Admin Only)

**Purpose:** Get announcement statistics for admin dashboard

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Response:**
```json
{
  "totalAnnouncements": 45,
  "activeAnnouncements": 12,
  "pinnedAnnouncements": 3,
  "byPriority": {
    "URGENT": 2,
    "IMPORTANT": 8,
    "INFO": 35
  },
  "averageReadRate": 0.78,
  "recentAnnouncements": []
}
```

---

## Email System Architecture

### Email Provider Integration

**Recommended Provider:** Resend (modern, developer-friendly) or SendGrid (enterprise-grade)

#### Resend Setup

```typescript
// lib/email/resend-client.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM || 'noreply@britepool.org',
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
```

#### SendGrid Setup

```typescript
// lib/email/sendgrid-client.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM || 'noreply@britepool.org',
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const [response] = await sgMail.send({
      to,
      from,
      subject,
      html,
    });
    return { success: true, messageId: response.headers['x-message-id'] };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
```

---

### Email Templates (React Email)

Use React Email for type-safe, component-based email templates.

#### Urgent Announcement Template

```tsx
// emails/urgent-announcement.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface UrgentAnnouncementEmailProps {
  userName: string;
  announcementTitle: string;
  announcementContent: string;
  announcementUrl: string;
}

export default function UrgentAnnouncementEmail({
  userName,
  announcementTitle,
  announcementContent,
  announcementUrl,
}: UrgentAnnouncementEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={urgentBanner}>
            <Text style={urgentText}>🚨 URGENT ANNOUNCEMENT</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Hello {userName},</Heading>
            <Text style={paragraph}>
              An urgent announcement has been posted to BRITE POOL:
            </Text>

            <Section style={announcementBox}>
              <Heading as="h2" style={announcementTitle}>
                {announcementTitle}
              </Heading>
              <Text style={announcementText}>
                {announcementContent}
              </Text>
            </Section>

            <Button href={announcementUrl} style={button}>
              View Full Announcement
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              This is an urgent notification from BRITE POOL.
              <br />
              For questions, contact support@britepool.org
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginTop: '32px',
  marginBottom: '32px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

const urgentBanner = {
  backgroundColor: '#dc2626',
  padding: '16px',
  textAlign: 'center' as const,
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
};

const urgentText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '32px 40px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
};

const announcementBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const announcementTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#991b1b',
  marginBottom: '12px',
};

const announcementText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#1f2937',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 0',
  marginTop: '24px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  textAlign: 'center' as const,
};
```

#### Weekly Digest Template

```tsx
// emails/weekly-digest.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface DigestItem {
  title: string;
  excerpt: string;
  url: string;
  date: string;
}

interface WeeklyDigestEmailProps {
  userName: string;
  announcements: DigestItem[];
  forumPosts: DigestItem[];
  upcomingEvents: DigestItem[];
  preferencesUrl: string;
}

export default function WeeklyDigestEmail({
  userName,
  announcements,
  forumPosts,
  upcomingEvents,
  preferencesUrl,
}: WeeklyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Your Weekly BRITE POOL Digest</Heading>
            <Text style={headerSubtitle}>
              Here's what happened this week in the community
            </Text>
          </Section>

          <Section style={content}>
            <Heading style={greeting}>Hello {userName},</Heading>

            {announcements.length > 0 && (
              <>
                <Heading as="h2" style={sectionHeading}>
                  📢 New Announcements
                </Heading>
                {announcements.map((item, index) => (
                  <Section key={index} style={itemBox}>
                    <Heading as="h3" style={itemTitle}>{item.title}</Heading>
                    <Text style={itemExcerpt}>{item.excerpt}</Text>
                    <Button href={item.url} style={itemButton}>
                      Read More
                    </Button>
                  </Section>
                ))}
              </>
            )}

            {forumPosts.length > 0 && (
              <>
                <Heading as="h2" style={sectionHeading}>
                  💬 Forum Activity
                </Heading>
                {forumPosts.map((item, index) => (
                  <Section key={index} style={itemBox}>
                    <Heading as="h3" style={itemTitle}>{item.title}</Heading>
                    <Text style={itemExcerpt}>{item.excerpt}</Text>
                    <Button href={item.url} style={itemButton}>
                      Join Discussion
                    </Button>
                  </Section>
                ))}
              </>
            )}

            {upcomingEvents.length > 0 && (
              <>
                <Heading as="h2" style={sectionHeading}>
                  📅 Upcoming Events
                </Heading>
                {upcomingEvents.map((item, index) => (
                  <Section key={index} style={itemBox}>
                    <Heading as="h3" style={itemTitle}>{item.title}</Heading>
                    <Text style={itemDate}>{item.date}</Text>
                    <Text style={itemExcerpt}>{item.excerpt}</Text>
                    <Button href={item.url} style={itemButton}>
                      View Event
                    </Button>
                  </Section>
                ))}
              </>
            )}

            <Hr style={hr} />

            <Text style={footer}>
              You're receiving this weekly digest as a BRITE POOL member.
              <br />
              <a href={preferencesUrl} style={link}>
                Manage email preferences
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginTop: '32px',
  marginBottom: '32px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#059669',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const headerSubtitle = {
  color: '#d1fae5',
  fontSize: '16px',
  margin: '8px 0 0 0',
};

const content = {
  padding: '32px 40px',
};

const greeting = {
  fontSize: '22px',
  marginBottom: '24px',
};

const sectionHeading = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#059669',
  marginTop: '32px',
  marginBottom: '16px',
  borderBottom: '2px solid #d1fae5',
  paddingBottom: '8px',
};

const itemBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
};

const itemTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '8px',
};

const itemExcerpt = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  marginBottom: '12px',
};

const itemDate = {
  fontSize: '14px',
  color: '#059669',
  fontWeight: '600',
  marginBottom: '8px',
};

const itemButton = {
  backgroundColor: '#059669',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  textAlign: 'center' as const,
  lineHeight: '20px',
};

const link = {
  color: '#059669',
  textDecoration: 'underline',
};
```

---

### Digest Scheduling System

**Technology:** Node-cron or Vercel Cron Jobs

#### Cron Job Setup (Vercel)

Create API endpoint for cron job:

```typescript
// app/api/cron/weekly-digest/route.ts
import { NextResponse } from 'next/server';
import { sendWeeklyDigests } from '@/lib/email/digest-service';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendWeeklyDigests();
    return NextResponse.json({
      success: true,
      digestsSent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Weekly digest cron error:', error);
    return NextResponse.json(
      { error: 'Digest send failed' },
      { status: 500 }
    );
  }
}
```

Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 18 * * 0"
    }
  ]
}
```

#### Digest Service

```typescript
// lib/email/digest-service.ts
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/resend-client';
import { render } from '@react-email/render';
import WeeklyDigestEmail from '@/emails/weekly-digest';

export async function sendWeeklyDigests() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

  // Get all active users who have digest enabled
  const users = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      profile: {
        emailPreferences: {
          path: ['weeklyDigest'],
          equals: true,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      // Get user's new announcements
      const announcements = await prisma.announcement.findMany({
        where: {
          publishedAt: { gte: oneWeekAgo },
          targetRoles: { has: user.role },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      });

      // Get forum posts in user-accessible categories
      const forumPosts = await prisma.forumPost.findMany({
        where: {
          createdAt: { gte: oneWeekAgo },
          // Add category access logic here based on user role
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: { select: { name: true } },
        },
      });

      // Get upcoming events
      const upcomingEvents = await prisma.event.findMany({
        where: {
          startTime: {
            gte: new Date(),
            lte: twoWeeksFromNow,
          },
        },
        orderBy: { startTime: 'asc' },
        take: 3,
      });

      // Skip if no new content
      if (
        announcements.length === 0 &&
        forumPosts.length === 0 &&
        upcomingEvents.length === 0
      ) {
        continue;
      }

      // Prepare digest data
      const digestData = {
        userName: user.name,
        announcements: announcements.map((a) => ({
          title: a.title,
          excerpt: a.content.substring(0, 150) + '...',
          url: `${process.env.NEXTAUTH_URL}/dashboard/announcements/${a.id}`,
          date: a.publishedAt.toLocaleDateString(),
        })),
        forumPosts: forumPosts.map((p) => ({
          title: p.title || 'Untitled Post',
          excerpt: p.content.substring(0, 150) + '...',
          url: `${process.env.NEXTAUTH_URL}/dashboard/forums/posts/${p.id}`,
          date: p.createdAt.toLocaleDateString(),
        })),
        upcomingEvents: upcomingEvents.map((e) => ({
          title: e.title,
          excerpt: e.description?.substring(0, 150) + '...' || '',
          url: `${process.env.NEXTAUTH_URL}/dashboard/events/${e.id}`,
          date: e.startTime.toLocaleDateString(),
        })),
        preferencesUrl: `${process.env.NEXTAUTH_URL}/dashboard/settings/notifications`,
      };

      // Render email HTML
      const emailHtml = render(WeeklyDigestEmail(digestData));

      // Send email
      const result = await sendEmail({
        to: user.email,
        subject: 'Your Weekly BRITE POOL Digest',
        html: emailHtml,
      });

      if (result.success) {
        // Log successful send
        await prisma.emailLog.create({
          data: {
            userId: user.id,
            emailType: 'WEEKLY_DIGEST',
            status: 'SENT',
            subject: 'Your Weekly BRITE POOL Digest',
            recipient: user.email,
            sentAt: new Date(),
            providerMessageId: result.messageId,
          },
        });
        sent++;
      } else {
        throw new Error('Email send failed');
      }
    } catch (error) {
      console.error(`Failed to send digest to ${user.email}:`, error);

      // Log failed send
      await prisma.emailLog.create({
        data: {
          userId: user.id,
          emailType: 'WEEKLY_DIGEST',
          status: 'FAILED',
          subject: 'Your Weekly BRITE POOL Digest',
          recipient: user.email,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      failed++;
    }
  }

  return { sent, failed };
}
```

---

## UI Components

### 1. Announcements Dashboard Widget

**Location:** `app/components/dashboard/AnnouncementsWidget.tsx`

**Features:**
- Displays pinned announcements at top (highlighted background)
- Shows 5 most recent non-expired announcements
- Priority badges with color coding
- Unread indicators
- "View All" link to full announcements page
- Responsive grid layout

---

### 2. Announcement List Page

**Location:** `app/dashboard/announcements/page.tsx`

**Features:**
- Full list of announcements (paginated, 20 per page)
- Search bar (search by title/content)
- Filter dropdowns (Priority, Date Range)
- Sort options (Newest, Oldest, Priority)
- Announcement cards with priority badges
- Click to open detail modal
- Mark all as read button

---

### 3. Announcement Detail Modal

**Location:** `app/components/announcements/AnnouncementDetailModal.tsx`

**Features:**
- Full-width modal overlay
- Markdown-rendered content
- Priority badge
- Published date
- Expiration date (if applicable)
- "Mark as Read" button (if unread)
- Close button (X icon)
- Smooth open/close animations

---

### 4. Admin Announcement Form

**Location:** `app/dashboard/admin/announcements/create/page.tsx`

**Features:**
- Title input (max 200 chars with counter)
- Rich text editor (TipTap or similar) with markdown toolbar
- Priority level dropdown with descriptions
- Target roles multi-select checkboxes
- Pin to dashboard toggle
- Expiration date picker (optional)
- Preview button → opens preview modal
- Publish button (primary CTA)
- Save as draft button (future enhancement)

---

### 5. Admin Announcements Management

**Location:** `app/dashboard/admin/announcements/page.tsx`

**Features:**
- Announcement statistics cards (total, active, read rate)
- Data table with sortable columns
- Inline edit/delete actions
- Bulk actions (delete selected, change priority)
- Filter and search functionality
- Export announcements to CSV

---

## Implementation Details

### Phase 1: Database & API Foundation (Days 1-2)

1. Update Prisma schema with AnnouncementRead and EmailLog models
2. Add relations to User, UserProfile, and Event models
3. Run database migrations
4. Implement core API endpoints:
   - GET /api/announcements (with filtering)
   - POST /api/announcements (admin only)
   - PATCH /api/announcements/[id] (admin only)
   - DELETE /api/announcements/[id] (admin only)
   - POST /api/announcements/[id]/read
5. Add permission middleware for role-based access
6. Write API endpoint tests

### Phase 2: Email Integration (Days 3-4)

1. Set up Resend or SendGrid client
2. Configure environment variables for API keys
3. Create React Email templates:
   - Urgent announcement template
   - Weekly digest template
4. Implement email service layer:
   - sendUrgentAnnouncementEmail()
   - sendWeeklyDigest()
   - Email retry logic with exponential backoff
5. Create EmailLog tracking for all sends
6. Test email sending in development (use Resend test mode)

### Phase 3: Digest Scheduling System (Day 5)

1. Create cron endpoint: /api/cron/weekly-digest
2. Implement digest gathering logic (announcements, forums, events)
3. Add user email preference checks
4. Configure Vercel cron job or node-cron
5. Set up cron authentication with secret token
6. Test digest generation and sending locally
7. Deploy and verify cron job runs on schedule

### Phase 4: Frontend UI Components (Days 6-7)

1. Create AnnouncementsWidget for dashboard
2. Build announcement list page with search/filter
3. Implement announcement detail modal
4. Add admin announcement creation form
5. Build admin announcements management page
6. Create priority badge component (reusable)
7. Add unread indicator styling
8. Implement mark as read functionality
9. Style with biophilic design system
10. Add responsive mobile layouts
11. Test all user flows end-to-end

---

## Testing Requirements

### Unit Tests

- API endpoint tests for CRUD operations on announcements
- Email service tests (mock SendGrid/Resend)
- Digest gathering logic tests
- Component render tests for announcement cards, modals, forms

### Integration Tests

- Admin creates announcement → members see it on dashboard
- Urgent announcement triggers immediate email
- Weekly digest generates correct content for user role
- Mark as read updates unread count
- Role targeting filters announcements correctly

### Manual Testing Checklist

- [ ] Admin can create announcement with all fields
- [ ] Preview shows announcement correctly before publish
- [ ] URGENT announcements send immediate emails
- [ ] Emails arrive in inbox with correct formatting
- [ ] Members see only announcements targeted to their role
- [ ] Pinned announcements appear at top of dashboard
- [ ] Expired announcements do not appear
- [ ] Mark as read removes unread indicator
- [ ] Weekly digest runs on schedule (Sunday 6 PM)
- [ ] Weekly digest contains correct content (announcements, forums, events)
- [ ] Users can manage email preferences
- [ ] Opting out of digest stops emails (except urgent)
- [ ] Email logs track all sends with status
- [ ] Admin can view announcement statistics
- [ ] Search and filter work correctly
- [ ] Mobile responsive design works on all screen sizes

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated with new models
- [ ] Database migrations tested in staging
- [ ] Environment variables configured (EMAIL_FROM, RESEND_API_KEY, CRON_SECRET)
- [ ] React Email templates tested and rendering correctly
- [ ] Cron job endpoint secured with secret token
- [ ] All API endpoints implemented and tested
- [ ] Email retry logic tested (simulate failures)
- [ ] All frontend components built and styled
- [ ] Mobile responsive design verified
- [ ] All tests passing (unit + integration)

### Deployment Steps

1. Run database migrations in production
2. Deploy application to Vercel or hosting platform
3. Configure cron job schedule (Vercel cron or external service)
4. Verify environment variables in production
5. Test announcement creation in production
6. Send test urgent announcement to admin users
7. Verify email delivery and formatting
8. Monitor cron job execution (first Sunday after deploy)
9. Check email logs for successful digests

### Post-Deployment

- [ ] Announcements appear on member dashboards
- [ ] Urgent emails deliver within 2 minutes
- [ ] Weekly digest cron job executed successfully
- [ ] Email logs show correct status (SENT, DELIVERED)
- [ ] No errors in application logs
- [ ] Admin can manage announcements without issues
- [ ] Members can mark announcements as read
- [ ] Email preferences save correctly
- [ ] Monitor email delivery rates (target: >99%)
- [ ] Set up alerts for failed digest sends

### Monitoring & Alerts

- Set up monitoring for:
  - Email send failures (alert if >5% failure rate)
  - Cron job execution (alert if missed)
  - API endpoint errors (announcement creation/retrieval)
  - Database query performance
- Weekly review of EmailLog data for delivery metrics

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
