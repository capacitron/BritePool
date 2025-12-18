# Specification: Stakeholder Dashboard

**Feature ID:** F019
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** Authentication (F002), Document Management (F020)
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
Implement a secure, read-only dashboard for external stakeholders (partners and advisory board members) that provides controlled access to progress reports, session logs, project documentation, and activity updates. The system ensures accountability through timestamp-verified updates while maintaining strict view-only permissions to protect sensitive information.

### Key Requirements
- Role-specific dashboard views (PARTNER vs. ADVISORY_BOARD roles)
- Secure document library with filtering and download capabilities
- Timestamp-verified updates for accountability and audit trails
- Activity feed showing recent updates and milestones
- View-only permissions enforced at API and UI levels
- Document access control with visibility settings
- PDF report generation for progress summaries
- Mobile-responsive design for on-the-go access
- Integration with Document Management system (F020)

### Success Metrics
- 100% of stakeholder documents have timestamp verification
- Zero unauthorized edit attempts succeed
- All stakeholders can access their assigned documents within 2 clicks
- Document downloads tracked with complete audit trail
- Activity feed updates in real-time for recent changes
- PDF reports generate successfully for all stakeholder types
- Mobile responsiveness score of 95+ on Lighthouse

---

## User Flows

### Flow 1: Partner Logs In and Views Dashboard

```
1. Partner navigates to /login
2. Partner enters credentials → POST /api/auth/login
3. System authenticates user with role: PARTNER
4. Partner redirected to /dashboard/stakeholder
5. Dashboard loads with personalized view:
   - Welcome banner showing partner name and organization
   - Quick stats: Total documents, Unread updates, Recent milestones
   - Activity feed (last 30 days of updates)
   - Document library preview (5 most recent docs)
6. Partner sees "Documents" and "Reports" tabs
7. Partner clicks "View All Documents" button
8. Navigates to /dashboard/stakeholder/documents
9. Document library loads with:
   - Filterable list (by type, date, tags)
   - Search functionality
   - Download buttons (tracking enabled)
   - Timestamp of last update on each document
10. Partner clicks document to preview
11. Document viewer opens with read-only mode
12. Partner can download PDF version
13. Download logged to StakeholderActivity table
```

### Flow 2: Advisory Board Member Accesses Progress Reports

```
1. Advisory Board member logs in with role: ADVISORY_BOARD
2. Redirected to /dashboard/stakeholder (advisory board view)
3. Dashboard loads with expanded access:
   - Overview metrics (project health, budget status, milestones)
   - Recent session logs (limited to high-level summaries)
   - Strategic documents (board meeting minutes, financial reports)
   - Activity feed filtered for board-relevant updates
4. Board member clicks "Progress Reports" tab
5. System fetches reports visible to ADVISORY_BOARD role:
   - GET /api/stakeholder/reports?type=progress
6. List of quarterly and monthly progress reports displayed
7. Board member clicks "Q4 2025 Progress Report"
8. Document viewer opens with report content
9. Board member sees:
   - Executive summary
   - Key achievements
   - Challenges and risks
   - Financial overview
   - Next quarter objectives
10. Board member clicks "Generate PDF Summary"
11. POST /api/stakeholder/reports/generate-pdf
12. System generates custom PDF with timestamp and board member name
13. PDF download initiated
14. Activity logged: "Advisory Board Member [Name] downloaded Q4 2025 Progress Report"
```

### Flow 3: Stakeholder Filters and Downloads Documents

```
1. Stakeholder navigates to /dashboard/stakeholder/documents
2. Document library loads with all accessible documents
3. Stakeholder uses filters:
   - Document Type: [Financial Reports] selected
   - Date Range: [Last 6 months] selected
   - Tags: [Budget, Expenditures] selected
4. Client-side filtering updates list instantly
5. Stakeholder sees 8 matching documents
6. Stakeholder sorts by "Date (Newest First)"
7. Stakeholder clicks download icon on "Annual Financial Report 2025"
8. POST /api/stakeholder/documents/[id]/download
9. System validates:
   - User has PARTNER or ADVISORY_BOARD role
   - Document visibility includes user's role
   - Document exists and is active
10. Download tracking record created:
    - userId, documentId, downloadedAt, ipAddress
11. PDF file download initiated
12. Activity feed updates: "You downloaded Annual Financial Report 2025"
13. Document owner (admin) receives notification (optional)
```

### Flow 4: Activity Feed Updates in Real-Time

```
1. Stakeholder on dashboard page (/dashboard/stakeholder)
2. Activity feed component loads recent activities:
   - GET /api/stakeholder/activity?limit=20
3. Feed displays:
   - "New document uploaded: Q4 Budget Summary (2 hours ago)"
   - "Progress report published: December Monthly Update (1 day ago)"
   - "Meeting minutes added: Advisory Board Meeting 12/15 (3 days ago)"
4. Admin uploads new document with stakeholder visibility
5. Real-time update triggered via WebSocket or polling
6. Activity feed updates with new entry at top
7. Notification badge appears: "1 new update"
8. Stakeholder clicks notification
9. Feed scrolls to new activity
10. Activity marked as "read" for that stakeholder
```

### Flow 5: Admin Controls Document Visibility

```
1. Admin logs in with WEB_STEWARD role
2. Admin navigates to /dashboard/admin/documents
3. Admin sees document management interface
4. Admin clicks "Upload New Document"
5. Upload form displays:
   - Document file (PDF, DOCX, etc.)
   - Title, description, tags
   - Document type (Progress Report, Session Log, Financial, etc.)
   - Visibility settings:
     [ ] Partners
     [ ] Advisory Board
     [ ] Committee Leaders
     [ ] All Members
6. Admin selects [ ] Partners and [ ] Advisory Board
7. Admin uploads document → POST /api/admin/documents/upload
8. StakeholderDocument record created:
   - title, description, fileUrl, fileSize, fileType
   - documentType, tags (JSON array)
   - visibleToRoles: ["PARTNER", "ADVISORY_BOARD"]
   - uploadedById, uploadedAt
   - lastModifiedAt, version
9. Document appears in stakeholder dashboards for partners and board members
10. Activity feed updated for all stakeholders with access
11. Email notification sent to stakeholders (optional): "New document available: [Title]"
```

### Flow 6: Stakeholder Attempts Unauthorized Access (Security Test)

```
1. Stakeholder with PARTNER role attempts to access:
   - URL manipulation: /dashboard/stakeholder/documents/board-only-doc-id
2. GET /api/stakeholder/documents/board-only-doc-id
3. System validates:
   - Document exists: ✓
   - User authenticated: ✓
   - User role (PARTNER) in document.visibleToRoles: ✗
4. API returns 403 Forbidden
5. UI displays: "Access Denied: You do not have permission to view this document."
6. Security event logged:
   - userId, attemptedResource, timestamp, ipAddress
7. Admin receives security notification (if multiple attempts)
```

---

## Database Schema

### New Model: StakeholderDocument

```prisma
model StakeholderDocument {
  id          String   @id @default(cuid())

  // Document details
  title       String
  description String?
  fileUrl     String   // S3 or storage URL
  fileSize    Int      // bytes
  fileType    String   // "application/pdf", "application/vnd.ms-excel", etc.

  // Metadata
  documentType  DocumentType  @default(GENERAL)
  tags          Json?         // ["budget", "financial", "Q4-2025"]

  // Access control
  visibleToRoles  Json        // ["PARTNER", "ADVISORY_BOARD"]

  // Tracking
  uploadedById    String
  uploadedBy      User    @relation("DocumentsUploaded", fields: [uploadedById], references: [id])
  uploadedAt      DateTime @default(now())
  lastModifiedAt  DateTime @updatedAt
  version         Int      @default(1)

  // Relations
  downloads       StakeholderDownload[]
  activities      StakeholderActivity[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([documentType])
  @@index([uploadedAt])
  @@index([uploadedById])
}

enum DocumentType {
  PROGRESS_REPORT
  SESSION_LOG
  FINANCIAL_REPORT
  MEETING_MINUTES
  STRATEGIC_PLAN
  POLICY_DOCUMENT
  GENERAL
}
```

### New Model: StakeholderDownload

```prisma
model StakeholderDownload {
  id          String   @id @default(cuid())

  userId      String
  user        User     @relation("DocumentDownloads", fields: [userId], references: [id], onDelete: Cascade)

  documentId  String
  document    StakeholderDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  downloadedAt DateTime @default(now())
  ipAddress    String?
  userAgent    String?

  @@index([userId])
  @@index([documentId])
  @@index([downloadedAt])
}
```

### New Model: StakeholderActivity

```prisma
model StakeholderActivity {
  id          String   @id @default(cuid())

  // Activity type
  activityType  ActivityType

  // Relationships
  userId        String?
  user          User?   @relation("StakeholderActivities", fields: [userId], references: [id], onDelete: SetNull)

  documentId    String?
  document      StakeholderDocument? @relation(fields: [documentId], references: [id], onDelete: Cascade)

  // Activity details
  title         String
  description   String?
  metadata      Json?   // Additional context data

  // Timestamp verification
  occurredAt    DateTime @default(now())
  verifiedAt    DateTime @default(now())

  createdAt     DateTime @default(now())

  @@index([activityType])
  @@index([occurredAt])
  @@index([userId])
}

enum ActivityType {
  DOCUMENT_UPLOADED
  DOCUMENT_DOWNLOADED
  DOCUMENT_UPDATED
  REPORT_GENERATED
  MILESTONE_REACHED
  MEETING_SCHEDULED
  ANNOUNCEMENT_POSTED
}
```

### Updates to Existing Models

**User Model** (add relations):
```prisma
model User {
  // ... existing fields

  // Stakeholder relations
  documentsUploaded    StakeholderDocument[]   @relation("DocumentsUploaded")
  documentDownloads    StakeholderDownload[]   @relation("DocumentDownloads")
  stakeholderActivities StakeholderActivity[]  @relation("StakeholderActivities")
}
```

### Database Migration

Run Prisma migrations:
```bash
npx prisma db push
```

---

## API Endpoints

### 1. GET /api/stakeholder/dashboard

**Purpose:** Get dashboard overview data for authenticated stakeholder

**Authentication:** Required, role: PARTNER or ADVISORY_BOARD

**Response:**
```json
{
  "user": {
    "name": "John Doe",
    "role": "PARTNER",
    "organization": "Acme Foundation"
  },
  "stats": {
    "totalDocuments": 24,
    "unreadUpdates": 3,
    "recentMilestones": 2
  },
  "recentDocuments": [
    {
      "id": "doc_123",
      "title": "Q4 2025 Progress Report",
      "documentType": "PROGRESS_REPORT",
      "uploadedAt": "2025-12-15T10:00:00Z",
      "fileSize": 2048000
    }
  ],
  "recentActivity": [
    {
      "id": "act_456",
      "activityType": "DOCUMENT_UPLOADED",
      "title": "New document uploaded: December Budget Summary",
      "occurredAt": "2025-12-17T08:00:00Z"
    }
  ]
}
```

**Error Cases:**
- User not authenticated → 401
- User role not PARTNER or ADVISORY_BOARD → 403

---

### 2. GET /api/stakeholder/documents

**Purpose:** List all documents accessible to stakeholder

**Authentication:** Required, role: PARTNER or ADVISORY_BOARD

**Query Parameters:**
- `type` (optional): Filter by DocumentType
- `search` (optional): Search in title/description
- `tags` (optional): Filter by tags (comma-separated)
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_123",
      "title": "Q4 2025 Progress Report",
      "description": "Quarterly progress summary...",
      "documentType": "PROGRESS_REPORT",
      "fileType": "application/pdf",
      "fileSize": 2048000,
      "tags": ["Q4", "financial", "progress"],
      "uploadedBy": {
        "name": "Admin User",
        "role": "WEB_STEWARD"
      },
      "uploadedAt": "2025-12-15T10:00:00Z",
      "lastModifiedAt": "2025-12-15T10:00:00Z",
      "version": 1
    }
  ],
  "total": 24,
  "hasMore": false
}
```

**Logic:**
1. Get authenticated user's role
2. Query StakeholderDocument where user's role is in visibleToRoles
3. Apply filters (type, search, tags)
4. Sort by uploadedAt DESC
5. Paginate results

**Error Cases:**
- User not authenticated → 401
- User role not PARTNER or ADVISORY_BOARD → 403

---

### 3. GET /api/stakeholder/documents/[id]

**Purpose:** Get single document details

**Authentication:** Required, role: PARTNER or ADVISORY_BOARD

**Response:**
```json
{
  "document": {
    "id": "doc_123",
    "title": "Q4 2025 Progress Report",
    "description": "Detailed quarterly progress...",
    "documentType": "PROGRESS_REPORT",
    "fileUrl": "https://storage.example.com/docs/q4-report.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048000,
    "tags": ["Q4", "financial", "progress"],
    "uploadedBy": {
      "name": "Admin User"
    },
    "uploadedAt": "2025-12-15T10:00:00Z",
    "lastModifiedAt": "2025-12-15T10:00:00Z",
    "version": 1,
    "downloadCount": 12
  }
}
```

**Logic:**
1. Verify document exists
2. Check if user's role in document.visibleToRoles
3. Return document details (exclude fileUrl in list views for security)

**Error Cases:**
- Document not found → 404
- User not authorized to view → 403

---

### 4. POST /api/stakeholder/documents/[id]/download

**Purpose:** Track document download and return signed URL

**Authentication:** Required, role: PARTNER or ADVISORY_BOARD

**Request Body:** None

**Response:**
```json
{
  "downloadUrl": "https://storage.example.com/docs/q4-report.pdf?signature=...",
  "expiresIn": 300,
  "fileName": "Q4-2025-Progress-Report.pdf"
}
```

**Logic:**
1. Verify user has access to document
2. Create StakeholderDownload record (userId, documentId, timestamp, IP)
3. Generate signed S3 URL (5-minute expiration)
4. Create activity record: DOCUMENT_DOWNLOADED
5. Return download URL

**Error Cases:**
- Document not found → 404
- User not authorized → 403

---

### 5. GET /api/stakeholder/activity

**Purpose:** Get activity feed for stakeholder

**Authentication:** Required, role: PARTNER or ADVISORY_BOARD

**Query Parameters:**
- `limit` (optional, default: 20): Number of activities
- `offset` (optional, default: 0): Pagination
- `type` (optional): Filter by ActivityType

**Response:**
```json
{
  "activities": [
    {
      "id": "act_123",
      "activityType": "DOCUMENT_UPLOADED",
      "title": "New document uploaded: December Budget Summary",
      "description": "Monthly financial report for December 2025",
      "occurredAt": "2025-12-17T08:00:00Z",
      "verifiedAt": "2025-12-17T08:00:00Z",
      "document": {
        "id": "doc_789",
        "title": "December Budget Summary"
      }
    },
    {
      "id": "act_124",
      "activityType": "DOCUMENT_DOWNLOADED",
      "title": "You downloaded Q4 2025 Progress Report",
      "occurredAt": "2025-12-16T14:30:00Z"
    }
  ],
  "total": 45,
  "hasMore": true
}
```

**Logic:**
1. Get user's role
2. Query activities where:
   - Related documents are visible to user's role, OR
   - Activity userId matches current user
3. Sort by occurredAt DESC
4. Paginate

---

### 6. POST /api/stakeholder/reports/generate-pdf

**Purpose:** Generate custom PDF report summary

**Authentication:** Required, role: PARTNER or ADVISORY_BOARD

**Request Body:**
```json
{
  "reportType": "progress",
  "period": "Q4-2025",
  "includeFinancials": true,
  "includeMilestones": true
}
```

**Response:**
```json
{
  "success": true,
  "reportUrl": "https://storage.example.com/reports/stakeholder-report-123.pdf",
  "generatedAt": "2025-12-17T10:30:00Z",
  "expiresIn": 3600
}
```

**Logic:**
1. Validate report parameters
2. Gather relevant data based on user role:
   - PARTNER: High-level progress, key milestones
   - ADVISORY_BOARD: Detailed metrics, financial data, strategic insights
3. Generate PDF using library (e.g., Puppeteer, PDFKit)
4. Include timestamp verification footer
5. Upload to S3 with signed URL
6. Create activity record: REPORT_GENERATED
7. Return signed URL

**Error Cases:**
- Invalid report parameters → 400
- User not authorized → 403

---

### 7. POST /api/admin/documents/upload (Admin Only)

**Purpose:** Upload new document for stakeholders

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:** (multipart/form-data)
```
file: [binary]
title: "Q4 2025 Progress Report"
description: "Quarterly progress summary..."
documentType: "PROGRESS_REPORT"
tags: ["Q4", "financial", "progress"]
visibleToRoles: ["PARTNER", "ADVISORY_BOARD"]
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc_123",
    "title": "Q4 2025 Progress Report",
    "fileUrl": "https://storage.example.com/docs/q4-report.pdf",
    "uploadedAt": "2025-12-17T10:00:00Z"
  }
}
```

**Logic:**
1. Validate user has admin permissions
2. Upload file to S3
3. Create StakeholderDocument record
4. Create activity record: DOCUMENT_UPLOADED
5. Trigger notifications to stakeholders (optional)

---

### 8. GET /api/admin/stakeholder/analytics

**Purpose:** View stakeholder engagement analytics

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Response:**
```json
{
  "totalDocuments": 24,
  "totalDownloads": 156,
  "activeStakeholders": 8,
  "topDocuments": [
    {
      "documentId": "doc_123",
      "title": "Q4 2025 Progress Report",
      "downloadCount": 12,
      "lastDownloaded": "2025-12-17T09:00:00Z"
    }
  ],
  "stakeholderActivity": [
    {
      "userId": "user_456",
      "name": "John Doe",
      "role": "PARTNER",
      "lastActive": "2025-12-17T08:00:00Z",
      "documentDownloads": 5
    }
  ]
}
```

---

## UI Components

### 1. Stakeholder Dashboard Page

**Location:** `app/dashboard/stakeholder/page.tsx`

**Features:**
- Personalized welcome banner with stakeholder name and role
- Quick stats cards (Total Documents, Unread Updates, Recent Milestones)
- Activity feed (last 20 activities, infinite scroll)
- Recent documents preview (5 most recent)
- Navigation to Documents and Reports tabs
- Mobile-responsive grid layout

**Component Structure:**
```tsx
export default function StakeholderDashboardPage() {
  const { data: dashboardData } = useSWR('/api/stakeholder/dashboard');

  return (
    <div className="min-h-screen bg-earth-light">
      <DashboardHeader user={dashboardData?.user} />

      <div className="container mx-auto px-4 py-8">
        <StatsGrid stats={dashboardData?.stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <ActivityFeed activities={dashboardData?.recentActivity} />
          <RecentDocuments documents={dashboardData?.recentDocuments} />
        </div>
      </div>
    </div>
  );
}
```

---

### 2. Document Library Page

**Location:** `app/dashboard/stakeholder/documents/page.tsx`

**Features:**
- Search bar with real-time filtering
- Filter dropdowns (Document Type, Date Range, Tags)
- Sort options (Date, Title, Downloads)
- Document cards with preview, download, and details
- Pagination or infinite scroll
- Empty state for no documents

**Component Structure:**
```tsx
export default function StakeholderDocumentsPage() {
  const [filters, setFilters] = useState({
    search: '',
    type: null,
    tags: []
  });

  const { data: documents } = useSWR(
    `/api/stakeholder/documents?${buildQueryString(filters)}`
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif text-earth-brown mb-6">
        Document Library
      </h1>

      <DocumentFilters filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {documents?.documents.map(doc => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}
```

---

### 3. Document Card Component

**Location:** `app/components/stakeholder/DocumentCard.tsx`

**Features:**
- Document icon based on file type
- Title and description preview
- Metadata (uploaded date, file size, document type)
- Download button with loading state
- Click to view details modal
- Timestamp verification badge

```tsx
export function DocumentCard({ document }: { document: StakeholderDocument }) {
  const handleDownload = async () => {
    const res = await fetch(`/api/stakeholder/documents/${document.id}/download`, {
      method: 'POST'
    });
    const { downloadUrl, fileName } = await res.json();

    // Trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <FileIcon type={document.fileType} />
        <span className="text-xs text-earth-brown bg-earth-light px-2 py-1 rounded">
          {document.documentType}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-earth-dark mt-4">
        {document.title}
      </h3>

      <p className="text-sm text-earth-brown mt-2 line-clamp-2">
        {document.description}
      </p>

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="text-xs text-earth-brown">
          <p>{formatDate(document.uploadedAt)}</p>
          <p>{formatFileSize(document.fileSize)}</p>
        </div>

        <button
          onClick={handleDownload}
          className="btn-secondary text-sm"
        >
          Download
        </button>
      </div>

      <TimestampBadge verifiedAt={document.uploadedAt} />
    </div>
  );
}
```

---

### 4. Activity Feed Component

**Location:** `app/components/stakeholder/ActivityFeed.tsx`

**Features:**
- Real-time activity list
- Activity type icons
- Relative timestamps ("2 hours ago")
- Pagination or infinite scroll
- Click activity to navigate to related document
- Empty state

```tsx
export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-serif text-earth-dark mb-4">
        Recent Activity
      </h2>

      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
            <ActivityIcon type={activity.activityType} />

            <div className="flex-1">
              <p className="text-sm font-medium text-earth-dark">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-xs text-earth-brown mt-1">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-earth-brown mt-2">
                {formatRelativeTime(activity.occurredAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-text w-full mt-4">
        View All Activity
      </button>
    </div>
  );
}
```

---

### 5. Document Viewer Modal

**Location:** `app/components/stakeholder/DocumentViewer.tsx`

**Features:**
- Full-screen modal overlay
- PDF preview with controls (zoom, pan, page navigation)
- Document metadata sidebar
- Download button
- Close button
- Keyboard navigation (ESC to close, arrow keys for pages)

---

### 6. Admin Document Upload Form

**Location:** `app/dashboard/admin/documents/upload/page.tsx`

**Features:**
- File drag-and-drop zone
- File type validation
- Title, description, tags inputs
- Document type selector
- Visibility checkbox group (Partners, Advisory Board, etc.)
- Preview before upload
- Progress indicator during upload

---

## Implementation Details

### Phase 1: Database & API (Days 1-3)

1. **Day 1:** Database Schema
   - Update Prisma schema with StakeholderDocument, StakeholderDownload, StakeholderActivity models
   - Run database migrations: `npx prisma db push`
   - Test schema with seed data

2. **Day 2:** Core API Endpoints
   - Implement GET /api/stakeholder/dashboard
   - Implement GET /api/stakeholder/documents (with filtering)
   - Implement GET /api/stakeholder/documents/[id]
   - Implement POST /api/stakeholder/documents/[id]/download
   - Add role-based access control middleware

3. **Day 3:** Admin & Activity APIs
   - Implement POST /api/admin/documents/upload (with S3 integration)
   - Implement GET /api/stakeholder/activity
   - Implement POST /api/stakeholder/reports/generate-pdf
   - Set up S3 bucket for document storage

### Phase 2: UI Components (Days 4-5)

4. **Day 4:** Dashboard & Document Library
   - Create StakeholderDashboardPage with stats and activity feed
   - Create StakeholderDocumentsPage with filtering
   - Implement DocumentCard component
   - Style with biophilic design system

5. **Day 5:** Advanced UI Components
   - Create DocumentViewer modal with PDF preview
   - Implement ActivityFeed component
   - Add download tracking and notifications
   - Mobile responsive design polish

### Phase 3: PDF Generation & Security (Days 6-7)

6. **Day 6:** PDF Report Generation
   - Set up Puppeteer or PDFKit for PDF generation
   - Create report templates (Progress Report, Activity Summary)
   - Implement timestamp verification on PDFs
   - Test PDF generation for different stakeholder roles

7. **Day 7:** Security Hardening & Testing
   - Add comprehensive permission checks to all APIs
   - Test unauthorized access scenarios
   - Implement audit logging for security events
   - Add rate limiting to download endpoints
   - End-to-end testing for all user flows

---

## Testing Requirements

### Unit Tests

```typescript
// Test document access control
test('PARTNER role can access documents visible to partners', async () => {
  const partnerUser = await createUser({ role: 'PARTNER' });
  const document = await createDocument({ visibleToRoles: ['PARTNER'] });

  const res = await fetch(`/api/stakeholder/documents/${document.id}`, {
    headers: { 'Authorization': `Bearer ${partnerUser.token}` }
  });

  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.document.id).toBe(document.id);
});

test('PARTNER role cannot access advisory board only documents', async () => {
  const partnerUser = await createUser({ role: 'PARTNER' });
  const document = await createDocument({ visibleToRoles: ['ADVISORY_BOARD'] });

  const res = await fetch(`/api/stakeholder/documents/${document.id}`, {
    headers: { 'Authorization': `Bearer ${partnerUser.token}` }
  });

  expect(res.status).toBe(403);
});

// Test download tracking
test('POST /api/stakeholder/documents/[id]/download creates tracking record', async () => {
  const user = await createUser({ role: 'PARTNER' });
  const document = await createDocument({ visibleToRoles: ['PARTNER'] });

  const res = await fetch(`/api/stakeholder/documents/${document.id}/download`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${user.token}` }
  });

  expect(res.status).toBe(200);

  const download = await prisma.stakeholderDownload.findFirst({
    where: { userId: user.id, documentId: document.id }
  });

  expect(download).toBeTruthy();
  expect(download.downloadedAt).toBeDefined();
});
```

### Integration Tests

- Stakeholder logs in and views personalized dashboard
- Stakeholder filters documents by type and tags
- Stakeholder downloads document (tracked in database)
- Admin uploads document with visibility settings
- Activity feed updates in real-time after document upload
- PDF report generation for different stakeholder roles
- Unauthorized access attempts are blocked and logged

### Manual Testing Checklist

- [ ] Partner can log in and view dashboard
- [ ] Advisory Board member sees expanded access
- [ ] Document filtering works correctly
- [ ] Download tracking records created
- [ ] Activity feed updates after new document upload
- [ ] PDF report generation works
- [ ] Unauthorized access returns 403 error
- [ ] Mobile responsive design works on phone and tablet
- [ ] Timestamp verification displayed on all documents
- [ ] Admin can upload documents and set visibility
- [ ] S3 signed URLs expire after 5 minutes
- [ ] Audit logs capture all security events

### Accessibility Testing

- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces activity feed updates
- [ ] ARIA labels on document cards and buttons
- [ ] Focus management in modals
- [ ] Color contrast meets WCAG AA standards

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database schema synced (`npx prisma db push`)
- [ ] S3 bucket created and configured
- [ ] Environment variables set (S3_BUCKET_NAME, S3_ACCESS_KEY, etc.)
- [ ] PDF generation library installed (Puppeteer)
- [ ] All API endpoints tested
- [ ] All tests passing
- [ ] Security audit completed

### Deployment Steps

1. Deploy database migrations to production
2. Configure S3 bucket with CORS policy
3. Build and deploy application
4. Verify S3 upload and download functionality
5. Test with sample stakeholder accounts
6. Monitor error logs and performance

### Post-Deployment

- [ ] Verify stakeholder users can access dashboard
- [ ] Test document uploads by admin
- [ ] Confirm downloads are tracked
- [ ] Check activity feed updates
- [ ] Monitor S3 storage usage
- [ ] Review security logs for unauthorized access attempts
- [ ] Test PDF report generation
- [ ] Verify mobile responsiveness

### Environment Variables

```env
# S3 Configuration
S3_BUCKET_NAME=stakeholder-documents
S3_REGION=us-west-2
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key

# PDF Generation
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Feature Flags
ENABLE_STAKEHOLDER_DASHBOARD=true
ENABLE_PDF_REPORTS=true
```

---

## Security Considerations

### Access Control

1. **Role-Based Permissions:**
   - All API endpoints validate user role (PARTNER or ADVISORY_BOARD)
   - Document visibility enforced at database query level
   - No client-side role checks (server-side only)

2. **Document Access:**
   - S3 URLs are signed with 5-minute expiration
   - Direct S3 access blocked (all requests through API)
   - Download URLs are single-use

3. **Audit Logging:**
   - All document downloads logged with IP address
   - Unauthorized access attempts logged and monitored
   - Security events trigger admin notifications after threshold

### Data Protection

1. **File Upload Validation:**
   - File type whitelist (PDF, DOCX, XLSX only)
   - File size limits (max 50MB)
   - Virus scanning before storage (optional: ClamAV)

2. **Timestamp Verification:**
   - All documents have immutable upload timestamp
   - Activity logs use blockchain-style verification (optional)
   - PDF reports include generation timestamp in footer

3. **Rate Limiting:**
   - Download endpoint: 10 requests per minute per user
   - API endpoints: 100 requests per minute per user
   - Prevents abuse and DOS attacks

---

## Future Enhancements

1. **Real-Time Notifications:**
   - WebSocket integration for instant activity updates
   - Push notifications for mobile devices
   - Email digests for new documents

2. **Advanced Analytics:**
   - Stakeholder engagement dashboard for admins
   - Document popularity metrics
   - Time-to-download analytics

3. **Collaborative Features:**
   - Comment threads on documents (read-only for stakeholders)
   - Q&A section for stakeholder questions
   - Scheduled reports (weekly/monthly summaries)

4. **Enhanced PDF Generation:**
   - Custom branding per stakeholder organization
   - Multi-language support
   - Interactive charts and visualizations

5. **Mobile App:**
   - Native iOS/Android app for stakeholders
   - Offline document viewing
   - Biometric authentication

6. **Integration with Calendar:**
   - Link activity feed to upcoming meetings
   - Automatic document sharing before board meetings
   - Meeting minutes auto-published after approval

---

**Spec Complete**

**Next Step:** Run `/create-tasks` to generate implementation task list.
