# Specification: Admin Panel with Role-Based Controls

**Feature ID:** F022
**Priority:** Critical
**Effort:** Large (2 weeks / 14 days)
**Dependencies:** Authentication System (F002), All other features (F001-F021)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Flows](#user-flows)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [UI Components](#ui-components)
6. [Implementation Details](#implementation-details)
7. [Testing Requirements](#testing-requirements)
8. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Purpose
Implement a comprehensive administrative interface with granular role-based access control (RBAC) that enables authorized users to manage the entire BRITE POOL platform. This admin panel provides role-specific dashboards, user management, content moderation, system settings, and complete audit trails for all administrative actions.

### Key Requirements
- Comprehensive role-based access control with five administrative role levels
- Unified admin dashboard with role-specific views and metrics
- Complete user management interface (create, edit, roles, permissions, account status)
- Content moderation queue for approving/editing user-generated content
- System settings management (platform configuration, feature flags, integrations)
- Activity logs and audit trails for all administrative actions
- Real-time notifications for admin actions requiring attention
- Secure permission enforcement at API and UI levels

### Role Hierarchy & Permissions

#### 1. WEB_STEWARD (Highest Authority)
- **Access Level:** Full unrestricted access to everything
- **Capabilities:**
  - All admin panel features
  - User management: Create, edit, delete any user
  - Role assignment: Grant/revoke any role including WEB_STEWARD
  - System settings: Modify all platform configurations
  - Content moderation: Approve, edit, delete any content
  - Audit logs: View all system activity
  - Database management: Direct access to data modifications
  - Feature flags: Enable/disable platform features
  - API keys and integrations: Manage external services
  - Contract management: Publish new covenant versions
  - Financial oversight: View all transactions, subscriptions, payments

#### 2. BOARD_CHAIR (Board Leadership)
- **Access Level:** Domain-specific administrative access
- **Capabilities:**
  - User management: View all users, edit basic info, cannot delete
  - Role assignment: Grant/revoke roles up to COMMITTEE_LEADER
  - Committee management: Full access to their committee(s)
  - Content moderation: Approve/reject content, edit with review
  - Audit logs: View all committee and member activity
  - Reports: Generate membership, participation, committee reports
  - Announcements: Create/publish announcements to all members
  - Event oversight: View and manage all events
  - Cannot modify system settings or platform configuration
  - Cannot manage payment/subscription settings

#### 3. COMMITTEE_LEADER (Committee Administration)
- **Access Level:** Committee-only administrative access
- **Capabilities:**
  - User management: View committee members only, cannot edit roles
  - Committee management: Full access to assigned committee(s) only
  - Content moderation: Approve/edit committee-specific content
  - Member assignment: Add/remove members from their committee
  - Meeting management: Schedule and manage committee meetings
  - Task assignment: Create and assign committee tasks
  - Decision recording: Record committee decisions and votes
  - Reports: Generate committee-specific reports
  - Cannot access other committees' data
  - Cannot modify user roles or platform settings

#### 4. CONTENT_MODERATOR (Content Management Only)
- **Access Level:** Content approval and editing only
- **Capabilities:**
  - Content moderation: Approve, edit, or reject all user-generated content
  - Media gallery: Review and approve media uploads
  - Forum posts: Edit or remove inappropriate posts
  - Course content: Review and approve course submissions
  - Comments: Moderate comments across all features
  - Reports: View content moderation activity logs
  - Cannot access user management, settings, or committees
  - Cannot delete content (only hide/flag for admin review)
  - Cannot modify roles or permissions

#### 5. SUPPORT_STAFF (View-Only Support)
- **Access Level:** View-only access for user assistance
- **Capabilities:**
  - User lookup: Search and view user profiles (read-only)
  - Activity logs: View user activity for support purposes
  - Content viewing: Read all content for context during support
  - Reports: Generate user activity reports
  - Ticket system: View and respond to support tickets
  - Cannot modify any data
  - Cannot approve content
  - Cannot change roles or permissions
  - Cannot access system settings

### Success Metrics
- 100% of administrative actions logged in audit trail
- Zero unauthorized access to restricted features (role enforcement working)
- Admin users can complete core tasks within 3 clicks
- All content moderation requests handled within 24 hours
- Complete visibility into user activity and system health
- Audit logs retained for minimum 2 years for compliance

---

## User Flows

### Flow 1: WEB_STEWARD Creates New Administrator

```
1. WEB_STEWARD logs in and navigates to /dashboard/admin
2. Admin sees unified dashboard with all metrics and quick actions
3. Admin clicks "Users" in admin navigation
4. Admin navigates to /dashboard/admin/users
5. Admin sees searchable/filterable user table with:
   - Name, Email, Role, Status, Last Login, Actions
6. Admin clicks "Create User" button
7. Modal opens with user creation form:
   - Email (required, validated)
   - Name (required)
   - Role (dropdown: all roles available)
   - Initial Password (generated or manual)
   - Send Welcome Email (checkbox)
8. Admin fills form and selects role: "BOARD_CHAIR"
9. Admin submits form → POST /api/admin/users
10. System validates:
    - Email unique and valid format
    - Role is valid enum value
    - Current user has permission to grant this role
11. User created with passwordHash, default subscriptionTier
12. System sends welcome email with login instructions
13. Activity logged: "WEB_STEWARD [name] created user [email] with role BOARD_CHAIR"
14. Modal closes, user table refreshes with new user
15. Success notification displayed
```

### Flow 2: BOARD_CHAIR Reviews and Approves Content

```
1. BOARD_CHAIR logs in and navigates to /dashboard/admin
2. Admin sees notification badge: "12 items pending moderation"
3. Admin clicks "Content Moderation" in admin navigation
4. Admin navigates to /dashboard/admin/moderation
5. Admin sees moderation queue with tabs:
   - All (12) | Forum Posts (5) | Media Uploads (4) | Courses (2) | Comments (1)
6. Admin clicks "Media Uploads" tab
7. Admin sees grid of pending media items:
   - Thumbnail preview
   - Uploaded by: [User Name]
   - Category: [PROJECT_PROGRESS]
   - Uploaded: [timestamp]
   - Actions: [Approve] [Edit] [Reject]
8. Admin clicks thumbnail to view full image in modal
9. Admin reviews image - it's appropriate content
10. Admin clicks "Approve" button
11. Confirmation modal: "Approve this upload?"
12. Admin confirms → POST /api/admin/moderation/media/[id]/approve
13. System updates MediaItem status to "approved"
14. Activity logged: "BOARD_CHAIR [name] approved media upload [id] by [user]"
15. Item removed from queue, counter updates to 11
16. Optional: Email notification sent to uploader
17. Admin continues reviewing remaining items
```

### Flow 3: CONTENT_MODERATOR Edits Forum Post

```
1. CONTENT_MODERATOR logs in and navigates to /dashboard/admin/moderation
2. Moderator sees only "Content Moderation" tab (no Users, Settings, etc.)
3. Moderator clicks "Forum Posts" tab (5 pending)
4. Moderator sees list of flagged posts:
   - Post preview text
   - Author name
   - Category: [Education Discussions]
   - Flags: [Inappropriate Language - 2 reports]
   - Actions: [View] [Edit] [Reject]
5. Moderator clicks "View" to see full post in modal
6. Moderator sees inappropriate language in post content
7. Moderator clicks "Edit" button
8. Inline editor opens with post content
9. Moderator edits out inappropriate words, preserves intent
10. Moderator clicks "Save & Approve"
11. POST /api/admin/moderation/posts/[id]/edit with new content
12. System updates ForumPost content, sets moderatedBy and moderatedAt
13. Activity logged: "CONTENT_MODERATOR [name] edited and approved post [id]"
14. Optional: Notification sent to author about edit
15. Post removed from queue and published
```

### Flow 4: COMMITTEE_LEADER Views Committee Analytics

```
1. COMMITTEE_LEADER logs in and navigates to /dashboard/admin
2. Leader sees limited admin navigation: [Dashboard] [Committee] [Reports]
3. Leader's dashboard shows only their committee(s):
   - Health Board
     - Members: 12
     - Upcoming Meetings: 2
     - Active Tasks: 8
     - Recent Decisions: 3
4. Leader clicks "View Details" on Health Board
5. Leader navigates to /dashboard/admin/committees/health
6. Leader sees committee admin view with tabs:
   - Overview | Members | Content | Reports | Activity Log
7. Leader clicks "Reports" tab
8. Leader sees report options:
   - Member Activity Report
   - Meeting Attendance Report
   - Task Completion Report
   - Participation Hours Report
9. Leader selects "Member Activity Report"
10. Leader sets date range: Last 30 days
11. Leader clicks "Generate Report"
12. GET /api/admin/reports/committee/health/member-activity?start=...&end=...
13. System generates report showing:
    - Each member's forum posts, event attendance, tasks completed
    - Participation hours logged
    - Engagement score
14. Report displayed in table with export options (PDF, CSV)
15. Leader clicks "Export PDF"
16. Report downloaded with timestamp and audit log entry
```

### Flow 5: SUPPORT_STAFF Looks Up User for Assistance

```
1. SUPPORT_STAFF logs in and navigates to /dashboard/admin
2. Support sees limited navigation: [Dashboard] [User Lookup] [Activity Logs]
3. Support receives help request: "User can't access courses"
4. Support clicks "User Lookup" in navigation
5. Support navigates to /dashboard/admin/users (read-only view)
6. Support enters user email in search: "member@example.com"
7. GET /api/admin/users/search?q=member@example.com
8. User record returned and displayed in read-only card:
   - Name: Jane Doe
   - Email: member@example.com
   - Role: STEWARD
   - Subscription: BASIC (ACTIVE)
   - Covenant Accepted: Yes (v1.0.0 on 2025-11-15)
   - Last Login: 2025-12-17 08:30:00
   - Committees: [Education Board]
9. Support sees "View Activity Log" button
10. Support clicks button → GET /api/admin/users/[id]/activity
11. Activity log shows recent actions:
    - Logged in: 2025-12-17 08:30:00
    - Viewed Course "Sustainable Living": 2025-12-17 08:35:00
    - Attempted Course Enrollment: FAILED - Subscription Required
12. Support identifies issue: User has BASIC tier but course requires PREMIUM
13. Support cannot modify subscription (no permission)
14. Support escalates to BOARD_CHAIR with details
15. All lookups logged: "SUPPORT_STAFF [name] viewed user [email] profile"
```

### Flow 6: WEB_STEWARD Configures System Settings

```
1. WEB_STEWARD logs in and navigates to /dashboard/admin
2. Admin clicks "System Settings" in admin navigation
3. Admin navigates to /dashboard/admin/settings
4. Admin sees settings page with categories:
   - General | Email | Payments | Integrations | Feature Flags | Security
5. Admin clicks "Feature Flags" tab
6. Admin sees list of platform features with toggle switches:
   - [ON] Member Dashboard
   - [ON] Committee Management
   - [OFF] Marketplace (Coming Soon)
   - [ON] Media Gallery
   - [ON] Learning Management System
   - [OFF] Mobile App API
7. Admin wants to enable beta feature for testing
8. Admin toggles "Mobile App API" to ON
9. Confirmation modal: "Enable Mobile App API? This will allow mobile access."
10. Admin confirms → PATCH /api/admin/settings/feature-flags
11. System updates FeatureFlagSettings in database
12. Activity logged: "WEB_STEWARD [name] enabled feature flag: Mobile App API"
13. Success notification: "Mobile App API enabled"
14. Setting change takes effect immediately
15. Admin clicks "Email" tab to configure SMTP settings
16. Admin sees email configuration form:
    - SMTP Host, Port, Username, Password (encrypted)
    - From Address, From Name
    - Test Email button
17. Admin updates SMTP credentials
18. Admin clicks "Test Email" button
19. System sends test email and confirms delivery
20. Admin clicks "Save Settings"
21. Settings encrypted and saved to database
22. Activity logged with change details
```

### Flow 7: BOARD_CHAIR Reviews Audit Logs

```
1. BOARD_CHAIR logs in and navigates to /dashboard/admin
2. Admin clicks "Audit Logs" in admin navigation
3. Admin navigates to /dashboard/admin/audit
4. Admin sees comprehensive activity log table:
   - Timestamp | User | Role | Action | Resource | IP Address | Details
5. Admin sees filters and search:
   - Date Range selector
   - User filter (autocomplete)
   - Action Type filter (dropdown)
   - Resource Type filter (Users, Content, Settings, etc.)
6. Admin sets filter: Action Type = "Role Change"
7. GET /api/admin/audit?action=role_change&limit=50
8. Filtered results shown:
   - 2025-12-17 10:15 | WEB_STEWARD Admin | Role Change | User: john@example.com |
     Details: Changed role from STEWARD to COMMITTEE_LEADER
   - 2025-12-16 14:22 | BOARD_CHAIR Sarah | Role Change | User: mary@example.com |
     Details: Changed role from RESIDENT to STEWARD
9. Admin clicks on log entry to view full details modal:
   - Full timestamp with timezone
   - User who performed action with profile link
   - Target user with profile link
   - Old value: STEWARD
   - New value: COMMITTEE_LEADER
   - IP Address: 192.168.1.100
   - User Agent: Mozilla/5.0...
   - Session ID: sess_abc123...
10. Admin clicks "Export Logs" button
11. Modal opens with export options:
    - Format: CSV, JSON, PDF
    - Date Range
    - Include Filters
12. Admin selects CSV format and confirms
13. GET /api/admin/audit/export?format=csv&filters=...
14. CSV file generated and downloaded
15. Export action itself logged in audit trail
```

### Flow 8: WEB_STEWARD Manages User Accounts in Bulk

```
1. WEB_STEWARD logs in and navigates to /dashboard/admin/users
2. Admin sees user table with 247 total users
3. Admin needs to suspend multiple users who haven't accepted new covenant
4. Admin clicks "Advanced Filters" button
5. Filter panel expands with options:
   - Role, Subscription Tier, Status, Covenant Version, Last Login
6. Admin sets filters:
   - Covenant Version: "Not v2.0.0"
   - Last Login: "Before 30 days ago"
7. GET /api/admin/users?covenantVersion=lt:2.0.0&lastLogin=lt:2025-11-17
8. Filtered results: 23 users shown
9. Admin checks "Select All" checkbox
10. Bulk action menu appears: [Change Role] [Suspend] [Send Email] [Export]
11. Admin selects "Send Email" action
12. Email template modal opens:
    - Template selector: "Covenant Update Reminder"
    - Subject: Pre-filled from template
    - Body: Editable rich text with merge tags {{user.name}}
    - Preview button
13. Admin clicks "Preview" to see sample email
14. Admin confirms and clicks "Send to 23 Users"
15. Confirmation modal: "Send email to 23 users?"
16. Admin confirms → POST /api/admin/users/bulk-email
17. System queues emails via background job
18. Progress bar shown: "Sending emails... 23/23 complete"
19. Success notification: "Emails sent to 23 users"
20. Activity logged: "WEB_STEWARD [name] sent bulk email to 23 users"
```

---

## Database Schema

### Existing Models (from Prisma schema)

The following models already exist and will be utilized:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          UserRole  @default(STEWARD)

  // Existing fields...
  covenantAcceptedAt  DateTime?
  covenantVersion     String?
  subscriptionTier    SubscriptionTier @default(FREE)
  subscriptionStatus  SubscriptionStatus @default(INACTIVE)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  // New relations for admin
  auditLogsCreated      AuditLog[] @relation("AuditLogsCreated")
  moderatedContent      ModeratedContent[] @relation("ModeratedBy")
  sentNotifications     AdminNotification[] @relation("NotificationSender")

  @@index([role])
  @@index([subscriptionStatus])
  @@index([lastLoginAt])
}

enum UserRole {
  WEB_STEWARD          // Full admin access
  BOARD_CHAIR          // Domain-specific admin
  COMMITTEE_LEADER     // Committee-only admin
  CONTENT_MODERATOR    // Content approval only
  SUPPORT_STAFF        // Read-only support
  STEWARD              // Regular member
  PARTNER              // Affiliate partner
  RESIDENT             // Community resident
}
```

### New Models: Admin & Audit System

#### 1. AuditLog Model

```prisma
model AuditLog {
  id            String   @id @default(cuid())

  // Who performed the action
  userId        String
  user          User     @relation("AuditLogsCreated", fields: [userId], references: [id])
  userRole      UserRole // Role at time of action

  // What was done
  action        AuditAction
  resourceType  ResourceType
  resourceId    String?  // ID of affected resource

  // Details
  description   String   // Human-readable description
  metadata      Json?    // Additional structured data

  // Old/New values for changes
  oldValue      Json?
  newValue      Json?

  // Context
  ipAddress     String
  userAgent     String?
  sessionId     String?

  timestamp     DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([resourceType])
  @@index([timestamp])
  @@index([userId, timestamp])
}

enum AuditAction {
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  USER_SUSPENDED
  USER_ACTIVATED
  ROLE_CHANGED
  PASSWORD_RESET

  CONTENT_APPROVED
  CONTENT_REJECTED
  CONTENT_EDITED
  CONTENT_DELETED

  SETTINGS_UPDATED
  FEATURE_FLAG_CHANGED

  COMMITTEE_MEMBER_ADDED
  COMMITTEE_MEMBER_REMOVED

  CONTRACT_PUBLISHED

  BULK_EMAIL_SENT

  REPORT_GENERATED
  EXPORT_CREATED

  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
}

enum ResourceType {
  USER
  CONTENT
  COMMITTEE
  EVENT
  COURSE
  MEDIA
  FORUM_POST
  ANNOUNCEMENT
  SETTINGS
  CONTRACT
  REPORT
}
```

#### 2. ModeratedContent Model

```prisma
model ModeratedContent {
  id              String   @id @default(cuid())

  // What content
  contentType     ContentType
  contentId       String   // ID of the content being moderated

  // Moderation status
  status          ModerationStatus @default(PENDING)

  // Who submitted
  submittedById   String
  submittedAt     DateTime @default(now())

  // Who moderated
  moderatedById   String?
  moderatedBy     User?    @relation("ModeratedBy", fields: [moderatedById], references: [id])
  moderatedAt     DateTime?

  // Moderation details
  reason          String?  // If rejected, why
  notes           String?  // Internal moderator notes
  editedContent   Json?    // If edited, what changed

  // Flags and reports
  flagCount       Int      @default(0)
  reportedReasons String[] // Array of report reasons

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status])
  @@index([contentType])
  @@index([moderatedById])
  @@index([submittedAt])
}

enum ContentType {
  FORUM_POST
  MEDIA_ITEM
  COURSE
  LESSON
  COMMENT
  USER_PROFILE
  EVENT_DESCRIPTION
}

enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
  EDITED
  FLAGGED
}
```

#### 3. AdminNotification Model

```prisma
model AdminNotification {
  id          String   @id @default(cuid())

  // Who should see this
  targetRole  UserRole // Notification for specific role(s)
  targetUserId String? // Or specific user

  // Notification details
  type        NotificationType
  priority    NotificationPriority @default(NORMAL)
  title       String
  message     String

  // Link to relevant resource
  resourceType ResourceType?
  resourceId   String?
  actionUrl    String?  // Where to go when clicked

  // Status
  isRead      Boolean  @default(false)
  readAt      DateTime?

  // Who sent (system or user)
  senderId    String?
  sender      User?    @relation("NotificationSender", fields: [senderId], references: [id])

  createdAt   DateTime @default(now())
  expiresAt   DateTime?

  @@index([targetRole, isRead])
  @@index([targetUserId, isRead])
  @@index([createdAt])
}

enum NotificationType {
  CONTENT_PENDING_REVIEW
  USER_REPORTED
  SYSTEM_ALERT
  APPROVAL_REQUIRED
  SECURITY_WARNING
  FEATURE_UPDATE
  REPORT_READY
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

#### 4. SystemSettings Model

```prisma
model SystemSettings {
  id          String   @id @default(cuid())

  // Setting identification
  category    SettingsCategory
  key         String   @unique

  // Value
  value       Json     // Flexible storage for any setting type

  // Metadata
  label       String   // Human-readable label
  description String?  // What this setting does
  dataType    String   // "string", "boolean", "number", "json"
  isPublic    Boolean  @default(false) // Can non-admins see this?
  isEncrypted Boolean  @default(false) // Is value encrypted?

  // Audit
  lastUpdatedBy String?
  updatedAt     DateTime @updatedAt
  createdAt     DateTime @default(now())

  @@index([category])
  @@index([key])
}

enum SettingsCategory {
  GENERAL
  EMAIL
  PAYMENTS
  INTEGRATIONS
  FEATURE_FLAGS
  SECURITY
  NOTIFICATIONS
  THEME
}
```

### Database Migrations

Run Prisma migrations:
```bash
npx prisma db push
npx prisma generate
```

### Seed Data: Initial System Settings

```typescript
// prisma/seed-admin.ts
async function seedAdminSystem() {
  // Feature flags
  await prisma.systemSettings.upsert({
    where: { key: 'feature_committee_management' },
    update: {},
    create: {
      category: 'FEATURE_FLAGS',
      key: 'feature_committee_management',
      value: { enabled: true },
      label: 'Committee Management',
      description: 'Enable committee management features',
      dataType: 'boolean',
      isPublic: false
    }
  });

  // Email settings
  await prisma.systemSettings.upsert({
    where: { key: 'email_from_address' },
    update: {},
    create: {
      category: 'EMAIL',
      key: 'email_from_address',
      value: { email: 'noreply@britepool.org' },
      label: 'From Email Address',
      description: 'Email address used for outgoing emails',
      dataType: 'string',
      isPublic: false
    }
  });

  // More settings...
}
```

---

## API Endpoints

### User Management Endpoints

#### 1. GET /api/admin/users

**Purpose:** List and search all users with filters

**Authentication:** Required, role: SUPPORT_STAFF or higher

**Query Parameters:**
- `search` (optional): Search by name or email
- `role` (optional): Filter by UserRole
- `status` (optional): Filter by subscription status
- `covenantVersion` (optional): Filter by covenant version (e.g., "lt:2.0.0")
- `lastLogin` (optional): Filter by last login date
- `page` (optional, default: 1): Pagination page
- `limit` (optional, default: 50): Results per page

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "member@example.com",
      "name": "Jane Doe",
      "role": "STEWARD",
      "subscriptionTier": "BASIC",
      "subscriptionStatus": "ACTIVE",
      "covenantAcceptedAt": "2025-11-15T10:00:00Z",
      "covenantVersion": "1.0.0",
      "lastLoginAt": "2025-12-17T08:30:00Z",
      "createdAt": "2025-10-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 247,
    "pages": 5
  }
}
```

**Permission Check:**
- SUPPORT_STAFF: Can view, cannot modify
- COMMITTEE_LEADER: Can view only committee members
- BOARD_CHAIR & WEB_STEWARD: Can view all users

---

#### 2. POST /api/admin/users

**Purpose:** Create a new user account

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "John Smith",
  "role": "COMMITTEE_LEADER",
  "password": "temporaryPassword123!",
  "sendWelcomeEmail": true,
  "subscriptionTier": "BASIC"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_456",
    "email": "newuser@example.com",
    "name": "John Smith",
    "role": "COMMITTEE_LEADER",
    "createdAt": "2025-12-17T10:30:00Z"
  }
}
```

**Permission Check:**
- WEB_STEWARD: Can create any role
- BOARD_CHAIR: Can create roles up to COMMITTEE_LEADER

**Validation:**
- Email must be unique and valid format
- Password must meet security requirements (8+ chars, mixed case, number, special char)
- Role must be valid enum value

**Side Effects:**
- Password hashed with bcrypt
- Welcome email sent if `sendWelcomeEmail: true`
- Audit log entry created

---

#### 3. PATCH /api/admin/users/[id]

**Purpose:** Update user account details

**Authentication:** Required, role: COMMITTEE_LEADER or higher

**Request Body:**
```json
{
  "name": "Jane Smith",
  "role": "BOARD_CHAIR",
  "subscriptionTier": "PREMIUM",
  "subscriptionStatus": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "member@example.com",
    "name": "Jane Smith",
    "role": "BOARD_CHAIR",
    "updatedAt": "2025-12-17T11:00:00Z"
  },
  "changes": {
    "name": { "old": "Jane Doe", "new": "Jane Smith" },
    "role": { "old": "STEWARD", "new": "BOARD_CHAIR" }
  }
}
```

**Permission Check:**
- COMMITTEE_LEADER: Can update committee members' basic info only (not roles)
- BOARD_CHAIR: Can update roles up to COMMITTEE_LEADER
- WEB_STEWARD: Can update any field for any user

**Validation:**
- Cannot change own role
- Cannot grant role higher than current user's role
- Email changes require verification

**Side Effects:**
- Audit log entry with old/new values
- User session invalidated if role changed

---

#### 4. DELETE /api/admin/users/[id]

**Purpose:** Delete user account (soft delete)

**Authentication:** Required, role: WEB_STEWARD only

**Response:**
```json
{
  "success": true,
  "message": "User account deleted",
  "deletedUserId": "user_123"
}
```

**Permission Check:**
- Only WEB_STEWARD can delete users
- Cannot delete own account

**Side Effects:**
- User record soft-deleted (email changed to `deleted_timestamp_email`)
- All sessions invalidated
- Audit log entry created
- Related content anonymized or reassigned

---

#### 5. POST /api/admin/users/bulk-action

**Purpose:** Perform bulk actions on multiple users

**Authentication:** Required, role: BOARD_CHAIR or WEB_STEWARD

**Request Body:**
```json
{
  "action": "SEND_EMAIL",
  "userIds": ["user_1", "user_2", "user_3"],
  "params": {
    "template": "covenant_reminder",
    "subject": "Important: New Covenant Update",
    "body": "Dear {{user.name}}, please review..."
  }
}
```

**Supported Actions:**
- `SEND_EMAIL`: Send bulk email
- `CHANGE_ROLE`: Change role for multiple users
- `SUSPEND`: Suspend accounts
- `ACTIVATE`: Activate accounts
- `EXPORT`: Export user data

**Response:**
```json
{
  "success": true,
  "action": "SEND_EMAIL",
  "processed": 3,
  "failed": 0,
  "results": [
    { "userId": "user_1", "status": "success" },
    { "userId": "user_2", "status": "success" },
    { "userId": "user_3", "status": "success" }
  ]
}
```

---

### Content Moderation Endpoints

#### 6. GET /api/admin/moderation/queue

**Purpose:** Get content pending moderation

**Authentication:** Required, role: CONTENT_MODERATOR or higher

**Query Parameters:**
- `contentType` (optional): Filter by ContentType
- `status` (optional): Filter by ModerationStatus
- `page`, `limit`: Pagination

**Response:**
```json
{
  "queue": [
    {
      "id": "mod_123",
      "contentType": "MEDIA_ITEM",
      "contentId": "media_456",
      "status": "PENDING",
      "submittedById": "user_789",
      "submittedBy": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "submittedAt": "2025-12-17T09:00:00Z",
      "flagCount": 0,
      "preview": {
        "thumbnailUrl": "https://...",
        "category": "PROJECT_PROGRESS"
      }
    }
  ],
  "counts": {
    "pending": 12,
    "byType": {
      "FORUM_POST": 5,
      "MEDIA_ITEM": 4,
      "COURSE": 2,
      "COMMENT": 1
    }
  }
}
```

---

#### 7. POST /api/admin/moderation/[id]/approve

**Purpose:** Approve moderated content

**Authentication:** Required, role: CONTENT_MODERATOR or higher

**Request Body:**
```json
{
  "notes": "Content approved - meets community guidelines"
}
```

**Response:**
```json
{
  "success": true,
  "contentId": "media_456",
  "status": "APPROVED",
  "moderatedAt": "2025-12-17T10:00:00Z"
}
```

**Side Effects:**
- Content published/made visible
- Submitter notified
- Audit log entry created

---

#### 8. POST /api/admin/moderation/[id]/reject

**Purpose:** Reject moderated content

**Authentication:** Required, role: CONTENT_MODERATOR or higher

**Request Body:**
```json
{
  "reason": "Contains inappropriate content",
  "notifyUser": true
}
```

**Response:**
```json
{
  "success": true,
  "contentId": "media_456",
  "status": "REJECTED"
}
```

**Side Effects:**
- Content hidden/deleted
- Submitter notified with reason
- Audit log entry created

---

#### 9. PATCH /api/admin/moderation/[id]/edit

**Purpose:** Edit and approve content

**Authentication:** Required, role: CONTENT_MODERATOR or higher

**Request Body:**
```json
{
  "editedContent": {
    "title": "Updated Title",
    "description": "Edited description with inappropriate words removed"
  },
  "notes": "Edited to remove inappropriate language"
}
```

**Response:**
```json
{
  "success": true,
  "contentId": "forum_post_789",
  "status": "EDITED",
  "changes": { /* diff */ }
}
```

---

### System Settings Endpoints

#### 10. GET /api/admin/settings

**Purpose:** Get all system settings

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Query Parameters:**
- `category` (optional): Filter by SettingsCategory

**Response:**
```json
{
  "settings": [
    {
      "id": "setting_1",
      "category": "FEATURE_FLAGS",
      "key": "feature_committee_management",
      "value": { "enabled": true },
      "label": "Committee Management",
      "description": "Enable committee features",
      "dataType": "boolean"
    }
  ]
}
```

**Permission Check:**
- WEB_STEWARD: Can view all settings
- BOARD_CHAIR: Can view non-sensitive settings only

---

#### 11. PATCH /api/admin/settings/[key]

**Purpose:** Update system setting

**Authentication:** Required, role: WEB_STEWARD only

**Request Body:**
```json
{
  "value": { "enabled": false }
}
```

**Response:**
```json
{
  "success": true,
  "setting": {
    "key": "feature_committee_management",
    "value": { "enabled": false },
    "updatedAt": "2025-12-17T11:00:00Z"
  }
}
```

**Side Effects:**
- Setting updated immediately
- Cache invalidated
- Audit log entry created

---

### Audit Log Endpoints

#### 12. GET /api/admin/audit

**Purpose:** Get audit log entries

**Authentication:** Required, role: SUPPORT_STAFF or higher

**Query Parameters:**
- `action` (optional): Filter by AuditAction
- `userId` (optional): Filter by user who performed action
- `resourceType` (optional): Filter by ResourceType
- `startDate`, `endDate`: Date range
- `page`, `limit`: Pagination

**Response:**
```json
{
  "logs": [
    {
      "id": "log_123",
      "userId": "user_admin",
      "user": {
        "name": "Admin User",
        "role": "WEB_STEWARD"
      },
      "action": "ROLE_CHANGED",
      "resourceType": "USER",
      "resourceId": "user_789",
      "description": "Changed role from STEWARD to COMMITTEE_LEADER",
      "oldValue": { "role": "STEWARD" },
      "newValue": { "role": "COMMITTEE_LEADER" },
      "ipAddress": "192.168.1.100",
      "timestamp": "2025-12-17T10:15:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

**Permission Check:**
- SUPPORT_STAFF: Can view user activity logs only
- COMMITTEE_LEADER: Can view committee-related logs only
- BOARD_CHAIR: Can view all user and committee logs
- WEB_STEWARD: Can view all logs

---

#### 13. GET /api/admin/audit/export

**Purpose:** Export audit logs

**Authentication:** Required, role: BOARD_CHAIR or WEB_STEWARD

**Query Parameters:**
- `format`: "csv", "json", or "pdf"
- `startDate`, `endDate`: Date range
- All filter params from GET /api/admin/audit

**Response:**
- File download (CSV, JSON, or PDF)

**Side Effects:**
- Export action logged in audit trail

---

### Analytics & Reports Endpoints

#### 14. GET /api/admin/analytics/dashboard

**Purpose:** Get dashboard analytics data

**Authentication:** Required, role: COMMITTEE_LEADER or higher

**Response:**
```json
{
  "overview": {
    "totalUsers": 247,
    "activeUsers": 189,
    "newUsersThisMonth": 23,
    "pendingModeration": 12,
    "activeCommittees": 5,
    "upcomingEvents": 8
  },
  "usersByRole": {
    "STEWARD": 180,
    "PARTNER": 45,
    "RESIDENT": 15,
    "COMMITTEE_LEADER": 5,
    "BOARD_CHAIR": 1,
    "WEB_STEWARD": 1
  },
  "subscriptions": {
    "FREE": 100,
    "BASIC": 80,
    "PREMIUM": 50,
    "PLATINUM": 17
  },
  "recentActivity": [
    {
      "type": "USER_REGISTERED",
      "description": "New user registered: jane@example.com",
      "timestamp": "2025-12-17T09:30:00Z"
    }
  ]
}
```

**Permission Check:**
- COMMITTEE_LEADER: Gets committee-specific analytics only
- BOARD_CHAIR & WEB_STEWARD: Gets full platform analytics

---

#### 15. POST /api/admin/reports/generate

**Purpose:** Generate custom report

**Authentication:** Required, role: COMMITTEE_LEADER or higher

**Request Body:**
```json
{
  "reportType": "USER_ACTIVITY",
  "parameters": {
    "startDate": "2025-11-01",
    "endDate": "2025-12-01",
    "userIds": ["user_1", "user_2"],
    "includeMetrics": ["logins", "posts", "hours_logged"]
  },
  "format": "PDF"
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "report_789",
  "status": "GENERATING",
  "estimatedCompletion": "2025-12-17T10:05:00Z",
  "downloadUrl": "/api/admin/reports/report_789/download"
}
```

**Supported Report Types:**
- `USER_ACTIVITY`: User engagement metrics
- `COMMITTEE_ACTIVITY`: Committee participation
- `CONTENT_MODERATION`: Moderation statistics
- `FINANCIAL_SUMMARY`: Subscription and revenue (WEB_STEWARD only)
- `SYSTEM_HEALTH`: Platform performance metrics (WEB_STEWARD only)

---

### Notification Endpoints

#### 16. GET /api/admin/notifications

**Purpose:** Get admin notifications

**Authentication:** Required, role: COMMITTEE_LEADER or higher

**Query Parameters:**
- `isRead` (optional): Filter by read status
- `priority` (optional): Filter by priority

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "type": "CONTENT_PENDING_REVIEW",
      "priority": "NORMAL",
      "title": "New content pending review",
      "message": "5 media items waiting for approval",
      "actionUrl": "/dashboard/admin/moderation",
      "isRead": false,
      "createdAt": "2025-12-17T09:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

---

#### 17. PATCH /api/admin/notifications/[id]/read

**Purpose:** Mark notification as read

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "notificationId": "notif_123",
  "readAt": "2025-12-17T10:30:00Z"
}
```

---

## UI Components

### 1. Admin Dashboard Layout

**Location:** `app/dashboard/admin/layout.tsx`

**Features:**
- Sidebar navigation with role-based menu items
- Top bar with notifications dropdown, user menu, quick actions
- Breadcrumb navigation
- Responsive layout (desktop, tablet, mobile)
- Color-coded by section (Users = blue, Content = green, Settings = purple)

**Navigation Structure:**
```typescript
const adminNavigation = {
  WEB_STEWARD: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/dashboard/admin/users', icon: Users },
    { label: 'Content Moderation', href: '/dashboard/admin/moderation', icon: Shield },
    { label: 'Committees', href: '/dashboard/admin/committees', icon: Users },
    { label: 'System Settings', href: '/dashboard/admin/settings', icon: Settings },
    { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: FileText },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart },
  ],
  BOARD_CHAIR: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/dashboard/admin/users', icon: Users },
    { label: 'Content Moderation', href: '/dashboard/admin/moderation', icon: Shield },
    { label: 'Committees', href: '/dashboard/admin/committees', icon: Users },
    { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: FileText },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart },
  ],
  COMMITTEE_LEADER: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'My Committee', href: '/dashboard/admin/committees', icon: Users },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart },
  ],
  CONTENT_MODERATOR: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Content Moderation', href: '/dashboard/admin/moderation', icon: Shield },
  ],
  SUPPORT_STAFF: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'User Lookup', href: '/dashboard/admin/users', icon: Search },
    { label: 'Activity Logs', href: '/dashboard/admin/audit', icon: FileText },
  ],
};
```

---

### 2. Admin Dashboard Page

**Location:** `app/dashboard/admin/page.tsx`

**Features:**
- Role-specific overview cards (metrics)
- Recent activity feed
- Quick action buttons
- Pending tasks/notifications
- System health status (WEB_STEWARD only)

**Component Structure:**
```tsx
export default function AdminDashboard() {
  const session = useSession();
  const userRole = session.user.role;

  // Fetch analytics based on role
  const { data: analytics } = useSWR('/api/admin/analytics/dashboard');

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session.user.name}</p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userRole !== 'SUPPORT_STAFF' && (
          <MetricCard
            label="Total Users"
            value={analytics.overview.totalUsers}
            trend="+23 this month"
            icon={Users}
          />
        )}

        {['CONTENT_MODERATOR', 'BOARD_CHAIR', 'WEB_STEWARD'].includes(userRole) && (
          <MetricCard
            label="Pending Moderation"
            value={analytics.overview.pendingModeration}
            trend="Requires attention"
            icon={AlertCircle}
            variant="warning"
          />
        )}

        {/* More metric cards based on role */}
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {userRole === 'WEB_STEWARD' && (
            <QuickActionCard
              label="Create User"
              icon={UserPlus}
              href="/dashboard/admin/users?action=create"
            />
          )}
          {/* More quick actions */}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <ActivityFeed items={analytics.recentActivity} />
      </section>
    </div>
  );
}
```

---

### 3. User Management Table

**Location:** `app/dashboard/admin/users/page.tsx`

**Features:**
- Searchable, sortable, filterable table
- Pagination
- Bulk selection
- Inline actions (Edit, Suspend, View Profile)
- Advanced filters panel
- Export button
- Create User button (WEB_STEWARD, BOARD_CHAIR only)

**Component Structure:**
```tsx
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { data, isLoading } = useSWR(
    `/api/admin/users?${new URLSearchParams(filters)}`
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">{data?.pagination.total} total users</p>
        </div>

        {canCreateUser && (
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="mr-2" />
            Create User
          </Button>
        )}
      </header>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <SearchInput
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(value) => setFilters({ ...filters, search: value })}
        />

        <FilterDropdown
          label="Role"
          options={userRoles}
          value={filters.role}
          onChange={(value) => setFilters({ ...filters, role: value })}
        />

        <Button variant="outline" onClick={() => setShowAdvancedFilters(true)}>
          <Filter className="mr-2" />
          Advanced Filters
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 p-4 rounded flex justify-between items-center">
          <span>{selectedUsers.length} users selected</span>
          <div className="flex gap-2">
            <Button variant="outline">Change Role</Button>
            <Button variant="outline">Send Email</Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <DataTable
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'email', label: 'Email', sortable: true },
          { key: 'role', label: 'Role', sortable: true, render: (row) => (
            <Badge variant={roleColors[row.role]}>{row.role}</Badge>
          )},
          { key: 'subscriptionTier', label: 'Subscription', sortable: true },
          { key: 'lastLoginAt', label: 'Last Login', sortable: true, render: (row) => (
            formatRelativeTime(row.lastLoginAt)
          )},
          { key: 'actions', label: 'Actions', render: (row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => viewUser(row.id)}>
                View
              </Button>
              {canEditUser && (
                <Button size="sm" variant="ghost" onClick={() => editUser(row.id)}>
                  Edit
                </Button>
              )}
            </div>
          )}
        ]}
        data={users}
        loading={isLoading}
        onSelect={setSelectedUsers}
      />

      {/* Pagination */}
      <Pagination
        currentPage={data?.pagination.page}
        totalPages={data?.pagination.pages}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {/* Modals */}
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
```

---

### 4. Content Moderation Queue

**Location:** `app/dashboard/admin/moderation/page.tsx`

**Features:**
- Tabbed interface by content type
- Thumbnail/preview for each item
- Bulk approve/reject
- Individual item actions
- Filter by status, date, reporter
- Priority sorting

**Component Structure:**
```tsx
export default function ModerationQueuePage() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: queue } = useSWR('/api/admin/moderation/queue');

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-gray-600">{queue?.counts.pending} items pending review</p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({queue?.counts.pending})
          </TabsTrigger>
          <TabsTrigger value="FORUM_POST">
            Forum Posts ({queue?.counts.byType.FORUM_POST})
          </TabsTrigger>
          <TabsTrigger value="MEDIA_ITEM">
            Media ({queue?.counts.byType.MEDIA_ITEM})
          </TabsTrigger>
          <TabsTrigger value="COURSE">
            Courses ({queue?.counts.byType.COURSE})
          </TabsTrigger>
          <TabsTrigger value="COMMENT">
            Comments ({queue?.counts.byType.COMMENT})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <ModerationGrid items={queue?.queue.filter(item =>
            activeTab === 'all' || item.contentType === activeTab
          )} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModerationGrid({ items }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <ModerationCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ModerationCard({ item }) {
  return (
    <Card className="overflow-hidden">
      {/* Preview */}
      <div className="aspect-video bg-gray-100 relative">
        {item.contentType === 'MEDIA_ITEM' && (
          <img src={item.preview.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        )}
        {item.contentType === 'FORUM_POST' && (
          <div className="p-4">
            <p className="text-sm line-clamp-4">{item.preview.content}</p>
          </div>
        )}

        {item.flagCount > 0 && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            {item.flagCount} flags
          </Badge>
        )}
      </div>

      {/* Details */}
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{item.submittedBy.name}</p>
            <p className="text-sm text-gray-500">
              {formatRelativeTime(item.submittedAt)}
            </p>
          </div>
          <Badge>{item.contentType}</Badge>
        </div>

        {item.reportedReasons.length > 0 && (
          <div className="bg-red-50 p-2 rounded">
            <p className="text-xs font-medium text-red-700">Reported:</p>
            <p className="text-xs text-red-600">{item.reportedReasons.join(', ')}</p>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => viewFullContent(item)}
          className="flex-1"
        >
          View
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={() => approveContent(item.id)}
          className="flex-1"
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => editContent(item)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => rejectContent(item.id)}
        >
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### 5. System Settings Page

**Location:** `app/dashboard/admin/settings/page.tsx`

**Features:**
- Categorized settings tabs
- Toggle switches for feature flags
- Input fields for configuration values
- Test buttons (e.g., "Test Email")
- Save confirmation
- Change history

**Component Structure:**
```tsx
export default function SystemSettingsPage() {
  const [activeCategory, setActiveCategory] = useState('GENERAL');
  const { data: settings } = useSWR('/api/admin/settings');
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-gray-600">Configure platform settings and features</p>
      </header>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="GENERAL">General</TabsTrigger>
          <TabsTrigger value="EMAIL">Email</TabsTrigger>
          <TabsTrigger value="PAYMENTS">Payments</TabsTrigger>
          <TabsTrigger value="INTEGRATIONS">Integrations</TabsTrigger>
          <TabsTrigger value="FEATURE_FLAGS">Feature Flags</TabsTrigger>
          <TabsTrigger value="SECURITY">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="FEATURE_FLAGS" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings
                ?.filter(s => s.category === 'FEATURE_FLAGS')
                .map(setting => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{setting.label}</p>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <Switch
                      checked={setting.value.enabled}
                      onCheckedChange={(checked) => updateSetting(setting.key, { enabled: checked })}
                    />
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="EMAIL" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure SMTP settings for outgoing emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Host</Label>
                  <Input placeholder="smtp.example.com" />
                </div>
                <div>
                  <Label>SMTP Port</Label>
                  <Input type="number" placeholder="587" />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input placeholder="username" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label>From Address</Label>
                  <Input placeholder="noreply@britepool.org" />
                </div>
                <div>
                  <Label>From Name</Label>
                  <Input placeholder="BRITE POOL" />
                </div>
              </div>

              <Button variant="outline" onClick={testEmail}>
                <Mail className="mr-2" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* More tabs */}
      </Tabs>

      {/* Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={discardChanges}>
                Discard
              </Button>
              <Button onClick={saveSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 6. Audit Log Viewer

**Location:** `app/dashboard/admin/audit/page.tsx`

**Features:**
- Filterable log table
- Date range picker
- Action type filter
- User filter
- Resource type filter
- Detail view modal
- Export logs button

**Component Structure:**
```tsx
export default function AuditLogPage() {
  const [filters, setFilters] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  const { data: logs } = useSWR(
    `/api/admin/audit?${new URLSearchParams(filters)}`
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">Complete activity trail for all admin actions</p>
        </div>

        <Button onClick={exportLogs}>
          <Download className="mr-2" />
          Export Logs
        </Button>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date Range</Label>
              <DateRangePicker
                value={{ start: filters.startDate, end: filters.endDate }}
                onChange={({ start, end }) => setFilters({ ...filters, startDate: start, endDate: end })}
              />
            </div>

            <div>
              <Label>Action Type</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="USER_CREATED">User Created</SelectItem>
                  <SelectItem value="ROLE_CHANGED">Role Changed</SelectItem>
                  <SelectItem value="CONTENT_APPROVED">Content Approved</SelectItem>
                  {/* More options */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>User</Label>
              <UserSearchCombobox
                value={filters.userId}
                onChange={(value) => setFilters({ ...filters, userId: value })}
              />
            </div>

            <div>
              <Label>Resource Type</Label>
              <Select
                value={filters.resourceType}
                onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                  <SelectItem value="CONTENT">Content</SelectItem>
                  <SelectItem value="SETTINGS">Settings</SelectItem>
                  {/* More options */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.logs.map(log => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm">
                  {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{log.user.name}</p>
                    <p className="text-xs text-gray-500">{log.userRole}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={actionTypeColors[log.action]}>
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{log.resourceType}</p>
                    <p className="text-xs text-gray-500 font-mono">{log.resourceId}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {log.description}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.ipAddress}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => viewLogDetails(log)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={logs?.pagination.page}
        totalPages={logs?.pagination.pages}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
}
```

---

### 7. Permission Matrices Component

**Location:** `app/components/admin/PermissionMatrix.tsx`

**Purpose:** Visual display of role permissions for documentation and reference

```tsx
export function PermissionMatrix() {
  const permissions = {
    'User Management': {
      'View All Users': ['WEB_STEWARD', 'BOARD_CHAIR', 'SUPPORT_STAFF'],
      'Create Users': ['WEB_STEWARD', 'BOARD_CHAIR'],
      'Edit Users': ['WEB_STEWARD', 'BOARD_CHAIR'],
      'Delete Users': ['WEB_STEWARD'],
      'Change Roles': ['WEB_STEWARD', 'BOARD_CHAIR'],
      'View Committee Members': ['COMMITTEE_LEADER', 'BOARD_CHAIR', 'WEB_STEWARD'],
    },
    'Content Moderation': {
      'View Queue': ['CONTENT_MODERATOR', 'BOARD_CHAIR', 'WEB_STEWARD'],
      'Approve Content': ['CONTENT_MODERATOR', 'BOARD_CHAIR', 'WEB_STEWARD'],
      'Edit Content': ['CONTENT_MODERATOR', 'BOARD_CHAIR', 'WEB_STEWARD'],
      'Reject Content': ['CONTENT_MODERATOR', 'BOARD_CHAIR', 'WEB_STEWARD'],
      'Delete Content': ['WEB_STEWARD'],
    },
    'System Settings': {
      'View Settings': ['BOARD_CHAIR', 'WEB_STEWARD'],
      'Edit Settings': ['WEB_STEWARD'],
      'Feature Flags': ['WEB_STEWARD'],
      'Integrations': ['WEB_STEWARD'],
    },
    'Committees': {
      'View All Committees': ['BOARD_CHAIR', 'WEB_STEWARD'],
      'View Own Committee': ['COMMITTEE_LEADER', 'BOARD_CHAIR', 'WEB_STEWARD'],
      'Manage Members': ['COMMITTEE_LEADER', 'BOARD_CHAIR', 'WEB_STEWARD'],
      'Record Decisions': ['COMMITTEE_LEADER', 'BOARD_CHAIR', 'WEB_STEWARD'],
    },
    'Audit & Reports': {
      'View Audit Logs': ['SUPPORT_STAFF', 'COMMITTEE_LEADER', 'BOARD_CHAIR', 'WEB_STEWARD'],
      'Export Audit Logs': ['BOARD_CHAIR', 'WEB_STEWARD'],
      'Generate Reports': ['COMMITTEE_LEADER', 'BOARD_CHAIR', 'WEB_STEWARD'],
      'Financial Reports': ['WEB_STEWARD'],
    },
  };

  const roles = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR', 'SUPPORT_STAFF'];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Permission Matrix</h2>
        <p className="text-gray-600">Role-based access control overview</p>
      </header>

      {Object.entries(permissions).map(([category, perms]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Permission</TableHead>
                  {roles.map(role => (
                    <TableHead key={role} className="text-center">
                      {role.replace('_', ' ')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(perms).map(([permission, allowedRoles]) => (
                  <TableRow key={permission}>
                    <TableCell className="font-medium">{permission}</TableCell>
                    {roles.map(role => (
                      <TableCell key={role} className="text-center">
                        {allowedRoles.includes(role) ? (
                          <Check className="inline text-green-600" />
                        ) : (
                          <X className="inline text-gray-300" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## Implementation Details

### Phase 1: Database Schema & Audit System (Days 1-3)

1. **Update Prisma Schema**
   - Add `AuditLog`, `ModeratedContent`, `AdminNotification`, `SystemSettings` models
   - Add new relations to `User` model
   - Run `npx prisma db push` to apply schema

2. **Create Audit Logging Service**
   - `lib/services/audit.service.ts`
   - Helper function: `createAuditLog(params)`
   - Middleware to auto-log API requests
   - IP address and user agent capture

3. **Implement Permission Checking System**
   - `lib/auth/permissions.ts`
   - Define permission matrix constants
   - Helper functions: `hasPermission(user, permission)`, `canAccessResource(user, resource)`
   - HOC for protected API routes

4. **Seed Initial System Settings**
   - Create seed script for default settings
   - Feature flags, email config templates, etc.

**Deliverables:**
- Database schema updated and migrated
- Audit logging service functional
- Permission checking utilities ready
- Seed data created

---

### Phase 2: Core Admin API Endpoints (Days 4-6)

1. **User Management APIs**
   - `GET /api/admin/users` - List/search users
   - `POST /api/admin/users` - Create user
   - `PATCH /api/admin/users/[id]` - Update user
   - `DELETE /api/admin/users/[id]` - Delete user
   - `POST /api/admin/users/bulk-action` - Bulk actions

2. **Content Moderation APIs**
   - `GET /api/admin/moderation/queue` - Get moderation queue
   - `POST /api/admin/moderation/[id]/approve` - Approve content
   - `POST /api/admin/moderation/[id]/reject` - Reject content
   - `PATCH /api/admin/moderation/[id]/edit` - Edit content

3. **Settings & Audit APIs**
   - `GET /api/admin/settings` - Get settings
   - `PATCH /api/admin/settings/[key]` - Update setting
   - `GET /api/admin/audit` - Get audit logs
   - `GET /api/admin/audit/export` - Export logs

4. **Analytics APIs**
   - `GET /api/admin/analytics/dashboard` - Dashboard metrics
   - `POST /api/admin/reports/generate` - Generate reports

**Deliverables:**
- All admin API endpoints implemented
- Permission checks enforced on all routes
- Audit logging on all write operations
- API tests passing

---

### Phase 3: Admin Dashboard UI (Days 7-9)

1. **Admin Layout & Navigation**
   - Create admin layout component with sidebar
   - Role-based navigation rendering
   - Notification dropdown
   - Breadcrumb navigation

2. **Dashboard Page**
   - Role-specific overview cards
   - Recent activity feed
   - Quick action buttons
   - Pending tasks summary

3. **User Management UI**
   - User table with search/filter
   - Create user modal
   - Edit user modal
   - Bulk action interface
   - User detail page

**Deliverables:**
- Admin dashboard layout complete
- Dashboard page with metrics
- User management interface functional

---

### Phase 4: Content Moderation & Settings UI (Days 10-12)

1. **Content Moderation Queue**
   - Tabbed interface by content type
   - Moderation cards with previews
   - Approve/reject/edit actions
   - Detail view modals

2. **System Settings Page**
   - Tabbed settings interface
   - Feature flags with toggles
   - Email configuration form
   - Payment settings
   - Integration settings

3. **Audit Log Viewer**
   - Filterable log table
   - Date range picker
   - Detail view modal
   - Export functionality

**Deliverables:**
- Content moderation queue functional
- System settings page complete
- Audit log viewer working
- All admin features connected to APIs

---

### Phase 5: Reports, Notifications & Polish (Days 13-14)

1. **Reports System**
   - Report generation UI
   - Report templates
   - PDF/CSV export
   - Scheduled reports (future)

2. **Admin Notifications**
   - Notification dropdown
   - Real-time updates (websocket)
   - Mark as read functionality
   - Notification preferences

3. **Permission Matrix Documentation**
   - Visual permission matrix component
   - Role documentation page
   - Admin help/guide section

4. **Final Polish**
   - Responsive design refinement
   - Loading states and error handling
   - Accessibility improvements
   - Performance optimization

**Deliverables:**
- Reports system functional
- Notifications working
- Permission documentation complete
- All admin features polished and tested

---

## Testing Requirements

### Unit Tests

```typescript
// Test permission checking
describe('Permission System', () => {
  test('WEB_STEWARD has all permissions', () => {
    const user = { role: 'WEB_STEWARD' };
    expect(hasPermission(user, 'EDIT_SETTINGS')).toBe(true);
    expect(hasPermission(user, 'DELETE_USER')).toBe(true);
  });

  test('SUPPORT_STAFF has read-only access', () => {
    const user = { role: 'SUPPORT_STAFF' };
    expect(hasPermission(user, 'VIEW_USERS')).toBe(true);
    expect(hasPermission(user, 'EDIT_USERS')).toBe(false);
  });

  test('COMMITTEE_LEADER can only access own committee', () => {
    const user = { role: 'COMMITTEE_LEADER', committees: ['health'] };
    expect(canAccessCommittee(user, 'health')).toBe(true);
    expect(canAccessCommittee(user, 'governance')).toBe(false);
  });
});

// Test audit logging
describe('Audit Logging', () => {
  test('creates audit log on user creation', async () => {
    const admin = { id: 'admin_1', role: 'WEB_STEWARD' };
    const newUser = await createUser({ email: 'test@example.com' }, admin);

    const log = await prisma.auditLog.findFirst({
      where: { action: 'USER_CREATED', resourceId: newUser.id }
    });

    expect(log).toBeTruthy();
    expect(log.userId).toBe(admin.id);
  });
});

// Test user management API
describe('POST /api/admin/users', () => {
  test('WEB_STEWARD can create any role', async () => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${webStewardToken}` },
      body: JSON.stringify({
        email: 'newadmin@example.com',
        role: 'BOARD_CHAIR'
      })
    });

    expect(res.status).toBe(200);
  });

  test('BOARD_CHAIR cannot create WEB_STEWARD', async () => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${boardChairToken}` },
      body: JSON.stringify({
        email: 'newsteward@example.com',
        role: 'WEB_STEWARD'
      })
    });

    expect(res.status).toBe(403);
  });

  test('SUPPORT_STAFF cannot create users', async () => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${supportToken}` },
      body: JSON.stringify({
        email: 'test@example.com',
        role: 'STEWARD'
      })
    });

    expect(res.status).toBe(403);
  });
});
```

---

### Integration Tests

```typescript
describe('Admin Panel Integration Tests', () => {
  test('Full user creation workflow', async () => {
    // 1. Admin creates user
    const createRes = await fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', role: 'STEWARD' })
    });
    const { user } = await createRes.json();

    // 2. User appears in user list
    const listRes = await fetch('/api/admin/users');
    const { users } = await listRes.json();
    expect(users.find(u => u.id === user.id)).toBeTruthy();

    // 3. Audit log created
    const auditRes = await fetch(`/api/admin/audit?resourceId=${user.id}`);
    const { logs } = await auditRes.json();
    expect(logs[0].action).toBe('USER_CREATED');

    // 4. Welcome email sent
    expect(emailService.lastSent.to).toBe('test@example.com');
  });

  test('Content moderation workflow', async () => {
    // 1. User uploads media
    const media = await createMediaItem({ userId: 'user_1' });

    // 2. Media appears in moderation queue
    const queueRes = await fetch('/api/admin/moderation/queue');
    const { queue } = await queueRes.json();
    expect(queue.find(item => item.contentId === media.id)).toBeTruthy();

    // 3. Moderator approves
    await fetch(`/api/admin/moderation/${media.id}/approve`, { method: 'POST' });

    // 4. Media visible on site
    const publicMedia = await fetch(`/api/media/${media.id}`);
    expect(publicMedia.status).toBe(200);

    // 5. Audit log created
    const auditRes = await fetch(`/api/admin/audit?action=CONTENT_APPROVED`);
    const { logs } = await auditRes.json();
    expect(logs[0].resourceId).toBe(media.id);
  });

  test('Role-based access enforcement', async () => {
    // Committee leader can access own committee
    const res1 = await fetch('/api/admin/committees/health', {
      headers: { Authorization: `Bearer ${committeeLeaderToken}` }
    });
    expect(res1.status).toBe(200);

    // Committee leader cannot access other committee
    const res2 = await fetch('/api/admin/committees/governance', {
      headers: { Authorization: `Bearer ${committeeLeaderToken}` }
    });
    expect(res2.status).toBe(403);

    // Board chair can access all committees
    const res3 = await fetch('/api/admin/committees/governance', {
      headers: { Authorization: `Bearer ${boardChairToken}` }
    });
    expect(res3.status).toBe(200);
  });
});
```

---

### Manual Testing Checklist

#### User Management
- [ ] WEB_STEWARD can create users with any role
- [ ] BOARD_CHAIR can create users up to COMMITTEE_LEADER
- [ ] BOARD_CHAIR cannot create WEB_STEWARD
- [ ] SUPPORT_STAFF can view users but not edit
- [ ] Cannot delete own account
- [ ] Cannot change own role
- [ ] Bulk email sends to all selected users
- [ ] User search and filters work correctly
- [ ] Pagination works with large user lists

#### Content Moderation
- [ ] Content appears in moderation queue when created
- [ ] CONTENT_MODERATOR can approve/reject/edit content
- [ ] Approved content becomes visible immediately
- [ ] Rejected content hidden with reason logged
- [ ] Edited content shows changes and moderator notes
- [ ] Flagged content appears with flag count
- [ ] Moderation queue tabs filter correctly

#### System Settings
- [ ] WEB_STEWARD can modify all settings
- [ ] BOARD_CHAIR can view but not edit settings
- [ ] Feature flag toggles enable/disable features immediately
- [ ] Email test button sends test email
- [ ] Setting changes are audited
- [ ] Encrypted settings (passwords) remain secure

#### Audit Logs
- [ ] All admin actions logged correctly
- [ ] Filters work (date range, action type, user, resource)
- [ ] Detail view shows complete action information
- [ ] Export creates downloadable file
- [ ] SUPPORT_STAFF can view relevant logs only
- [ ] IP address and user agent captured

#### Permissions & Access Control
- [ ] Each role sees correct navigation items
- [ ] Restricted pages return 403 for unauthorized roles
- [ ] API endpoints enforce permission checks
- [ ] Committee leaders see only their committees
- [ ] Support staff has read-only access everywhere

#### Notifications
- [ ] Admins receive notifications for pending actions
- [ ] Notification badge shows unread count
- [ ] Clicking notification navigates to correct page
- [ ] Mark as read updates status
- [ ] Notifications disappear after expiry

#### Reports
- [ ] Reports generate with correct data
- [ ] Export formats (PDF, CSV) download correctly
- [ ] Date range filters apply correctly
- [ ] Committee-specific reports show only committee data
- [ ] Report generation is audited

#### UI/UX
- [ ] Admin panel responsive on mobile/tablet
- [ ] Loading states show during async operations
- [ ] Error messages clear and helpful
- [ ] Success confirmations shown for actions
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated with all new models
- [ ] Database migrations tested in staging
- [ ] Seed scripts created for initial data
- [ ] All API endpoints implemented and tested
- [ ] Permission system working correctly
- [ ] Audit logging functional
- [ ] UI components complete
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Code review completed
- [ ] Documentation updated

### Deployment Steps

1. **Database Migration**
   ```bash
   # Backup production database
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

   # Run Prisma migration
   npx prisma migrate deploy

   # Verify migration
   npx prisma db pull
   ```

2. **Seed System Settings**
   ```bash
   npm run seed:admin
   ```

3. **Deploy Application**
   ```bash
   # Build application
   npm run build

   # Deploy to hosting platform
   vercel deploy --prod
   # or
   npm run deploy
   ```

4. **Verify Admin Access**
   - Login as WEB_STEWARD
   - Navigate to /dashboard/admin
   - Verify all admin features accessible

5. **Create Initial Administrators**
   - Create BOARD_CHAIR accounts for board members
   - Create COMMITTEE_LEADER accounts for committee leads
   - Create CONTENT_MODERATOR accounts
   - Create SUPPORT_STAFF accounts

6. **Configure System Settings**
   - Set email SMTP settings
   - Enable appropriate feature flags
   - Configure payment integrations (if applicable)

---

### Post-Deployment

- [ ] Admin panel accessible at /dashboard/admin
- [ ] All roles can login and see appropriate views
- [ ] Permissions enforced correctly
- [ ] Audit logs recording all actions
- [ ] Content moderation queue working
- [ ] System settings can be modified
- [ ] Reports generate correctly
- [ ] Notifications being sent
- [ ] No errors in production logs
- [ ] Performance metrics acceptable (<2s page load)
- [ ] Database queries optimized (check slow query log)

### Monitoring

Set up monitoring for:
- **Error Tracking:** Sentry or similar for production errors
- **Performance Monitoring:** Track admin panel page load times
- **Audit Log Monitoring:** Alert on suspicious activity patterns
- **Database Performance:** Monitor slow queries, connection pool
- **API Response Times:** Alert if endpoints exceed 3s response time

---

## Security Considerations

### Authentication & Authorization
- All admin routes require authentication (middleware check)
- Permission checks on both UI and API levels
- Session tokens expire after 24 hours of inactivity
- Cannot modify own role or permissions
- Cannot delete own account

### Audit & Compliance
- All administrative actions logged with timestamp, user, IP address
- Audit logs immutable (no delete, only insert)
- Logs retained for minimum 2 years
- Export capability for compliance reporting
- IP address geolocation logging for security alerts

### Data Protection
- Sensitive settings (passwords, API keys) encrypted at rest
- HTTPS enforced for all admin panel pages
- CSRF protection on all forms
- Rate limiting on API endpoints (100 req/min per user)
- SQL injection prevention (Prisma parameterized queries)

### Content Moderation
- Flagged content requires admin review before deletion
- Moderation actions reversible (soft delete with history)
- Moderator notes private (not visible to content creator)
- Bulk actions require confirmation step

---

## Future Enhancements

### Phase 2 Features (Post-Launch)

1. **Advanced Analytics Dashboard**
   - Real-time user activity graphs
   - Cohort analysis and retention metrics
   - Revenue analytics (subscription trends)
   - Geographic user distribution map

2. **Automated Content Moderation**
   - AI-based content filtering for inappropriate content
   - Auto-approval for trusted users (based on history)
   - Sentiment analysis for forum posts
   - Image recognition for media uploads

3. **Scheduled Tasks & Automation**
   - Scheduled report generation and email delivery
   - Automated user onboarding sequences
   - Bulk user actions with scheduling
   - Automated covenant re-acceptance reminders

4. **Advanced User Management**
   - User import/export (CSV, JSON)
   - User merge functionality (duplicate accounts)
   - Password reset on behalf of users
   - Impersonate user (for support purposes)

5. **Notification System Enhancement**
   - In-app notification center
   - WebSocket real-time updates
   - Customizable notification preferences per role
   - Slack/Discord integration for admin alerts

6. **Role & Permission Customization**
   - Custom role creation beyond predefined roles
   - Granular permission assignment per user
   - Team-based access (multiple admins per committee)
   - Temporary permission grants (time-limited)

7. **Audit Log Enhancements**
   - Visual timeline of user actions
   - Diff view for before/after changes
   - Anomaly detection and security alerts
   - Compliance report templates (SOC2, GDPR)

8. **Multi-Language Support**
   - Admin panel internationalization
   - Language-specific content moderation
   - Multilingual email templates

---

## API Rate Limits

To prevent abuse and ensure platform stability:

| Endpoint | Rate Limit | Notes |
|----------|------------|-------|
| GET /api/admin/users | 100/min | Higher for search queries |
| POST /api/admin/users | 10/min | Prevent bulk user creation spam |
| PATCH /api/admin/users/[id] | 50/min | Allow reasonable editing |
| POST /api/admin/users/bulk-action | 5/min | Bulk actions are resource-intensive |
| GET /api/admin/moderation/queue | 100/min | Frequent polling expected |
| POST /api/admin/moderation/*/approve | 50/min | Moderators work quickly |
| GET /api/admin/audit | 50/min | Large result sets |
| GET /api/admin/audit/export | 5/min | Expensive operation |
| PATCH /api/admin/settings/* | 20/min | Settings changes infrequent |
| POST /api/admin/reports/generate | 10/min | Report generation expensive |

Rate limits enforced per user, per IP address. Exceeding limits returns:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "limit": 100,
  "used": 101
}
```

---

## Performance Optimization

### Database Indexing
All audit log queries optimized with indexes:
```prisma
@@index([userId, timestamp])
@@index([action])
@@index([resourceType])
```

### Caching Strategy
- System settings cached in Redis (TTL: 5 minutes)
- User permissions cached per session
- Dashboard analytics cached (TTL: 1 minute)
- Moderation queue counts cached (TTL: 30 seconds)

### Pagination
All list endpoints paginated:
- Default page size: 50 items
- Max page size: 100 items
- Cursor-based pagination for large datasets

### Query Optimization
- Use `select` to limit returned fields
- Batch database queries where possible
- Eager load relations to prevent N+1 queries

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.

This comprehensive admin panel will provide BRITE POOL with enterprise-grade administrative capabilities while maintaining strict security and audit compliance. The role-based access control ensures appropriate separation of duties, while the complete audit trail provides legal protection and operational transparency.
