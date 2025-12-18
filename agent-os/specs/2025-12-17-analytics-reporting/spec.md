# Specification: Analytics & Reporting Dashboard

**Feature ID:** F023
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** Authentication (F002), Admin Panel (F022), All data-generating features (Events, Courses, Sacred Ledger, Subscriptions)
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
Implement a comprehensive analytics and reporting dashboard that provides real-time insights into member engagement, course completion rates, event attendance, subscription revenue, Sacred Ledger participation, and platform usage. The system enables data-driven decision making through interactive visualizations, custom report building, and exportable reports in multiple formats.

### Key Requirements
- Member engagement metrics dashboard with interactive charts
- Course completion rates and lesson-by-lesson analytics
- Event attendance tracking and trend analysis
- Subscription revenue reports with MRR/ARR tracking
- Sacred Ledger participation statistics and equity unit distribution
- Platform usage insights (page views, feature adoption, active users)
- Date range filtering with preset ranges (7d, 30d, 90d, 1y, custom)
- Custom report builder with drag-and-drop metrics
- Export functionality (CSV, PDF, JSON)
- Real-time data updates with automatic refresh
- Role-based access control (admin-only features)
- Mobile-responsive dashboard layouts
- Performance optimization for large datasets

### Success Metrics
- Dashboard loads in under 2 seconds with 10,000+ records
- All metrics calculated accurately with zero data discrepancies
- 100% of reports exportable in requested formats
- Custom reports saveable and shareable between admins
- Real-time updates reflect database changes within 30 seconds
- Mobile dashboard fully functional on tablets and phones

---

## User Flows

### Flow 1: Admin Views Analytics Dashboard

```
1. Admin navigates to /dashboard/analytics
2. Middleware verifies user has WEB_STEWARD or BOARD_CHAIR role
3. Dashboard loads with default view (last 30 days)
4. System fetches and aggregates metrics:
   - Total members (active vs inactive)
   - Member growth rate
   - Course enrollments and completions
   - Event registrations and attendance
   - Subscription revenue (MRR, ARR, churn)
   - Sacred Ledger participation hours
   - Platform usage statistics
5. Charts render with Chart.js/Recharts
6. Admin can interact with charts (hover for details, click to drill down)
7. Real-time updates show latest data every 30 seconds
```

### Flow 2: Admin Filters Data by Date Range

```
1. Admin on analytics dashboard
2. Clicks date range selector in top-right
3. Selects preset range (Last 7 days, Last 30 days, Last 90 days, Last Year)
   OR
   Opens custom date picker and selects start/end dates
4. System fetches filtered data → GET /api/analytics/metrics?startDate=X&endDate=Y
5. All charts and metrics update to reflect selected range
6. URL updates with query params for shareable links
7. Admin can reset to default view
```

### Flow 3: Admin Creates Custom Report

```
1. Admin navigates to /dashboard/analytics/reports/custom
2. Sees report builder interface with:
   - Available metrics library (left sidebar)
   - Report canvas (center)
   - Configuration panel (right sidebar)
3. Admin drags metrics from library to canvas:
   - Member Growth Chart
   - Course Completion Funnel
   - Revenue Breakdown Table
   - Sacred Ledger Top Contributors
4. Configures each metric:
   - Chart type (line, bar, pie, table)
   - Date range
   - Filters (committee, course, tier)
   - Sort order
5. Previews report in real-time
6. Clicks "Save Report" → POST /api/analytics/reports/custom
7. Names report "Q4 2025 Member Engagement"
8. Report saved and accessible from reports list
```

### Flow 4: Admin Exports Report

```
1. Admin viewing analytics dashboard or custom report
2. Clicks "Export" button in top-right
3. Selects format from dropdown:
   - CSV (for spreadsheet analysis)
   - PDF (for presentations)
   - JSON (for API integration)
4. System generates export → POST /api/analytics/export
5. Progress indicator shows export generation (may take 10-30s for large datasets)
6. Download link appears or file automatically downloads
7. Admin receives exported file with timestamped filename
   Example: britepool-analytics-2025-12-17.csv
```

### Flow 5: Committee Leader Views Limited Analytics

```
1. Committee leader navigates to /dashboard/committee/[slug]/analytics
2. Middleware verifies user is COMMITTEE_LEADER for that committee
3. System loads committee-specific analytics:
   - Committee member participation hours
   - Task completion rates
   - Event attendance for committee events
   - Top contributors in the committee
4. Charts render with restricted data (only their committee)
5. Limited export options available (CSV only, no financial data)
```

---

## Database Schema

### New Models

```prisma
model AnalyticsReport {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        ReportType @default(CUSTOM)

  // Report configuration
  config      Json     // Stores chart types, metrics, filters

  // Ownership
  createdById String
  createdBy   User     @relation("ReportsCreated", fields: [createdById], references: [id])

  // Sharing
  isPublic    Boolean  @default(false)
  sharedWith  String[] // Array of user IDs

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([createdById])
  @@index([type])
}

model AnalyticsCache {
  id          String   @id @default(cuid())
  metricKey   String   @unique // e.g., "member_count_30d"
  data        Json     // Cached metric data
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([metricKey])
  @@index([expiresAt])
}

model PageView {
  id          String   @id @default(cuid())
  userId      String?  // null for anonymous
  path        String
  referrer    String?
  userAgent   String?
  ipAddress   String?
  sessionId   String
  duration    Int?     // seconds on page
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([path])
  @@index([createdAt])
  @@index([sessionId])
}

model FeatureUsage {
  id          String   @id @default(cuid())
  userId      String
  feature     String   // e.g., "course_view", "event_register", "forum_post"
  metadata    Json?    // Additional context
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([feature])
  @@index([createdAt])
}

enum ReportType {
  DASHBOARD
  CUSTOM
  SCHEDULED
}
```

### Schema Updates

Add relation to User model:

```prisma
model User {
  // ... existing fields
  reportsCreated AnalyticsReport[] @relation("ReportsCreated")
}
```

---

## API Endpoints

### 1. GET /api/analytics/overview

**Purpose:** Fetch high-level overview metrics for dashboard

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR

**Query Parameters:**
```typescript
{
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  refresh?: boolean;  // Force cache refresh
}
```

**Response:**
```json
{
  "members": {
    "total": 247,
    "active": 189,
    "new": 12,
    "growthRate": 5.1,
    "byTier": {
      "FREE": 98,
      "BASIC": 67,
      "PREMIUM": 54,
      "PLATINUM": 28
    }
  },
  "engagement": {
    "avgSessionDuration": 847,
    "pageViewsTotal": 15234,
    "activeUsers7d": 143,
    "activeUsers30d": 189,
    "mostVisitedPages": [
      { "path": "/dashboard", "views": 3421 },
      { "path": "/courses", "views": 2156 }
    ]
  },
  "courses": {
    "totalCourses": 12,
    "totalEnrollments": 342,
    "completionRate": 68.5,
    "avgCompletionTime": 14.2,
    "topCourses": [
      {
        "id": "course_123",
        "title": "Regenerative Agriculture",
        "enrollments": 89,
        "completions": 67,
        "completionRate": 75.3
      }
    ]
  },
  "events": {
    "totalEvents": 24,
    "totalRegistrations": 456,
    "totalAttendance": 387,
    "attendanceRate": 84.9,
    "upcomingEvents": 8,
    "avgAttendeesPerEvent": 16.1
  },
  "revenue": {
    "mrr": 4235.00,
    "arr": 50820.00,
    "totalRevenue": 12450.00,
    "churnRate": 2.3,
    "ltv": 847.50,
    "byTier": {
      "BASIC": 2010.00,
      "PREMIUM": 1620.00,
      "PLATINUM": 605.00
    }
  },
  "participation": {
    "totalHours": 2847.5,
    "totalEquityUnits": 284.75,
    "activeStewards": 134,
    "avgHoursPerSteward": 21.2,
    "topContributors": [
      {
        "userId": "user_123",
        "name": "Jane Doe",
        "hours": 156.5,
        "equityUnits": 15.65
      }
    ],
    "byCategory": {
      "COMMITTEE_WORK": 1234.5,
      "EVENT_VOLUNTEERING": 567.0,
      "COURSE_TEACHING": 345.5,
      "COMMUNITY_SERVICE": 700.5
    }
  },
  "period": {
    "startDate": "2025-11-17T00:00:00Z",
    "endDate": "2025-12-17T23:59:59Z",
    "days": 30
  }
}
```

---

### 2. GET /api/analytics/members

**Purpose:** Detailed member analytics and trends

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR

**Query Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month'; // Default: 'day'
}
```

**Response:**
```json
{
  "timeSeries": [
    {
      "date": "2025-12-01",
      "totalMembers": 235,
      "newMembers": 3,
      "activeMembers": 178,
      "churnedMembers": 1
    }
  ],
  "demographics": {
    "byRole": {
      "STEWARD": 198,
      "COMMITTEE_LEADER": 12,
      "PARTNER": 23,
      "RESIDENT": 14
    },
    "byTier": { /* ... */ }
  },
  "retention": {
    "rate30d": 94.2,
    "rate90d": 87.5,
    "rate365d": 78.9
  },
  "covenantAcceptance": {
    "currentVersion": "1.0.0",
    "acceptanceRate": 100.0,
    "avgTimeToAccept": 3.2 // days
  }
}
```

---

### 3. GET /api/analytics/courses

**Purpose:** Course and lesson analytics

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR, CONTENT_MODERATOR

**Query Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
  courseId?: string; // Optional: filter by course
}
```

**Response:**
```json
{
  "summary": {
    "totalCourses": 12,
    "publishedCourses": 10,
    "totalLessons": 87,
    "totalEnrollments": 342,
    "totalCompletions": 234,
    "overallCompletionRate": 68.4
  },
  "courses": [
    {
      "id": "course_123",
      "title": "Regenerative Agriculture Basics",
      "enrollments": 89,
      "completions": 67,
      "completionRate": 75.3,
      "avgCompletionTime": 12.5, // days
      "dropOffRate": 24.7,
      "lessonAnalytics": [
        {
          "lessonId": "lesson_1",
          "title": "Introduction to Permaculture",
          "viewCount": 89,
          "completionCount": 85,
          "completionRate": 95.5,
          "avgTimeSpent": 18.3 // minutes
        }
      ],
      "bottlenecks": [
        {
          "lessonId": "lesson_4",
          "title": "Soil Composition Advanced",
          "dropOffRate": 32.1,
          "reason": "High complexity, longest lesson"
        }
      ]
    }
  ],
  "topPerformers": [ /* courses with highest completion */ ],
  "needsImprovement": [ /* courses with low completion */ ]
}
```

---

### 4. GET /api/analytics/events

**Purpose:** Event attendance and trends

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR, COMMITTEE_LEADER

**Query Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
  committeeId?: string;
  eventType?: EventType;
}
```

**Response:**
```json
{
  "summary": {
    "totalEvents": 24,
    "totalRegistrations": 456,
    "totalAttendance": 387,
    "attendanceRate": 84.9,
    "avgCapacityUtilization": 78.3
  },
  "trends": [
    {
      "date": "2025-12-01",
      "events": 2,
      "registrations": 34,
      "attendance": 29
    }
  ],
  "byType": {
    "COMMITTEE_MEETING": {
      "events": 12,
      "avgAttendance": 8.5,
      "attendanceRate": 89.3
    },
    "WORKSHOP": {
      "events": 8,
      "avgAttendance": 23.4,
      "attendanceRate": 82.1
    }
  },
  "byCommittee": [
    {
      "committeeId": "comm_123",
      "name": "Education Committee",
      "events": 6,
      "registrations": 142,
      "attendance": 118,
      "attendanceRate": 83.1
    }
  ],
  "upcomingEvents": [ /* next 10 events */ ],
  "popularEvents": [ /* highest attendance */ ]
}
```

---

### 5. GET /api/analytics/revenue

**Purpose:** Subscription revenue and financial metrics

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR

**Query Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}
```

**Response:**
```json
{
  "summary": {
    "mrr": 4235.00,
    "arr": 50820.00,
    "totalRevenue": 12450.00,
    "growth": 8.2, // % month-over-month
    "churnRate": 2.3,
    "ltv": 847.50,
    "cac": 125.00
  },
  "timeSeries": [
    {
      "date": "2025-12-01",
      "revenue": 4150.00,
      "newSubscriptions": 5,
      "cancelations": 2,
      "upgrades": 3,
      "downgrades": 1
    }
  ],
  "byTier": [
    {
      "tier": "BASIC",
      "subscribers": 67,
      "mrr": 2010.00,
      "arr": 24120.00,
      "churnRate": 3.1
    },
    {
      "tier": "PREMIUM",
      "subscribers": 54,
      "mrr": 1620.00,
      "arr": 19440.00,
      "churnRate": 1.8
    }
  ],
  "forecasts": {
    "mrr30d": 4567.00,
    "mrr90d": 5234.00,
    "arr365d": 62808.00
  },
  "cohortAnalysis": [
    {
      "cohort": "2025-10",
      "initialSize": 23,
      "retained": 21,
      "retentionRate": 91.3,
      "ltv": 892.00
    }
  ]
}
```

---

### 6. GET /api/analytics/participation

**Purpose:** Sacred Ledger participation analytics

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR, COMMITTEE_LEADER

**Query Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
  committeeId?: string;
  status?: ParticipationStatus;
}
```

**Response:**
```json
{
  "summary": {
    "totalHours": 2847.5,
    "totalEquityUnits": 284.75,
    "activeStewards": 134,
    "avgHoursPerSteward": 21.2,
    "pendingApprovals": 23,
    "rejectionRate": 4.2
  },
  "trends": [
    {
      "date": "2025-12-01",
      "hours": 87.5,
      "entries": 34,
      "participants": 28
    }
  ],
  "byCategory": [
    {
      "category": "COMMITTEE_WORK",
      "hours": 1234.5,
      "entries": 456,
      "avgHoursPerEntry": 2.7
    }
  ],
  "topContributors": [
    {
      "userId": "user_123",
      "name": "Jane Doe",
      "hours": 156.5,
      "equityUnits": 15.65,
      "rank": 1
    }
  ],
  "byCommittee": [
    {
      "committeeId": "comm_123",
      "name": "Operations",
      "hours": 567.5,
      "participants": 23
    }
  ],
  "approvalMetrics": {
    "avgApprovalTime": 2.3, // days
    "pendingOlderThan7d": 5,
    "approvalRate": 95.8
  }
}
```

---

### 7. GET /api/analytics/platform-usage

**Purpose:** Platform feature usage and engagement

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR

**Query Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```json
{
  "traffic": {
    "totalPageViews": 15234,
    "uniqueVisitors": 189,
    "avgSessionDuration": 847, // seconds
    "bounceRate": 23.4,
    "topPages": [
      {
        "path": "/dashboard",
        "views": 3421,
        "uniqueVisitors": 167,
        "avgDuration": 124
      }
    ]
  },
  "features": {
    "mostUsed": [
      {
        "feature": "course_view",
        "usageCount": 1234,
        "uniqueUsers": 89
      },
      {
        "feature": "event_register",
        "usageCount": 567,
        "uniqueUsers": 134
      }
    ],
    "leastUsed": [ /* underutilized features */ ]
  },
  "activeUsers": {
    "daily": 67,
    "weekly": 143,
    "monthly": 189
  },
  "devices": {
    "desktop": 67.3,
    "mobile": 24.1,
    "tablet": 8.6
  },
  "browsers": {
    "chrome": 62.1,
    "safari": 23.4,
    "firefox": 10.2,
    "other": 4.3
  }
}
```

---

### 8. POST /api/analytics/reports/custom

**Purpose:** Create or update custom report

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR

**Request Body:**
```json
{
  "id": "report_123", // Optional: if updating
  "name": "Q4 2025 Member Engagement",
  "description": "Comprehensive member engagement analysis for Q4",
  "config": {
    "metrics": [
      {
        "type": "member_growth",
        "chartType": "line",
        "dateRange": { "preset": "90d" }
      },
      {
        "type": "course_completion",
        "chartType": "funnel",
        "filters": { "courseId": "course_123" }
      },
      {
        "type": "revenue_breakdown",
        "chartType": "table",
        "groupBy": "tier"
      }
    ],
    "layout": "grid", // or "vertical"
    "refreshInterval": 300 // seconds
  },
  "isPublic": false,
  "sharedWith": ["user_456", "user_789"]
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "report_123",
    "name": "Q4 2025 Member Engagement",
    "createdAt": "2025-12-17T10:30:00Z",
    "url": "/dashboard/analytics/reports/report_123"
  }
}
```

---

### 9. GET /api/analytics/reports

**Purpose:** List all saved reports

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR

**Response:**
```json
{
  "reports": [
    {
      "id": "report_123",
      "name": "Q4 2025 Member Engagement",
      "description": "Comprehensive member engagement...",
      "type": "CUSTOM",
      "createdBy": {
        "id": "user_123",
        "name": "Admin User"
      },
      "isPublic": false,
      "createdAt": "2025-12-17T10:30:00Z",
      "updatedAt": "2025-12-17T10:30:00Z"
    }
  ]
}
```

---

### 10. POST /api/analytics/export

**Purpose:** Export analytics data

**Authentication:** Required, roles: WEB_STEWARD, BOARD_CHAIR

**Request Body:**
```json
{
  "type": "overview" | "members" | "courses" | "events" | "revenue" | "participation" | "custom",
  "format": "csv" | "pdf" | "json",
  "dateRange": {
    "startDate": "2025-11-17",
    "endDate": "2025-12-17"
  },
  "reportId": "report_123" // Optional: for custom reports
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://cdn.britepool.com/exports/analytics-2025-12-17-abc123.csv",
  "expiresAt": "2025-12-18T10:30:00Z",
  "fileSize": 245678,
  "filename": "britepool-analytics-2025-12-17.csv"
}
```

---

### 11. POST /api/analytics/track-page-view

**Purpose:** Track page view for analytics

**Authentication:** Optional (tracks anonymous users too)

**Request Body:**
```json
{
  "path": "/dashboard",
  "referrer": "https://google.com",
  "sessionId": "session_abc123"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 12. POST /api/analytics/track-feature-usage

**Purpose:** Track feature usage event

**Authentication:** Required

**Request Body:**
```json
{
  "feature": "course_view",
  "metadata": {
    "courseId": "course_123",
    "lessonId": "lesson_456"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

---

## UI Components

### 1. Analytics Dashboard Page

**Location:** `app/dashboard/analytics/page.tsx`

**Features:**
- Grid layout with responsive cards
- Interactive charts (Chart.js or Recharts)
- Date range selector with presets
- Real-time updates every 30 seconds
- Loading skeletons for async data
- Export button in header
- Quick stats cards at top
- Tabbed interface for different metric categories

**Component Structure:**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import DateRangePicker from '@/components/DateRangePicker';
import MetricCard from '@/components/analytics/MetricCard';
import ExportButton from '@/components/analytics/ExportButton';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({ preset: '30d' });
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Auto-refresh
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchMetrics = async () => {
    const params = new URLSearchParams({
      startDate: dateRange.startDate || '',
      endDate: dateRange.endDate || ''
    });
    const res = await fetch(`/api/analytics/overview?${params}`);
    const data = await res.json();
    setMetrics(data);
    setLoading(false);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-stone-warm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-serif text-earth-brown">Analytics Dashboard</h1>
          <p className="text-earth-dark/70 mt-2">
            Data insights for {metrics.period.days} days
          </p>
        </div>
        <div className="flex gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ExportButton data={metrics} type="overview" />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Members"
          value={metrics.members.total}
          change={metrics.members.growthRate}
          icon="users"
          trend="up"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${metrics.revenue.mrr.toFixed(2)}`}
          change={metrics.revenue.growth}
          icon="dollar"
          trend="up"
        />
        <MetricCard
          title="Course Completion"
          value={`${metrics.courses.completionRate}%`}
          change={2.3}
          icon="graduation"
          trend="up"
        />
        <MetricCard
          title="Participation Hours"
          value={metrics.participation.totalHours}
          change={12.7}
          icon="clock"
          trend="up"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Member Growth Chart */}
        <ChartCard title="Member Growth">
          <Line
            data={memberGrowthData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: { mode: 'index' }
              }
            }}
          />
        </ChartCard>

        {/* Revenue Breakdown */}
        <ChartCard title="Revenue by Tier">
          <Doughnut
            data={revenueBreakdownData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'right' }
              }
            }}
          />
        </ChartCard>

        {/* Course Completion Rates */}
        <ChartCard title="Course Completion Rates">
          <Bar
            data={courseCompletionData}
            options={{
              responsive: true,
              indexAxis: 'y',
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </ChartCard>

        {/* Event Attendance Trends */}
        <ChartCard title="Event Attendance Trends">
          <Line
            data={eventAttendanceData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }}
          />
        </ChartCard>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableCard title="Top Courses" data={metrics.courses.topCourses} />
        <TableCard
          title="Top Contributors"
          data={metrics.participation.topContributors}
        />
      </div>
    </div>
  );
}
```

**Styling:**
- Biophilic color palette
- Smooth animations for chart transitions
- Hover effects on interactive elements
- Responsive grid layout
- Dark mode support (optional)

---

### 2. Date Range Picker Component

**Location:** `components/DateRangePicker.tsx`

**Features:**
- Preset ranges (7d, 30d, 90d, 1y)
- Custom date picker (calendar UI)
- Clear button to reset
- Display selected range in readable format

```tsx
'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

const PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
  { label: 'Custom', value: 'custom' }
];

export default function DateRangePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState(value.preset || '30d');

  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      onChange({ preset: newPreset });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone rounded-lg hover:border-earth-brown transition"
      >
        <Calendar size={18} />
        <span>{PRESETS.find(p => p.value === preset)?.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-stone rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handlePresetChange(p.value)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-stone-warm transition ${
                  preset === p.value ? 'bg-earth-brown/10 text-earth-brown' : ''
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="mt-4 pt-4 border-t border-stone">
              {/* Custom date picker inputs */}
              <input type="date" className="w-full mb-2 p-2 border rounded" />
              <input type="date" className="w-full mb-2 p-2 border rounded" />
              <button
                onClick={() => {
                  // Handle custom date range
                  setIsOpen(false);
                }}
                className="w-full bg-earth-brown text-white py-2 rounded hover:bg-earth-brown/90"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 3. Metric Card Component

**Location:** `components/analytics/MetricCard.tsx`

**Features:**
- Large value display
- Icon for visual identification
- Trend indicator (up/down with color)
- Percentage change badge
- Hover tooltip with additional context

```tsx
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

export default function MetricCard({
  title,
  value,
  change,
  icon,
  trend
}: MetricCardProps) {
  const isPositive = trend === 'up';

  return (
    <div className="bg-white border border-stone rounded-xl p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-earth-brown/10 rounded-lg">
          {icon}
        </div>
        <span
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-sage' : 'text-terracotta'
          }`}
        >
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(change)}%
        </span>
      </div>

      <h3 className="text-earth-dark/60 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-earth-brown">{value}</p>
    </div>
  );
}
```

---

### 4. Chart Card Component

**Location:** `components/analytics/ChartCard.tsx`

**Features:**
- Consistent card styling
- Title and optional subtitle
- Chart container with proper sizing
- Loading state
- Optional toolbar (export, fullscreen)

```tsx
export default function ChartCard({
  title,
  subtitle,
  children,
  toolbar
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-earth-brown">{title}</h3>
          {subtitle && (
            <p className="text-sm text-earth-dark/60 mt-1">{subtitle}</p>
          )}
        </div>
        {toolbar && <div>{toolbar}</div>}
      </div>

      <div className="h-[300px]">{children}</div>
    </div>
  );
}
```

---

### 5. Export Button Component

**Location:** `components/analytics/ExportButton.tsx`

**Features:**
- Format selection dropdown
- Loading indicator during export
- Download trigger
- Toast notification on success/error

```tsx
'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportButton({ data, type }) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState('csv');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          format,
          dateRange: {
            startDate: data.period.startDate,
            endDate: data.period.endDate
          }
        })
      });

      const result = await res.json();

      if (result.success) {
        // Trigger download
        window.location.href = result.downloadUrl;
        toast.success('Export ready! Download starting...');
      } else {
        toast.error('Export failed. Please try again.');
      }
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-earth-brown text-white rounded-lg hover:bg-earth-brown/90 transition disabled:opacity-50"
      >
        <Download size={18} />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {/* Format selector dropdown */}
      <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-32 bg-white border border-stone rounded-lg shadow-lg z-50">
        {['csv', 'pdf', 'json'].map(fmt => (
          <button
            key={fmt}
            onClick={() => setFormat(fmt)}
            className={`w-full text-left px-4 py-2 hover:bg-stone-warm transition ${
              format === fmt ? 'bg-earth-brown/10' : ''
            }`}
          >
            {fmt.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### 6. Custom Report Builder Page

**Location:** `app/dashboard/analytics/reports/custom/page.tsx`

**Features:**
- Drag-and-drop interface
- Metrics library sidebar
- Canvas area for report layout
- Configuration panel
- Real-time preview
- Save/load functionality

```tsx
'use client';

import { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import MetricsLibrary from '@/components/analytics/MetricsLibrary';
import ReportCanvas from '@/components/analytics/ReportCanvas';
import ConfigPanel from '@/components/analytics/ConfigPanel';

export default function CustomReportBuilder() {
  const [reportConfig, setReportConfig] = useState({
    name: 'Untitled Report',
    metrics: []
  });

  const handleAddMetric = (metric) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: [...prev.metrics, metric]
    }));
  };

  const handleSaveReport = async () => {
    const res = await fetch('/api/analytics/reports/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reportConfig, config: reportConfig })
    });

    if (res.ok) {
      toast.success('Report saved successfully!');
    }
  };

  return (
    <DndContext>
      <div className="flex h-screen bg-stone-warm">
        {/* Left Sidebar: Metrics Library */}
        <div className="w-80 bg-white border-r border-stone overflow-y-auto">
          <MetricsLibrary onAddMetric={handleAddMetric} />
        </div>

        {/* Center: Report Canvas */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <input
              type="text"
              value={reportConfig.name}
              onChange={e =>
                setReportConfig(prev => ({ ...prev, name: e.target.value }))
              }
              className="text-3xl font-serif text-earth-brown bg-transparent border-none focus:outline-none"
            />
            <button
              onClick={handleSaveReport}
              className="px-6 py-2 bg-earth-brown text-white rounded-lg hover:bg-earth-brown/90"
            >
              Save Report
            </button>
          </div>

          <ReportCanvas metrics={reportConfig.metrics} />
        </div>

        {/* Right Sidebar: Config Panel */}
        <div className="w-80 bg-white border-l border-stone overflow-y-auto">
          <ConfigPanel reportConfig={reportConfig} />
        </div>
      </div>
    </DndContext>
  );
}
```

---

### 7. Committee Analytics Page (Limited Access)

**Location:** `app/dashboard/committee/[slug]/analytics/page.tsx`

**Features:**
- Committee-specific metrics
- Limited to committee data only
- Similar layout to main dashboard
- Restricted export options

```tsx
export default async function CommitteeAnalytics({ params }) {
  const { slug } = params;
  const committee = await getCommitteeBySlug(slug);

  // Verify user is committee leader
  const user = await getCurrentUser();
  const membership = await getCommitteeMember(user.id, committee.id);

  if (membership.role !== 'LEADER') {
    redirect('/dashboard');
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-serif text-earth-brown mb-6">
        {committee.name} Analytics
      </h1>

      {/* Committee-specific metrics */}
      <CommitteeMetrics committeeId={committee.id} />
    </div>
  );
}
```

---

## Implementation Details

### Phase 1: Database & Schema (Days 1-2)

**Day 1:**
1. Add new analytics models to Prisma schema:
   - `AnalyticsReport`
   - `AnalyticsCache`
   - `PageView`
   - `FeatureUsage`
2. Run `npx prisma migrate dev` to create migrations
3. Update User model to add `reportsCreated` relation
4. Seed initial test data for analytics

**Day 2:**
1. Create database query functions for metric aggregation:
   - `getMemberMetrics()`
   - `getCourseMetrics()`
   - `getEventMetrics()`
   - `getRevenueMetrics()`
   - `getParticipationMetrics()`
2. Implement caching layer for expensive queries
3. Write unit tests for metric calculations

---

### Phase 2: API Endpoints (Days 3-4)

**Day 3:**
1. Implement core analytics API routes:
   - `/api/analytics/overview`
   - `/api/analytics/members`
   - `/api/analytics/courses`
   - `/api/analytics/events`
2. Add authentication middleware
3. Implement role-based access control
4. Add query parameter validation

**Day 4:**
1. Implement remaining API routes:
   - `/api/analytics/revenue`
   - `/api/analytics/participation`
   - `/api/analytics/platform-usage`
2. Create custom report endpoints:
   - `/api/analytics/reports/custom` (POST)
   - `/api/analytics/reports` (GET)
3. Implement export endpoint:
   - `/api/analytics/export`
4. Add tracking endpoints:
   - `/api/analytics/track-page-view`
   - `/api/analytics/track-feature-usage`

---

### Phase 3: UI Components (Days 5-6)

**Day 5:**
1. Install charting library:
   ```bash
   npm install chart.js react-chartjs-2
   # OR
   npm install recharts
   ```
2. Create base components:
   - `MetricCard`
   - `ChartCard`
   - `DateRangePicker`
   - `ExportButton`
3. Implement main analytics dashboard:
   - Layout with responsive grid
   - Quick stats cards
   - Chart integration
4. Add loading skeletons

**Day 6:**
1. Build custom report builder:
   - Install `@dnd-kit/core` for drag-and-drop
   - Create metrics library component
   - Build report canvas
   - Implement configuration panel
2. Create committee analytics view
3. Add mobile responsive styles
4. Implement dark mode (optional)

---

### Phase 4: Export & Polish (Day 7)

**Day 7:**
1. Implement export functionality:
   - CSV generation using `papaparse`
   - PDF generation using `jsPDF` or server-side `puppeteer`
   - JSON serialization
2. Add page view tracking to layout components
3. Implement feature usage tracking hooks
4. Performance optimization:
   - Implement query caching
   - Add request debouncing
   - Optimize chart rendering
5. Testing:
   - Test all export formats
   - Verify metric accuracy
   - Test responsive layouts
   - Cross-browser testing
6. Documentation:
   - Add JSDoc comments
   - Create admin user guide
   - Document API endpoints

---

### Technology Stack

**Charting Library:**
- **Option 1: Chart.js + react-chartjs-2**
  - Pros: Mature, extensive docs, highly customizable
  - Cons: Requires more configuration
  - Best for: Complex custom charts

- **Option 2: Recharts**
  - Pros: React-native, declarative API, easy to use
  - Cons: Less flexible than Chart.js
  - Best for: Quick implementation, clean code

**Recommendation:** Use **Recharts** for faster development and cleaner code.

**Export Libraries:**
- CSV: `papaparse`
- PDF: `jsPDF` (client-side) or `puppeteer` (server-side)
- JSON: Native `JSON.stringify()`

**Additional Dependencies:**
```bash
npm install recharts papaparse jspdf date-fns
npm install @dnd-kit/core @dnd-kit/sortable
npm install react-hot-toast
```

---

### Metric Calculation Logic

**Member Growth Rate:**
```typescript
const growthRate = ((currentTotal - previousTotal) / previousTotal) * 100;
```

**Course Completion Rate:**
```typescript
const completionRate = (completedEnrollments / totalEnrollments) * 100;
```

**Event Attendance Rate:**
```typescript
const attendanceRate = (attendedCount / registeredCount) * 100;
```

**Monthly Recurring Revenue (MRR):**
```typescript
const mrr = subscriptions
  .filter(s => s.status === 'ACTIVE')
  .reduce((sum, s) => sum + s.price, 0);
```

**Annual Recurring Revenue (ARR):**
```typescript
const arr = mrr * 12;
```

**Churn Rate:**
```typescript
const churnRate =
  (cancelledSubscriptions / startingSubscriptions) * 100;
```

**Lifetime Value (LTV):**
```typescript
const ltv = (avgMonthlyRevenue * avgLifespanMonths) - cac;
```

**Equity Units:**
```typescript
const equityUnits = approvedHours / 10; // 10 hours = 1 unit
```

---

### Caching Strategy

**Cache Keys:**
```typescript
const cacheKeys = {
  overview: (startDate, endDate) => `overview_${startDate}_${endDate}`,
  members: (startDate, endDate) => `members_${startDate}_${endDate}`,
  courses: (startDate, endDate) => `courses_${startDate}_${endDate}`,
  // ... etc
};
```

**Cache TTL:**
- Overview metrics: 5 minutes
- Detailed metrics: 10 minutes
- Revenue data: 15 minutes
- Page views: 1 minute

**Cache Implementation:**
```typescript
async function getCachedMetric(key: string, ttl: number, fetchFn: () => Promise<any>) {
  const cached = await prisma.analyticsCache.findUnique({
    where: { metricKey: key }
  });

  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }

  const data = await fetchFn();

  await prisma.analyticsCache.upsert({
    where: { metricKey: key },
    update: {
      data: data as any,
      expiresAt: new Date(Date.now() + ttl * 1000)
    },
    create: {
      metricKey: key,
      data: data as any,
      expiresAt: new Date(Date.now() + ttl * 1000)
    }
  });

  return data;
}
```

---

### Performance Optimization

**Database Indexes:**
Ensure these indexes exist:
```sql
CREATE INDEX idx_page_views_created_at ON "PageView" ("createdAt");
CREATE INDEX idx_page_views_user_path ON "PageView" ("userId", "path");
CREATE INDEX idx_feature_usage_created_at ON "FeatureUsage" ("createdAt");
CREATE INDEX idx_participation_status_created ON "ParticipationLog" ("status", "createdAt");
CREATE INDEX idx_events_start_time ON "Event" ("startTime");
```

**Query Optimization:**
- Use aggregation pipelines for complex metrics
- Implement pagination for large result sets
- Use raw SQL for performance-critical queries
- Batch queries where possible

**Frontend Optimization:**
- Lazy load charts (render on scroll)
- Implement virtual scrolling for tables
- Use React.memo for expensive components
- Debounce date range changes

---

## Testing Requirements

### Unit Tests

**Metric Calculation Tests:**
```typescript
describe('Analytics Metrics', () => {
  test('calculates member growth rate correctly', () => {
    const rate = calculateGrowthRate(100, 85);
    expect(rate).toBe(17.65);
  });

  test('calculates course completion rate correctly', () => {
    const rate = calculateCompletionRate(67, 89);
    expect(rate).toBeCloseTo(75.28);
  });

  test('calculates MRR correctly', () => {
    const subscriptions = [
      { status: 'ACTIVE', price: 30 },
      { status: 'ACTIVE', price: 50 },
      { status: 'CANCELLED', price: 30 }
    ];
    const mrr = calculateMRR(subscriptions);
    expect(mrr).toBe(80);
  });

  test('calculates equity units correctly', () => {
    const units = calculateEquityUnits(156.5);
    expect(units).toBe(15.65);
  });
});
```

**API Endpoint Tests:**
```typescript
describe('GET /api/analytics/overview', () => {
  test('returns overview metrics with valid date range', async () => {
    const res = await fetch('/api/analytics/overview?startDate=2025-11-17&endDate=2025-12-17');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('members');
    expect(data).toHaveProperty('engagement');
    expect(data).toHaveProperty('courses');
    expect(data.period.days).toBe(30);
  });

  test('requires authentication', async () => {
    const res = await fetch('/api/analytics/overview');
    expect(res.status).toBe(401);
  });

  test('requires admin role', async () => {
    const res = await fetch('/api/analytics/overview', {
      headers: { Authorization: `Bearer ${regularUserToken}` }
    });
    expect(res.status).toBe(403);
  });
});
```

### Integration Tests

**Dashboard Flow:**
```typescript
test('admin can view analytics dashboard', async () => {
  await loginAs('admin');
  await page.goto('/dashboard/analytics');

  // Verify metrics cards render
  await expect(page.locator('[data-testid="metric-members"]')).toBeVisible();
  await expect(page.locator('[data-testid="metric-revenue"]')).toBeVisible();

  // Verify charts render
  await expect(page.locator('canvas')).toHaveCount(4);

  // Change date range
  await page.click('[data-testid="date-range-picker"]');
  await page.click('text=Last 90 days');

  // Verify data updates
  await expect(page.locator('[data-testid="period-days"]')).toHaveText('90');
});
```

**Export Flow:**
```typescript
test('admin can export analytics to CSV', async () => {
  await loginAs('admin');
  await page.goto('/dashboard/analytics');

  // Trigger export
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="export-button"]');
  await page.click('text=CSV');

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/britepool-analytics-.*\.csv/);

  // Verify CSV contents
  const path = await download.path();
  const contents = fs.readFileSync(path, 'utf-8');
  expect(contents).toContain('Total Members');
  expect(contents).toContain('Monthly Revenue');
});
```

### Manual Testing Checklist

**Dashboard:**
- [ ] Dashboard loads within 2 seconds
- [ ] All metric cards display correct values
- [ ] Charts render without errors
- [ ] Hover tooltips work on charts
- [ ] Date range picker updates data correctly
- [ ] Preset date ranges (7d, 30d, 90d, 1y) work
- [ ] Custom date range picker functions properly
- [ ] Auto-refresh updates data every 30 seconds
- [ ] Export button generates files correctly
- [ ] All three export formats (CSV, PDF, JSON) work

**Custom Reports:**
- [ ] Metrics library displays all available metrics
- [ ] Drag-and-drop adds metrics to canvas
- [ ] Configuration panel updates metric settings
- [ ] Report saves successfully
- [ ] Saved reports load correctly
- [ ] Reports can be shared with other admins
- [ ] Reports can be deleted

**Permissions:**
- [ ] Non-admin users cannot access analytics
- [ ] Committee leaders can access committee analytics only
- [ ] Committee leaders cannot see financial data
- [ ] Regular members have no analytics access

**Responsive Design:**
- [ ] Dashboard works on mobile (320px width)
- [ ] Dashboard works on tablet (768px width)
- [ ] Dashboard works on desktop (1920px width)
- [ ] Charts resize appropriately
- [ ] Tables scroll horizontally on mobile

**Performance:**
- [ ] Dashboard with 10,000+ members loads quickly
- [ ] Charts render smoothly with large datasets
- [ ] No memory leaks during auto-refresh
- [ ] Export handles large datasets (10MB+)

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database schema migrated:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] All new models added to Prisma schema
- [ ] Database indexes created for performance
- [ ] Environment variables configured (if any)
- [ ] Chart.js or Recharts installed
- [ ] Export libraries installed (papaparse, jsPDF)
- [ ] All API endpoints tested
- [ ] All UI components tested
- [ ] Mobile responsive design verified
- [ ] Cross-browser compatibility tested (Chrome, Safari, Firefox)
- [ ] Unit tests passing
- [ ] Integration tests passing

### Deployment Steps

1. **Deploy database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Install dependencies:**
   ```bash
   npm install recharts papaparse jspdf date-fns @dnd-kit/core
   ```

3. **Build application:**
   ```bash
   npm run build
   ```

4. **Deploy to production:**
   ```bash
   # Deploy via your platform (Vercel, Railway, etc.)
   git push production main
   ```

5. **Seed initial analytics cache:**
   ```bash
   npm run seed:analytics
   ```

6. **Verify deployment:**
   - Test analytics dashboard loads
   - Verify metrics calculate correctly
   - Test export functionality
   - Check mobile responsiveness

### Post-Deployment

- [ ] Verify analytics dashboard accessible at `/dashboard/analytics`
- [ ] Test metric calculations with production data
- [ ] Verify exports generate correctly
- [ ] Check performance with real traffic
- [ ] Monitor API response times
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor cache hit rates
- [ ] Verify auto-refresh works in production
- [ ] Check that page view tracking works
- [ ] Verify feature usage tracking works

### Monitoring

**Key Metrics to Monitor:**
- Analytics API response times (should be < 500ms)
- Cache hit rates (should be > 80%)
- Export generation times (should be < 30s for most reports)
- Dashboard load times (should be < 2s)
- Database query performance
- Memory usage during auto-refresh

**Alerts to Set Up:**
- Alert if analytics API response time > 2s
- Alert if cache hit rate < 70%
- Alert if export generation fails
- Alert if dashboard has errors

---

## Future Enhancements

### Phase 2 Enhancements (Post-MVP)

1. **Advanced Analytics:**
   - Cohort analysis (retention by signup month)
   - Funnel analysis (onboarding completion)
   - A/B testing framework
   - Predictive analytics (churn prediction)

2. **Scheduled Reports:**
   - Email reports on schedule (daily, weekly, monthly)
   - Slack/Discord integration for alerts
   - Automated report generation and distribution

3. **Real-Time Dashboard:**
   - WebSocket integration for live updates
   - Real-time event stream visualization
   - Live user activity feed

4. **Advanced Visualizations:**
   - Heatmaps for page engagement
   - Geographic distribution maps
   - Network graphs for member connections
   - Sankey diagrams for user journeys

5. **AI-Powered Insights:**
   - Anomaly detection (unusual metric changes)
   - Automated insights generation
   - Natural language queries ("Show me top courses last month")
   - Predictive forecasting

6. **Data Export Enhancements:**
   - Google Sheets integration
   - Excel export with formulas
   - Automated data warehouse sync
   - API webhooks for external tools

7. **Benchmarking:**
   - Compare metrics to previous periods
   - Industry benchmark comparisons
   - Goal tracking and progress indicators

8. **Mobile App:**
   - Dedicated mobile analytics app
   - Push notifications for key metrics
   - Offline data access

---

## Security Considerations

**Access Control:**
- Enforce role-based access at API level
- Implement row-level security for committee data
- Log all analytics access for audit trail
- Prevent data leakage through export functionality

**Data Privacy:**
- Anonymize user data in aggregations
- Comply with GDPR/CCPA for data exports
- Implement data retention policies
- Allow users to opt-out of tracking

**Performance Security:**
- Rate limit analytics API endpoints
- Implement query timeouts
- Prevent SQL injection in custom queries
- Validate all user inputs

---

**Spec Complete** ✅

**Next Steps:**
1. Run database migrations to add new models
2. Install required npm packages
3. Implement API endpoints (start with `/api/analytics/overview`)
4. Build dashboard UI components
5. Test with production-like data volumes
6. Deploy to staging for review

**Estimated Timeline:** 7 days (1 week)
**Team Size:** 1-2 developers
**Complexity:** Medium
