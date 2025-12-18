# Specification: Member Dashboard Foundation

**Feature ID:** F003
**Priority:** Critical
**Effort:** Medium (1 week / 7 days)
**Dependencies:** User Authentication (F002), Membership Contract Agreement (F001)
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
Implement a personalized member dashboard that serves as the central hub for all authenticated members after covenant acceptance. The dashboard provides at-a-glance status of membership details, participation metrics, subscription tier, and quick access to all member features. This is the primary landing page after authentication and contract acceptance.

### Key Requirements
- Personalized greeting and member information display
- Covenant acceptance status indicator with version tracking
- Subscription tier and status display
- User role badge display
- Participation summary showing total hours logged and equity units earned
- Quick action cards for common tasks
- Recent activity feed (last 7 days)
- Navigation cards to all major member features
- Responsive design for mobile, tablet, and desktop
- Real-time data fetching with loading states

### Success Metrics
- Dashboard loads within 2 seconds for 95% of requests
- 100% of authenticated members see accurate covenant status
- Participation metrics match Sacred Ledger data with zero discrepancies
- All quick action links navigate to correct feature pages
- Mobile responsive layout tested on iOS and Android
- Zero broken navigation links or missing data fields

---

## User Flows

### Flow 1: First-Time User After Contract Acceptance

```
1. New user completes registration and logs in
2. User redirected to /contract-review
3. User accepts membership contract (F001)
4. System redirects to /dashboard (first visit)
5. Dashboard displays:
   - Welcome message: "Welcome to BRITE POOL, [Name]!"
   - Covenant status: "Accepted v1.0.0 on [date]"
   - Role badge: "STEWARD" (default)
   - Subscription: "FREE" tier
   - Participation: 0 hours, 0 equity units
   - Quick Actions: "Complete Profile", "Join Committee", "Browse Courses"
   - Recent Activity: Empty state with message "Get started by exploring features"
   - Navigation Cards: Forums, Events, Tasks, Sacred Ledger, etc.
6. User clicks "Complete Profile" quick action
7. User redirected to /dashboard/profile
8. User fills out profile information
9. User returns to dashboard
10. Dashboard updates with completed profile status
```

### Flow 2: Returning Active Member

```
1. Active member logs in
2. System checks covenant status (middleware)
3. Covenant valid → User redirected to /dashboard
4. Dashboard loads with personalized data:
   - Greeting: "Welcome back, [Name]"
   - Covenant status: "Accepted v1.0.0" (green indicator)
   - Role: "COMMITTEE_LEADER" (with badge icon)
   - Subscription: "PREMIUM" (with upgrade option if not PLATINUM)
   - Participation summary:
     - Total hours: 85 hours
     - Equity units: 8.5 units
     - Last logged: 2 days ago
   - Quick Actions based on role:
     - "Review Committee Tasks" (committee leader)
     - "Log Participation Hours"
     - "Schedule Event"
   - Recent Activity Feed:
     - "You completed task: Organize monthly meeting" (3 hours ago)
     - "Your participation entry was approved" (1 day ago)
     - "New announcement: Q1 Budget Meeting" (2 days ago)
     - "You joined committee: Wealth Board" (5 days ago)
   - Navigation Cards: All features accessible
5. User clicks on participation summary card
6. User redirected to /dashboard/participation (Sacred Ledger)
7. User views detailed participation history
```

### Flow 3: Member with Outdated Covenant Version

```
1. Existing member logs in
2. Admin has published new covenant version (v1.1.0)
3. System checks: user.covenantVersion (v1.0.0) != activeVersion (v1.1.0)
4. Middleware redirects to /contract-review
5. User sees message: "Contract Updated - Please Review"
6. User scrolls and re-accepts contract
7. System updates user.covenantVersion to v1.1.0
8. User redirected to /dashboard
9. Dashboard displays updated covenant status: "Accepted v1.1.0"
10. User can now access all features normally
```

### Flow 4: Admin User Dashboard View

```
1. Admin (WEB_STEWARD or BOARD_CHAIR) logs in
2. User redirected to /dashboard
3. Dashboard displays standard member view PLUS admin-specific cards:
   - Quick Actions:
     - "Admin Panel" (link to /dashboard/admin)
     - "Manage Contracts" (link to /dashboard/admin/contracts)
     - "View All Committees" (link to /dashboard/admin/committees)
     - "User Management" (link to /dashboard/admin/users)
   - Admin Statistics Card:
     - Total members: 247
     - Pending approvals: 12
     - Active committees: 5
     - Recent signups: 8 (last 7 days)
   - Recent System Activity:
     - "New user registered: john@example.com" (1 hour ago)
     - "Contract v1.1.0 published" (2 days ago)
     - "Committee created: Operations Board" (5 days ago)
4. Admin clicks "Admin Panel"
5. User redirected to /dashboard/admin
6. Admin sees full admin dashboard with detailed controls
```

### Flow 5: Mobile User Experience

```
1. Member opens site on mobile device
2. User logs in (mobile-optimized login form)
3. User redirected to /dashboard
4. Dashboard displays mobile-responsive layout:
   - Single column design
   - Stacked cards (no grid)
   - Collapsible sections for recent activity
   - Bottom navigation bar for quick access
   - Hamburger menu for full navigation
   - Touch-optimized quick action buttons
5. User swipes to scroll through dashboard sections
6. User taps "Log Hours" quick action
7. Mobile-optimized form opens
8. User logs participation hours
9. User returns to dashboard
10. Participation summary updates in real-time
```

---

## Database Schema

### Existing Models (from Prisma schema)

The dashboard utilizes existing models without requiring schema changes:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  role          UserRole  @default(STEWARD)

  // Covenant & Membership
  covenantAcceptedAt  DateTime?
  covenantVersion     String?
  covenantIpAddress   String?

  // Subscription
  subscriptionTier    SubscriptionTier @default(FREE)
  subscriptionStatus  SubscriptionStatus @default(INACTIVE)

  lastLoginAt   DateTime?

  // Relations
  profile       UserProfile?
  committees    CommitteeMember[]
  tasks         Task[]
  participationLogs ParticipationLog[]
  forumPosts    ForumPost[]
  eventRegistrations EventRegistration[]

  @@index([email])
  @@index([role])
}

model UserProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  bio             String?
  phone           String?
  location        String?

  // Sacred Ledger
  totalEquityUnits Float   @default(0)
  totalHoursLogged Float   @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ParticipationLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  hours       Float
  description String
  category    String
  status      ParticipationStatus @default(PENDING)

  approvedBy  String?
  approvedAt  DateTime?

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([status])
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    TaskPriority @default(MEDIUM)

  assignedToId String?
  assignedTo   User?     @relation(fields: [assignedToId], references: [id])

  committeeId  String?
  committee    Committee? @relation(fields: [committeeId], references: [id])

  dueDate      DateTime?
  completedAt  DateTime?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([assignedToId])
  @@index([status])
}

enum UserRole {
  WEB_STEWARD
  BOARD_CHAIR
  COMMITTEE_LEADER
  CONTENT_MODERATOR
  SUPPORT_STAFF
  STEWARD
  PARTNER
  RESIDENT
}

enum SubscriptionTier {
  FREE
  BASIC
  PREMIUM
  PLATINUM
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  PAST_DUE
  CANCELLED
}
```

### No Schema Changes Required

The dashboard is a read-only aggregation view that pulls data from existing models. No new tables or fields are needed.

---

## API Endpoints

### 1. GET /api/dashboard/overview

**Purpose:** Fetch comprehensive dashboard data for authenticated user

**Authentication:** Required (any authenticated user)

**Response:**
```json
{
  "user": {
    "id": "clx123...",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "COMMITTEE_LEADER",
    "subscriptionTier": "PREMIUM",
    "subscriptionStatus": "ACTIVE",
    "covenantAcceptedAt": "2025-12-01T10:00:00Z",
    "covenantVersion": "1.0.0",
    "lastLoginAt": "2025-12-17T08:30:00Z"
  },
  "profile": {
    "totalEquityUnits": 8.5,
    "totalHoursLogged": 85.0,
    "bio": "Passionate about community building...",
    "location": "Bozeman, MT"
  },
  "covenant": {
    "currentVersion": "1.0.0",
    "userVersion": "1.0.0",
    "needsReAcceptance": false,
    "acceptedAt": "2025-12-01T10:00:00Z"
  },
  "participation": {
    "totalHours": 85.0,
    "totalEquityUnits": 8.5,
    "pendingEntries": 2,
    "lastLoggedAt": "2025-12-15T14:20:00Z",
    "recentApprovals": 1
  },
  "committees": [
    {
      "id": "comm_wealth",
      "name": "Wealth Board",
      "role": "LEADER",
      "memberCount": 8,
      "upcomingMeetings": 1
    }
  ],
  "tasks": {
    "total": 12,
    "todo": 5,
    "inProgress": 3,
    "completed": 4,
    "overdue": 1
  },
  "quickActions": [
    {
      "id": "log_hours",
      "label": "Log Participation Hours",
      "icon": "Clock",
      "href": "/dashboard/participation/log",
      "priority": 1
    },
    {
      "id": "review_tasks",
      "label": "Review Committee Tasks",
      "icon": "CheckSquare",
      "href": "/dashboard/committees/wealth",
      "priority": 2
    }
  ]
}
```

**Error Cases:**
- User not authenticated → 401
- User covenant not accepted → 403 (should be caught by middleware)

---

### 2. GET /api/dashboard/activity

**Purpose:** Fetch recent activity feed for user (last 7 days)

**Authentication:** Required

**Query Parameters:**
- `limit` (optional, default: 10): Number of items to return
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "activities": [
    {
      "id": "act_1",
      "type": "TASK_COMPLETED",
      "title": "You completed task: Organize monthly meeting",
      "description": "Wealth Board meeting scheduled for Dec 20",
      "timestamp": "2025-12-17T05:00:00Z",
      "relatedLink": "/dashboard/tasks/task_123",
      "icon": "CheckCircle",
      "iconColor": "green"
    },
    {
      "id": "act_2",
      "type": "PARTICIPATION_APPROVED",
      "title": "Your participation entry was approved",
      "description": "10 hours for 'Budget planning workshop'",
      "timestamp": "2025-12-16T10:00:00Z",
      "relatedLink": "/dashboard/participation",
      "icon": "ThumbsUp",
      "iconColor": "blue"
    },
    {
      "id": "act_3",
      "type": "ANNOUNCEMENT",
      "title": "New announcement: Q1 Budget Meeting",
      "description": "All board members invited to budget planning session",
      "timestamp": "2025-12-15T09:00:00Z",
      "relatedLink": "/dashboard/announcements/ann_456",
      "icon": "Megaphone",
      "iconColor": "purple"
    }
  ],
  "total": 15,
  "hasMore": true
}
```

**Activity Types:**
- `TASK_COMPLETED`
- `TASK_ASSIGNED`
- `PARTICIPATION_APPROVED`
- `PARTICIPATION_REJECTED`
- `COMMITTEE_JOINED`
- `EVENT_REGISTERED`
- `ANNOUNCEMENT`
- `COURSE_COMPLETED`

---

### 3. GET /api/dashboard/stats (Admin Only)

**Purpose:** Fetch system-wide statistics for admin users

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Response:**
```json
{
  "members": {
    "total": 247,
    "newThisWeek": 8,
    "activeThisMonth": 189
  },
  "pendingApprovals": {
    "participationLogs": 12,
    "eventRegistrations": 5
  },
  "committees": {
    "total": 5,
    "totalMembers": 47
  },
  "recentActivity": [
    {
      "type": "USER_REGISTERED",
      "description": "New user registered: john@example.com",
      "timestamp": "2025-12-17T07:00:00Z"
    },
    {
      "type": "CONTRACT_PUBLISHED",
      "description": "Contract v1.1.0 published",
      "timestamp": "2025-12-15T12:00:00Z"
    }
  ]
}
```

**Error Cases:**
- User not authenticated → 401
- User not admin → 403

---

## UI Components

### 1. Main Dashboard Page

**Location:** `app/dashboard/page.tsx`

**Layout Structure:**
```tsx
<DashboardLayout>
  <DashboardHeader user={user} />

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
    {/* Row 1: Key Status Cards */}
    <CovenantStatusCard covenant={covenantData} />
    <SubscriptionCard subscription={userData} />
    <ParticipationSummaryCard participation={participationData} />

    {/* Row 2: Quick Actions */}
    <QuickActionsCard actions={quickActions} className="lg:col-span-2" />
    <CommitteeSummaryCard committees={committeesData} />

    {/* Row 3: Activity & Navigation */}
    <RecentActivityCard activities={activities} className="lg:col-span-2" />
    <NavigationLinksCard />

    {/* Admin Only: System Stats */}
    {isAdmin && (
      <AdminStatsCard stats={adminStats} className="lg:col-span-3" />
    )}
  </div>
</DashboardLayout>
```

**Component Hierarchy:**
- `DashboardLayout` (wrapper with sidebar + header)
  - `DashboardHeader`
    - Greeting message
    - User avatar
    - Role badge
  - `CovenantStatusCard`
    - Acceptance status indicator
    - Version number
    - Date accepted
  - `SubscriptionCard`
    - Current tier display
    - Status indicator
    - Upgrade button (if not PLATINUM)
  - `ParticipationSummaryCard`
    - Total hours logged
    - Total equity units
    - Last activity date
    - Quick link to Sacred Ledger
  - `QuickActionsCard`
    - Role-based action buttons
    - Icon + label
    - Click navigates to feature
  - `CommitteeSummaryCard`
    - List of user's committees
    - Role in each committee
    - Upcoming meetings count
  - `RecentActivityCard`
    - Timeline of last 7 days
    - Activity type icons
    - Links to related items
  - `NavigationLinksCard`
    - Grid of feature icons
    - Forums, Events, Tasks, etc.
  - `AdminStatsCard` (admin only)
    - System metrics
    - Pending approvals
    - Quick admin links

---

### 2. Dashboard Header Component

**Location:** `app/components/dashboard/DashboardHeader.tsx`

**Component Code:**
```tsx
import { User } from '@prisma/client';
import { getRoleBadgeStyles } from '@/lib/utils/roles';

interface DashboardHeaderProps {
  user: {
    name: string;
    role: string;
    lastLoginAt?: Date;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const greeting = getGreeting(); // "Good morning", "Good afternoon", etc.
  const badgeStyles = getRoleBadgeStyles(user.role);

  return (
    <header className="bg-stone-warm border-b border-stone p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-earth-brown">
            {greeting}, {user.name}
          </h1>
          {user.lastLoginAt && (
            <p className="text-sm text-earth-brown-light mt-1">
              Last login: {formatDate(user.lastLoginAt)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStyles}`}
          >
            {user.role.replace('_', ' ')}
          </span>
          <UserAvatar name={user.name} />
        </div>
      </div>
    </header>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
```

---

### 3. Covenant Status Card

**Location:** `app/components/dashboard/CovenantStatusCard.tsx`

**Visual Design:**
- Green check icon if accepted and current
- Warning icon if version mismatch
- Red X icon if not accepted (shouldn't happen due to middleware)
- Display version number and acceptance date

**Component Code:**
```tsx
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface CovenantStatusCardProps {
  covenant: {
    currentVersion: string;
    userVersion: string | null;
    acceptedAt: Date | null;
    needsReAcceptance: boolean;
  };
}

export function CovenantStatusCard({ covenant }: CovenantStatusCardProps) {
  const isAccepted = covenant.userVersion === covenant.currentVersion;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-earth-brown">
          Covenant Status
        </h3>
        {isAccepted ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-earth-brown-light">Version:</span>
          <span className="font-medium text-earth-dark">
            {covenant.userVersion || 'Not Accepted'}
          </span>
        </div>

        {covenant.acceptedAt && (
          <div className="flex justify-between text-sm">
            <span className="text-earth-brown-light">Accepted:</span>
            <span className="font-medium text-earth-dark">
              {formatDate(covenant.acceptedAt)}
            </span>
          </div>
        )}

        {covenant.needsReAcceptance && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="text-sm text-amber-800">
              New contract version available. Please review and accept.
            </p>
            <a
              href="/contract-review"
              className="text-sm text-amber-900 underline mt-2 inline-block"
            >
              Review Now
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 4. Participation Summary Card

**Location:** `app/components/dashboard/ParticipationSummaryCard.tsx`

**Visual Design:**
- Large numbers for hours and units
- Progress indicator (visual representation of equity growth)
- Last activity timestamp
- Link to full Sacred Ledger

**Component Code:**
```tsx
import { Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface ParticipationSummaryCardProps {
  participation: {
    totalHours: number;
    totalEquityUnits: number;
    lastLoggedAt: Date | null;
    pendingEntries: number;
  };
}

export function ParticipationSummaryCard({ participation }: ParticipationSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-earth-brown">
          Participation Summary
        </h3>
        <TrendingUp className="w-6 h-6 text-earth-green" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-earth-brown-light">Total Hours</p>
            <p className="text-3xl font-bold text-earth-dark">
              {participation.totalHours}
            </p>
          </div>
          <div>
            <p className="text-sm text-earth-brown-light">Equity Units</p>
            <p className="text-3xl font-bold text-earth-green">
              {participation.totalEquityUnits.toFixed(1)}
            </p>
          </div>
        </div>

        {participation.lastLoggedAt && (
          <div className="flex items-center gap-2 text-sm text-earth-brown-light">
            <Clock className="w-4 h-4" />
            <span>Last logged: {formatRelativeTime(participation.lastLoggedAt)}</span>
          </div>
        )}

        {participation.pendingEntries > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="text-sm text-amber-800">
              {participation.pendingEntries} entry(ies) pending approval
            </p>
          </div>
        )}

        <Link
          href="/dashboard/participation"
          className="block w-full text-center py-2 px-4 bg-earth-brown text-white rounded hover:bg-earth-dark transition"
        >
          View Full Ledger
        </Link>
      </div>
    </div>
  );
}
```

---

### 5. Quick Actions Card

**Location:** `app/components/dashboard/QuickActionsCard.tsx`

**Features:**
- Role-based action buttons (dynamically generated)
- Icon + label for each action
- Click navigates to relevant page
- Responsive grid layout

**Component Code:**
```tsx
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  priority: number;
}

interface QuickActionsCardProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActionsCard({ actions, className }: QuickActionsCardProps) {
  // Sort by priority
  const sortedActions = [...actions].sort((a, b) => a.priority - b.priority);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-stone p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-earth-brown mb-4">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sortedActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.id}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-stone-warm hover:bg-stone-medium rounded-lg transition group"
            >
              <Icon className="w-6 h-6 text-earth-brown group-hover:text-earth-dark" />
              <span className="text-xs text-center text-earth-brown group-hover:text-earth-dark">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 6. Recent Activity Feed

**Location:** `app/components/dashboard/RecentActivityCard.tsx`

**Features:**
- Timeline-style list of recent events
- Activity type icons (different colors)
- Clickable links to related items
- "Load More" button for pagination
- Empty state if no activity

**Component Code:**
```tsx
import { Activity } from '@/types/dashboard';
import { formatRelativeTime } from '@/lib/utils/dates';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

interface RecentActivityCardProps {
  activities: Activity[];
  className?: string;
}

export function RecentActivityCard({ activities, className }: RecentActivityCardProps) {
  if (activities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-stone p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-earth-brown mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-8 text-earth-brown-light">
          <p>No recent activity</p>
          <p className="text-sm mt-2">
            Get started by exploring member features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-stone p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-earth-brown mb-4">
        Recent Activity
      </h3>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = LucideIcons[activity.icon as keyof typeof LucideIcons] as any;

          return (
            <div key={activity.id} className="flex gap-3 items-start">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${activity.iconColor}-100`}>
                {Icon && <Icon className={`w-4 h-4 text-${activity.iconColor}-600`} />}
              </div>

              <div className="flex-1">
                {activity.relatedLink ? (
                  <Link
                    href={activity.relatedLink}
                    className="text-sm font-medium text-earth-dark hover:text-earth-brown"
                  >
                    {activity.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-earth-dark">
                    {activity.title}
                  </p>
                )}

                {activity.description && (
                  <p className="text-xs text-earth-brown-light mt-1">
                    {activity.description}
                  </p>
                )}

                <p className="text-xs text-earth-brown-light mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-earth-brown hover:text-earth-dark border border-stone rounded hover:bg-stone-warm transition">
        Load More
      </button>
    </div>
  );
}
```

---

## Implementation Details

### Phase 1: API Development (Days 1-2)

1. **Create Dashboard API Route** (`app/api/dashboard/overview/route.ts`)
   - Fetch user data with profile relation
   - Query participation logs (aggregate hours, calculate units)
   - Query committees (user memberships)
   - Query tasks (assigned to user)
   - Check covenant status vs. active version
   - Generate role-based quick actions
   - Return comprehensive dashboard data object

2. **Create Activity Feed API** (`app/api/dashboard/activity/route.ts`)
   - Query recent events across multiple tables:
     - Tasks (completed, assigned)
     - Participation logs (approved, rejected)
     - Committee memberships (joined)
     - Event registrations
     - Announcements (published)
   - Sort by timestamp (descending)
   - Paginate results
   - Transform to unified activity format

3. **Create Admin Stats API** (`app/api/dashboard/stats/route.ts`)
   - Admin-only endpoint (role check)
   - Aggregate member counts
   - Count pending approvals
   - Query recent system events
   - Return admin-specific metrics

4. **Helper Functions** (`lib/dashboard/helpers.ts`)
   - `generateQuickActions(user)` - Returns role-based actions
   - `calculateEquityUnits(hours)` - Converts hours to units (÷10)
   - `formatActivityItem(event)` - Transforms DB records to activity objects
   - `getCovenantStatus(user)` - Checks version match

### Phase 2: UI Components (Days 3-5)

1. **Dashboard Layout** (`app/dashboard/layout.tsx`)
   - Create main layout wrapper
   - Add sidebar navigation
   - Add header with user info
   - Mobile responsive design

2. **Main Dashboard Page** (`app/dashboard/page.tsx`)
   - Server component for initial data fetch
   - Grid layout for cards
   - Responsive breakpoints
   - Loading states

3. **Card Components** (Days 3-4)
   - `DashboardHeader.tsx`
   - `CovenantStatusCard.tsx`
   - `SubscriptionCard.tsx`
   - `ParticipationSummaryCard.tsx`
   - `QuickActionsCard.tsx`
   - `CommitteeSummaryCard.tsx`
   - `RecentActivityCard.tsx`
   - `NavigationLinksCard.tsx`
   - `AdminStatsCard.tsx` (admin only)

4. **Styling** (Day 5)
   - Apply biophilic design system
   - Earth tones (browns, greens, stone colors)
   - Card shadows and borders
   - Hover states and transitions
   - Icon colors and sizing

### Phase 3: Data Integration & Testing (Days 6-7)

1. **API Integration** (Day 6)
   - Connect components to API endpoints
   - Add error handling
   - Add loading skeletons
   - Test data fetching

2. **Role-Based Logic** (Day 6)
   - Implement quick actions generation
   - Show/hide admin cards based on role
   - Test with different user roles

3. **Responsive Design Testing** (Day 7)
   - Test on mobile (iOS/Android)
   - Test on tablet
   - Test on desktop
   - Fix layout issues

4. **Performance Optimization** (Day 7)
   - Add API response caching
   - Optimize database queries
   - Lazy load activity feed
   - Measure load times

### Phase 4: Final Polish & Deployment Prep (Day 7)

1. **Edge Cases**
   - Handle users with no committees
   - Handle users with no participation logs
   - Handle users with no tasks
   - Empty state designs

2. **Accessibility**
   - ARIA labels for cards
   - Keyboard navigation
   - Screen reader testing
   - Focus indicators

3. **Documentation**
   - Component documentation
   - API endpoint documentation
   - Deployment notes

---

## Testing Requirements

### Unit Tests

**API Endpoint Tests:**
```typescript
// Test dashboard overview API
describe('GET /api/dashboard/overview', () => {
  test('returns complete dashboard data for authenticated user', async () => {
    const user = await createTestUser();
    const token = await generateToken(user);

    const res = await fetch('/api/dashboard/overview', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.user).toBeDefined();
    expect(data.profile).toBeDefined();
    expect(data.participation).toBeDefined();
    expect(data.quickActions).toBeInstanceOf(Array);
  });

  test('calculates equity units correctly (10 hours = 1 unit)', async () => {
    const user = await createTestUser();
    await createParticipationLog(user.id, { hours: 25, status: 'APPROVED' });

    const res = await fetch('/api/dashboard/overview', {
      headers: { 'Authorization': `Bearer ${await generateToken(user)}` }
    });

    const data = await res.json();
    expect(data.participation.totalHours).toBe(25);
    expect(data.participation.totalEquityUnits).toBe(2.5);
  });

  test('returns 401 for unauthenticated requests', async () => {
    const res = await fetch('/api/dashboard/overview');
    expect(res.status).toBe(401);
  });
});

// Test activity feed API
describe('GET /api/dashboard/activity', () => {
  test('returns recent activity in chronological order', async () => {
    const user = await createTestUser();

    // Create test activities
    await completeTask(user.id, 'Task 1');
    await approveParticipation(user.id);

    const res = await fetch('/api/dashboard/activity', {
      headers: { 'Authorization': `Bearer ${await generateToken(user)}` }
    });

    const data = await res.json();
    expect(data.activities).toBeInstanceOf(Array);
    expect(data.activities[0].timestamp).toBeDefined();

    // Check chronological order (newest first)
    for (let i = 1; i < data.activities.length; i++) {
      expect(new Date(data.activities[i-1].timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(data.activities[i].timestamp).getTime());
    }
  });

  test('supports pagination with limit and offset', async () => {
    const user = await createTestUser();

    const res = await fetch('/api/dashboard/activity?limit=5&offset=5', {
      headers: { 'Authorization': `Bearer ${await generateToken(user)}` }
    });

    const data = await res.json();
    expect(data.activities.length).toBeLessThanOrEqual(5);
  });
});
```

**Component Tests:**
```typescript
// Test CovenantStatusCard
describe('CovenantStatusCard', () => {
  test('displays green check icon when covenant is accepted and current', () => {
    const covenant = {
      currentVersion: '1.0.0',
      userVersion: '1.0.0',
      acceptedAt: new Date(),
      needsReAcceptance: false
    };

    const { getByText, container } = render(
      <CovenantStatusCard covenant={covenant} />
    );

    expect(getByText('1.0.0')).toBeInTheDocument();
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
  });

  test('displays warning icon when version mismatch', () => {
    const covenant = {
      currentVersion: '1.1.0',
      userVersion: '1.0.0',
      acceptedAt: new Date(),
      needsReAcceptance: true
    };

    const { getByText, container } = render(
      <CovenantStatusCard covenant={covenant} />
    );

    expect(getByText(/new contract version available/i)).toBeInTheDocument();
    expect(container.querySelector('.text-amber-600')).toBeInTheDocument();
  });
});

// Test ParticipationSummaryCard
describe('ParticipationSummaryCard', () => {
  test('displays hours and equity units correctly', () => {
    const participation = {
      totalHours: 85,
      totalEquityUnits: 8.5,
      lastLoggedAt: new Date(),
      pendingEntries: 0
    };

    const { getByText } = render(
      <ParticipationSummaryCard participation={participation} />
    );

    expect(getByText('85')).toBeInTheDocument();
    expect(getByText('8.5')).toBeInTheDocument();
  });

  test('shows pending entries warning', () => {
    const participation = {
      totalHours: 85,
      totalEquityUnits: 8.5,
      lastLoggedAt: new Date(),
      pendingEntries: 3
    };

    const { getByText } = render(
      <ParticipationSummaryCard participation={participation} />
    );

    expect(getByText(/3 entry\(ies\) pending approval/i)).toBeInTheDocument();
  });
});
```

### Integration Tests

**End-to-End User Flows:**
```typescript
// Test full dashboard load flow
describe('Dashboard Integration', () => {
  test('authenticated user loads dashboard successfully', async () => {
    const user = await registerAndLoginUser();
    await acceptCovenant(user);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for data to load
    await page.waitForSelector('[data-testid="dashboard-header"]');

    // Verify all sections present
    expect(await page.$('[data-testid="covenant-status-card"]')).toBeTruthy();
    expect(await page.$('[data-testid="participation-summary-card"]')).toBeTruthy();
    expect(await page.$('[data-testid="quick-actions-card"]')).toBeTruthy();
    expect(await page.$('[data-testid="recent-activity-card"]')).toBeTruthy();
  });

  test('admin user sees admin-specific cards', async () => {
    const admin = await createAdminUser();
    await loginUser(admin);

    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="admin-stats-card"]');

    expect(await page.$('[data-testid="admin-stats-card"]')).toBeTruthy();
  });

  test('quick action links navigate correctly', async () => {
    const user = await registerAndLoginUser();
    await acceptCovenant(user);

    await page.goto('/dashboard');
    await page.click('[data-testid="quick-action-log-hours"]');

    expect(page.url()).toContain('/dashboard/participation/log');
  });
});
```

### Manual Testing Checklist

**Functional Testing:**
- [ ] Dashboard loads within 2 seconds for authenticated user
- [ ] Covenant status displays correct version and acceptance date
- [ ] Subscription tier and status displayed accurately
- [ ] User role badge shows correct role name
- [ ] Participation summary shows hours and equity units (10:1 ratio verified)
- [ ] Quick actions links navigate to correct pages
- [ ] Recent activity feed displays last 7 days of events
- [ ] Activity feed links to related items work
- [ ] Committee summary shows user's committees
- [ ] Navigation cards link to all major features
- [ ] Admin users see admin-specific statistics card
- [ ] Non-admin users do NOT see admin cards

**Responsive Design:**
- [ ] Desktop (1920x1080): Grid layout displays correctly
- [ ] Laptop (1366x768): Cards resize appropriately
- [ ] Tablet (iPad: 768x1024): Two-column layout
- [ ] Mobile (iPhone: 375x667): Single-column layout
- [ ] All text readable at all screen sizes
- [ ] Buttons and links touch-friendly on mobile
- [ ] No horizontal scrolling on any device

**Edge Cases:**
- [ ] User with no committees: Shows empty state
- [ ] User with no participation logs: Shows 0 hours, 0 units
- [ ] User with no recent activity: Shows empty state message
- [ ] User with many committees: Scrollable list
- [ ] User with pending covenant re-acceptance: Warning displayed
- [ ] User with expired subscription: Status shown correctly

**Performance:**
- [ ] Dashboard API response < 500ms
- [ ] Activity feed API response < 300ms
- [ ] Admin stats API response < 1s
- [ ] Total page load time < 2s (95th percentile)
- [ ] No console errors or warnings
- [ ] No memory leaks (check DevTools)

---

## Deployment Checklist

### Pre-Deployment

**Database:**
- [ ] Prisma schema is up to date (no changes needed for dashboard)
- [ ] All relations are properly indexed
- [ ] Test queries perform well with sample data

**API Routes:**
- [ ] `/api/dashboard/overview` implemented and tested
- [ ] `/api/dashboard/activity` implemented and tested
- [ ] `/api/dashboard/stats` implemented and tested (admin only)
- [ ] All API endpoints have proper authentication checks
- [ ] Error handling implemented for all endpoints

**UI Components:**
- [ ] All dashboard components created
- [ ] Components styled with biophilic design system
- [ ] Responsive design tested on all devices
- [ ] Loading states implemented
- [ ] Empty states designed and tested

**Testing:**
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing checklist completed
- [ ] Performance metrics measured and acceptable

**Documentation:**
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] README updated with dashboard info

### Deployment Steps

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Run Tests**
   ```bash
   npm run test
   npm run test:e2e
   ```

3. **Deploy to Staging**
   ```bash
   npm run deploy:staging
   ```

4. **Smoke Test Staging**
   - Login as regular user
   - Verify dashboard loads
   - Test all quick action links
   - Login as admin user
   - Verify admin cards appear

5. **Deploy to Production**
   ```bash
   npm run deploy:production
   ```

6. **Monitor Initial Deployment**
   - Watch error logs for first 30 minutes
   - Check response times in monitoring dashboard
   - Verify no increase in error rates

### Post-Deployment

**Verification:**
- [ ] Dashboard accessible at `/dashboard`
- [ ] All users can access dashboard after covenant acceptance
- [ ] API endpoints responding with correct data
- [ ] No 404 errors on navigation links
- [ ] Mobile users can navigate dashboard successfully
- [ ] Admin users see admin-specific content
- [ ] Performance metrics within acceptable range

**Monitoring:**
- [ ] Set up alerts for API response times > 2s
- [ ] Monitor error rates for dashboard routes
- [ ] Track user engagement with quick actions
- [ ] Monitor database query performance

**User Communication:**
- [ ] Announce new dashboard feature to members
- [ ] Provide quick tour of dashboard features
- [ ] Update user guide with dashboard documentation

---

## Future Enhancements

### Phase 2 Features (Post-Launch)

1. **Customizable Dashboard**
   - Allow users to rearrange cards
   - Show/hide specific sections
   - Save layout preferences

2. **Advanced Analytics**
   - Graphs of participation over time
   - Committee activity heatmaps
   - Comparison to community averages

3. **Notifications Center**
   - In-app notification bell icon
   - Unread count badge
   - Mark as read/unread
   - Notification preferences

4. **Goal Setting**
   - Set personal equity goals
   - Track progress toward goals
   - Achievement badges

5. **Social Features**
   - Recent posts from connections
   - Community highlights
   - Member spotlight

6. **Mobile App Integration**
   - Native mobile app with dashboard
   - Push notifications
   - Offline mode

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
