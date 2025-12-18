# Specification: Community Portal - Maintenance Requests

**Feature ID:** F007
**Priority:** High
**Effort:** Small (2-3 days)
**Dependencies:** User Authentication (F002), Media Gallery (F015)
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
Implement a comprehensive maintenance request system that enables sanctuary residents and members to submit maintenance issues, track their resolution status, and document problems with photo uploads. Operations Board leaders and staff can assign requests, update status throughout the workflow, and maintain a complete resolution history for all facility maintenance needs.

### Key Requirements
- Maintenance request submission form accessible to all authenticated residents
- Priority assignment system (LOW, MEDIUM, HIGH, URGENT)
- Status tracking workflow (SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED)
- Photo uploads for documenting maintenance issues
- Request assignment to maintenance staff
- Resolution workflows with completion notes and timestamps
- Complete maintenance history and audit trail
- Dashboard views for residents and operations staff
- Filtering and search capabilities

### Success Metrics
- All maintenance requests tracked with complete status history
- 100% of urgent requests assigned within 1 hour
- Average resolution time visible per priority level
- Photo attachments included in 80%+ of requests
- Clear audit trail showing all status changes and assignments
- Residents can view real-time status of their requests
- Operations staff can efficiently manage and prioritize workload

---

## User Flows

### Flow 1: Resident Submits Maintenance Request

```
1. Resident logs in (any authenticated user role)
2. Resident navigates to /dashboard/maintenance or clicks "Submit Request" from navigation
3. Resident sees maintenance request submission form:
   - Title (required, e.g., "Leaking faucet in cabin 12")
   - Description (required, rich text with markdown support)
   - Location (required, dropdown or text input)
   - Priority (dropdown: LOW, MEDIUM, HIGH, URGENT)
   - Category (dropdown: PLUMBING, ELECTRICAL, STRUCTURAL, GROUNDS, HVAC, OTHER)
   - Photo Upload (optional, multiple images, drag-and-drop)
4. Resident fills out form and uploads photos of issue
5. Resident clicks "Submit Request"
6. POST /api/maintenance-requests
7. System validates:
   - User is authenticated
   - Required fields are present
   - Photos are valid image files (if uploaded)
8. MaintenanceRequest record created with:
   - status: SUBMITTED
   - submittedById: current user ID
   - submittedAt: current timestamp
   - Photos uploaded to cloud storage via Media Gallery integration
9. System redirects to /dashboard/maintenance/[id]
10. Resident sees confirmation message and request details
11. (Optional) Email notification sent to Operations Board leaders
12. Request appears in resident's "My Requests" list
```

### Flow 2: Operations Staff Views and Assigns Request

```
1. Operations staff logs in (role: OPERATIONS board member, SUPPORT_STAFF, or WEB_STEWARD)
2. Staff navigates to /dashboard/maintenance/queue
3. Staff sees list of all maintenance requests with filters:
   - Status filter (SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED)
   - Priority filter (LOW, MEDIUM, HIGH, URGENT)
   - Category filter
   - Date range filter
   - Search by title/location/description
4. Urgent requests highlighted at top with red badge
5. Staff clicks on a SUBMITTED request to view details
6. Staff sees full request details including:
   - Title, description, location, category, priority
   - Photo attachments (gallery view)
   - Submitted by (user name and contact info)
   - Submission timestamp
7. Staff clicks "Assign Request" button
8. Assignment modal opens:
   - Assign to (dropdown of maintenance staff/Operations Board members)
   - Priority adjustment (optional, can change priority)
   - Notes (optional, internal notes for assignee)
9. Staff selects assignee and clicks "Assign"
10. PATCH /api/maintenance-requests/[id]
11. Request updated:
    - status: ASSIGNED
    - assignedToId: selected staff member ID
    - assignedAt: current timestamp
12. Email notification sent to assigned staff member
13. Request status updated in queue view
14. Activity log entry created showing assignment
```

### Flow 3: Assigned Staff Works on and Resolves Request

```
1. Assigned staff member logs in
2. Staff sees notification or navigates to /dashboard/maintenance/assigned-to-me
3. Staff sees list of requests assigned to them
4. Staff clicks on ASSIGNED request
5. Staff clicks "Start Work" button
6. PATCH /api/maintenance-requests/[id]
7. Request status updated to IN_PROGRESS with startedAt timestamp
8. Staff performs maintenance work (offline)
9. Staff returns and clicks "Mark as Resolved" button
10. Resolution form opens:
    - Resolution notes (required, description of work completed)
    - Parts used (optional, list of materials/parts)
    - Labor hours (optional, decimal number)
    - Before/After photos (optional, upload additional photos)
    - Completion confirmation checkbox
11. Staff fills resolution form and clicks "Complete Resolution"
12. PATCH /api/maintenance-requests/[id]
13. Request updated:
    - status: RESOLVED
    - resolvedById: current user ID
    - resolvedAt: current timestamp
    - resolutionNotes: provided notes
14. Email notification sent to original requester
15. Request moves to resolved queue
16. Activity log entry created showing resolution
```

### Flow 4: Resident Views Request Status and History

```
1. Resident logs in
2. Resident navigates to /dashboard/maintenance
3. Resident sees tabs:
   - "My Requests" (requests submitted by this resident)
   - "All Requests" (if user has appropriate role)
4. Resident clicks "My Requests" tab
5. Resident sees list of their maintenance requests with:
   - Title and status badge (color-coded)
   - Priority indicator
   - Submission date
   - Last updated timestamp
6. Resident clicks on specific request
7. Resident sees complete request details including:
   - Current status with status badge
   - Timeline showing all status changes with timestamps:
     * Submitted on [date] by [name]
     * Assigned to [name] on [date]
     * Work started on [date]
     * Resolved on [date]
   - All photo attachments (original submission + resolution photos)
   - Resolution notes (if resolved)
   - Complete activity history
8. Resident can add comments or follow-up notes
9. If issue persists, resident can click "Reopen Request" (creates new linked request)
```

### Flow 5: Operations Manager Views Dashboard and Analytics

```
1. Operations Board leader logs in (role: COMMITTEE_LEADER for Operations)
2. Manager navigates to /dashboard/maintenance/analytics
3. Manager sees maintenance dashboard with:
   - Summary statistics:
     * Total active requests (SUBMITTED + ASSIGNED + IN_PROGRESS)
     * Total resolved requests (last 30 days)
     * Average resolution time by priority level
     * Urgent requests pending
   - Charts and visualizations:
     * Request volume over time (line chart)
     * Resolution time trends (bar chart)
     * Category breakdown (pie chart)
     * Staff workload distribution (bar chart)
   - Active requests table with sorting and filtering
   - Staff performance metrics (requests resolved, avg resolution time)
4. Manager can export reports as CSV or PDF
5. Manager can drill down into specific categories or time periods
6. Manager can identify bottlenecks and resource needs
```

---

## Database Schema

### New Model: MaintenanceRequest

```prisma
model MaintenanceRequest {
  id          String   @id @default(cuid())

  // Request Details
  title       String
  description String
  location    String
  category    MaintenanceCategory
  priority    MaintenancePriority @default(MEDIUM)
  status      MaintenanceStatus @default(SUBMITTED)

  // Submitter Information
  submittedById String
  submittedBy   User @relation("MaintenanceRequestsSubmitted", fields: [submittedById], references: [id])
  submittedAt   DateTime @default(now())

  // Assignment Information
  assignedToId  String?
  assignedTo    User? @relation("MaintenanceRequestsAssigned", fields: [assignedToId], references: [id])
  assignedAt    DateTime?

  // Resolution Information
  resolvedById  String?
  resolvedBy    User? @relation("MaintenanceRequestsResolved", fields: [resolvedById], references: [id])
  resolvedAt    DateTime?
  resolutionNotes String?

  // Work Tracking
  startedAt     DateTime?
  laborHours    Float?
  partsUsed     String?

  // Photo Attachments (integration with Media Gallery)
  photoIds      String[]  // Array of MediaItem IDs

  // Activity History
  activityLog   MaintenanceActivity[]

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
  @@index([priority])
  @@index([category])
  @@index([submittedById])
  @@index([assignedToId])
  @@index([submittedAt])
}

model MaintenanceActivity {
  id          String   @id @default(cuid())
  requestId   String
  request     MaintenanceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  activityType MaintenanceActivityType
  description  String

  performedById String
  performedBy   User @relation("MaintenanceActivitiesPerformed", fields: [performedById], references: [id])

  // Optional metadata
  metadata     Json?  // Store additional context (e.g., old/new values for status changes)

  createdAt    DateTime @default(now())

  @@index([requestId])
  @@index([createdAt])
}

enum MaintenanceCategory {
  PLUMBING
  ELECTRICAL
  STRUCTURAL
  GROUNDS
  HVAC
  APPLIANCES
  CARPENTRY
  PAINTING
  ROOFING
  OTHER
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum MaintenanceStatus {
  SUBMITTED
  ASSIGNED
  IN_PROGRESS
  RESOLVED
  CANCELLED
}

enum MaintenanceActivityType {
  SUBMITTED
  ASSIGNED
  PRIORITY_CHANGED
  STATUS_CHANGED
  WORK_STARTED
  RESOLVED
  COMMENT_ADDED
  REOPENED
  CANCELLED
}
```

### Update User Model Relations

```prisma
model User {
  // ... existing fields and relations

  // Maintenance Request Relations
  maintenanceRequestsSubmitted  MaintenanceRequest[] @relation("MaintenanceRequestsSubmitted")
  maintenanceRequestsAssigned   MaintenanceRequest[] @relation("MaintenanceRequestsAssigned")
  maintenanceRequestsResolved   MaintenanceRequest[] @relation("MaintenanceRequestsResolved")
  maintenanceActivities         MaintenanceActivity[] @relation("MaintenanceActivitiesPerformed")
}
```

### Database Migration

Run Prisma migrations:
```bash
npx prisma db push
```

---

## API Endpoints

### 1. POST /api/maintenance-requests

**Purpose:** Create a new maintenance request

**Authentication:** Required (any authenticated user)

**Request Body:**
```json
{
  "title": "Leaking faucet in cabin 12",
  "description": "The bathroom sink faucet has been dripping constantly for 2 days. Water pressure seems normal but the drip won't stop even when fully closed.",
  "location": "Cabin 12, Main Bathroom",
  "category": "PLUMBING",
  "priority": "MEDIUM",
  "photoIds": ["media_clx123...", "media_clx456..."]
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "maint_clx789...",
    "title": "Leaking faucet in cabin 12",
    "status": "SUBMITTED",
    "priority": "MEDIUM",
    "submittedBy": {
      "id": "user_123",
      "name": "Jane Smith"
    },
    "submittedAt": "2025-12-18T10:00:00Z"
  }
}
```

**Error Cases:**
- User not authenticated → 401
- Missing required fields → 400
- Invalid category or priority → 400

---

### 2. GET /api/maintenance-requests

**Purpose:** List maintenance requests with filtering

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED)
- `priority` (optional): Filter by priority
- `category` (optional): Filter by category
- `submittedBy` (optional): Filter by submitter user ID
- `assignedTo` (optional): Filter by assigned user ID
- `dateFrom` (optional): Filter requests submitted after date
- `dateTo` (optional): Filter requests submitted before date
- `search` (optional): Search in title, description, location
- `limit` (optional): Number of results (default 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "requests": [
    {
      "id": "maint_clx789...",
      "title": "Leaking faucet in cabin 12",
      "status": "IN_PROGRESS",
      "priority": "MEDIUM",
      "category": "PLUMBING",
      "location": "Cabin 12, Main Bathroom",
      "submittedBy": {
        "id": "user_123",
        "name": "Jane Smith"
      },
      "assignedTo": {
        "id": "user_456",
        "name": "John Maintenance"
      },
      "submittedAt": "2025-12-18T10:00:00Z",
      "updatedAt": "2025-12-18T14:30:00Z",
      "photoCount": 2
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0
  }
}
```

**Permission Notes:**
- Regular users can only see their own submitted requests
- Operations Board members, SUPPORT_STAFF, and WEB_STEWARD can see all requests

---

### 3. GET /api/maintenance-requests/[id]

**Purpose:** Get detailed information about a specific maintenance request

**Authentication:** Required

**Response:**
```json
{
  "request": {
    "id": "maint_clx789...",
    "title": "Leaking faucet in cabin 12",
    "description": "The bathroom sink faucet has been dripping...",
    "status": "RESOLVED",
    "priority": "MEDIUM",
    "category": "PLUMBING",
    "location": "Cabin 12, Main Bathroom",
    "submittedBy": {
      "id": "user_123",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "assignedTo": {
      "id": "user_456",
      "name": "John Maintenance",
      "email": "john@example.com"
    },
    "resolvedBy": {
      "id": "user_456",
      "name": "John Maintenance"
    },
    "submittedAt": "2025-12-18T10:00:00Z",
    "assignedAt": "2025-12-18T11:30:00Z",
    "startedAt": "2025-12-18T13:00:00Z",
    "resolvedAt": "2025-12-18T15:45:00Z",
    "resolutionNotes": "Replaced worn washer in faucet cartridge. Tested for 15 minutes, no more drips. Issue resolved.",
    "laborHours": 0.5,
    "partsUsed": "Faucet washer kit",
    "photos": [
      {
        "id": "media_clx123...",
        "url": "https://cdn.example.com/maint-photo-1.jpg",
        "thumbnailUrl": "https://cdn.example.com/maint-photo-1-thumb.jpg",
        "uploadedAt": "2025-12-18T10:00:00Z"
      }
    ],
    "activityLog": [
      {
        "id": "act_1",
        "activityType": "SUBMITTED",
        "description": "Request submitted by Jane Smith",
        "performedBy": { "id": "user_123", "name": "Jane Smith" },
        "createdAt": "2025-12-18T10:00:00Z"
      },
      {
        "id": "act_2",
        "activityType": "ASSIGNED",
        "description": "Assigned to John Maintenance",
        "performedBy": { "id": "user_789", "name": "Operations Manager" },
        "createdAt": "2025-12-18T11:30:00Z"
      },
      {
        "id": "act_3",
        "activityType": "WORK_STARTED",
        "description": "Work started",
        "performedBy": { "id": "user_456", "name": "John Maintenance" },
        "createdAt": "2025-12-18T13:00:00Z"
      },
      {
        "id": "act_4",
        "activityType": "RESOLVED",
        "description": "Request resolved",
        "performedBy": { "id": "user_456", "name": "John Maintenance" },
        "createdAt": "2025-12-18T15:45:00Z"
      }
    ]
  }
}
```

**Error Cases:**
- User not authorized to view this request → 403
- Request not found → 404

---

### 4. PATCH /api/maintenance-requests/[id]

**Purpose:** Update maintenance request (status, assignment, priority, etc.)

**Authentication:** Required, role-based permissions apply

**Request Body (examples):**

**Assign Request:**
```json
{
  "action": "assign",
  "assignedToId": "user_456",
  "notes": "High priority, please handle ASAP"
}
```

**Start Work:**
```json
{
  "action": "start_work"
}
```

**Resolve Request:**
```json
{
  "action": "resolve",
  "resolutionNotes": "Replaced worn washer in faucet cartridge. Issue resolved.",
  "laborHours": 0.5,
  "partsUsed": "Faucet washer kit",
  "photoIds": ["media_clx999..."]
}
```

**Update Priority:**
```json
{
  "action": "update_priority",
  "priority": "URGENT"
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "maint_clx789...",
    "status": "ASSIGNED",
    "assignedTo": {
      "id": "user_456",
      "name": "John Maintenance"
    },
    "updatedAt": "2025-12-18T11:30:00Z"
  }
}
```

**Permission Rules:**
- **assign**: Operations Board members, SUPPORT_STAFF, WEB_STEWARD
- **start_work**: Assigned staff member only
- **resolve**: Assigned staff member only
- **update_priority**: Operations Board members, SUPPORT_STAFF, WEB_STEWARD
- **cancel**: Submitter or Operations Board members

**Error Cases:**
- User not authorized for action → 403
- Invalid action or status transition → 400
- Request not found → 404

---

### 5. POST /api/maintenance-requests/[id]/comments

**Purpose:** Add a comment or note to a maintenance request

**Authentication:** Required (submitter, assigned staff, or operations staff)

**Request Body:**
```json
{
  "comment": "Checked on this today, the drip has gotten worse. Water pooling under sink now."
}
```

**Response:**
```json
{
  "success": true,
  "activity": {
    "id": "act_5",
    "activityType": "COMMENT_ADDED",
    "description": "Checked on this today, the drip has gotten worse...",
    "performedBy": {
      "id": "user_123",
      "name": "Jane Smith"
    },
    "createdAt": "2025-12-18T16:00:00Z"
  }
}
```

---

### 6. GET /api/maintenance-requests/analytics

**Purpose:** Get maintenance analytics and statistics

**Authentication:** Required, role: Operations Board member, SUPPORT_STAFF, or WEB_STEWARD

**Query Parameters:**
- `dateFrom` (optional): Start date for analytics
- `dateTo` (optional): End date for analytics

**Response:**
```json
{
  "summary": {
    "totalActive": 12,
    "totalResolved": 48,
    "urgentPending": 2,
    "averageResolutionTime": {
      "LOW": "72.5 hours",
      "MEDIUM": "24.3 hours",
      "HIGH": "8.7 hours",
      "URGENT": "2.1 hours"
    }
  },
  "byCategory": {
    "PLUMBING": 15,
    "ELECTRICAL": 8,
    "STRUCTURAL": 5,
    "GROUNDS": 12,
    "HVAC": 6,
    "OTHER": 14
  },
  "byStatus": {
    "SUBMITTED": 4,
    "ASSIGNED": 5,
    "IN_PROGRESS": 3,
    "RESOLVED": 48
  },
  "staffPerformance": [
    {
      "staffId": "user_456",
      "staffName": "John Maintenance",
      "requestsResolved": 18,
      "averageResolutionTime": "12.4 hours"
    }
  ]
}
```

---

## UI Components

### 1. Maintenance Request List Page

**Location:** `app/dashboard/maintenance/page.tsx`

**Features:**
- Tabbed interface:
  - "My Requests" (for all users)
  - "All Requests" (for operations staff)
  - "Assigned to Me" (for maintenance staff)
  - "Analytics" (for operations managers)
- Filterable request list with:
  - Status badges (color-coded)
  - Priority indicators
  - Category labels
  - Date information
  - Assignment info
- Search bar for quick filtering
- "Submit New Request" button prominently displayed
- Sort options (date, priority, status)

---

### 2. Maintenance Request Submission Form

**Location:** `app/components/maintenance/MaintenanceRequestForm.tsx`

**Features:**
- Clean, accessible form with validation
- Title input (text)
- Description textarea (rich text/markdown editor)
- Location input (text or dropdown of common locations)
- Category dropdown
- Priority radio buttons or dropdown
- Photo upload component:
  - Drag-and-drop interface
  - Multiple file support
  - Image preview thumbnails
  - Integration with Media Gallery upload API
- Real-time validation
- Submit button with loading state
- Success/error feedback

---

### 3. Maintenance Request Detail Page

**Location:** `app/dashboard/maintenance/[id]/page.tsx`

**Features:**
- Header section:
  - Title and status badge
  - Priority indicator
  - Category label
  - Action buttons based on user role and request status
- Request details section:
  - Description (formatted markdown)
  - Location
  - Submitter information
  - Assignment information
  - Resolution information (if resolved)
- Photo gallery:
  - Grid layout with lightbox viewer
  - Separate sections for original photos and resolution photos
- Activity timeline:
  - Chronological list of all activities
  - User avatars and names
  - Timestamps
  - Activity type icons
- Comments section:
  - Add comment textarea
  - List of existing comments
  - Comment author and timestamp
- Action buttons (role-based):
  - "Assign Request" (operations staff)
  - "Start Work" (assigned staff)
  - "Mark as Resolved" (assigned staff)
  - "Update Priority" (operations staff)
  - "Cancel Request" (submitter or operations staff)

---

### 4. Request Assignment Modal

**Location:** `app/components/maintenance/AssignRequestModal.tsx`

**Features:**
- Modal dialog overlay
- Staff member selector (searchable dropdown)
- Priority adjustment option
- Internal notes textarea
- Assign button with loading state
- Cancel button

---

### 5. Resolution Form Modal

**Location:** `app/components/maintenance/ResolveRequestModal.tsx`

**Features:**
- Modal dialog overlay
- Resolution notes textarea (required)
- Labor hours input (decimal number)
- Parts used textarea
- Additional photo upload
- Completion confirmation checkbox
- Complete button with loading state
- Cancel button

---

### 6. Maintenance Analytics Dashboard

**Location:** `app/dashboard/maintenance/analytics/page.tsx`

**Features:**
- Summary statistics cards:
  - Total active requests
  - Total resolved (last 30 days)
  - Urgent pending
  - Average resolution time
- Charts and visualizations:
  - Request volume over time (line chart using recharts or similar)
  - Category breakdown (pie chart)
  - Staff workload distribution (bar chart)
- Date range selector
- Export button (CSV/PDF)
- Filterable data tables
- Staff performance metrics table

---

## Implementation Details

### Phase 1: Database & Core API (Day 1)

**Tasks:**
1. Add MaintenanceRequest and MaintenanceActivity models to Prisma schema
2. Update User model with maintenance request relations
3. Run database migrations
4. Create seed data for testing (sample requests)
5. Implement POST /api/maintenance-requests endpoint
6. Implement GET /api/maintenance-requests endpoint with filtering
7. Implement GET /api/maintenance-requests/[id] endpoint
8. Add permission middleware for role-based access control
9. Test all API endpoints with Postman or similar

**Deliverables:**
- Updated schema.prisma
- Working API endpoints
- Permission system implemented
- API tests passing

---

### Phase 2: Request Management & Workflow (Day 2)

**Tasks:**
1. Implement PATCH /api/maintenance-requests/[id] endpoint
2. Add action handlers (assign, start_work, resolve, update_priority, cancel)
3. Implement activity logging for all actions
4. Create POST /api/maintenance-requests/[id]/comments endpoint
5. Integrate photo upload with Media Gallery system
6. Add email notifications for key events (submission, assignment, resolution)
7. Implement GET /api/maintenance-requests/analytics endpoint
8. Test all workflow transitions and activity logging

**Deliverables:**
- Complete workflow API implementation
- Activity logging working
- Email notifications configured
- Analytics endpoint returning data

---

### Phase 3: UI Components & Pages (Day 3)

**Tasks:**
1. Create MaintenanceRequestForm component
2. Implement maintenance request list page with tabs
3. Create request detail page with timeline
4. Build AssignRequestModal component
5. Build ResolveRequestModal component
6. Add photo gallery integration for request photos
7. Implement filtering and search UI
8. Create analytics dashboard page with charts
9. Add status badges and priority indicators
10. Style with biophilic design system
11. Add responsive layouts for mobile
12. Test all user flows end-to-end

**Deliverables:**
- Complete UI implementation
- All user flows working
- Responsive design
- Integration with backend APIs
- End-to-end tests passing

---

## Testing Requirements

### Unit Tests

**Backend:**
- MaintenanceRequest model creation and validation
- API endpoint response formats
- Permission checks for each action
- Activity logging functionality
- Analytics calculations

**Frontend:**
- MaintenanceRequestForm validation
- Status badge rendering
- Filter functionality
- Modal components

---

### Integration Tests

**Complete User Flows:**
1. Resident submits request with photos → request created with SUBMITTED status
2. Operations staff assigns request → status changes to ASSIGNED, assignee notified
3. Assigned staff starts work → status changes to IN_PROGRESS
4. Assigned staff resolves request → status changes to RESOLVED, submitter notified
5. Resident views request history → complete timeline displayed
6. Operations manager views analytics → correct statistics displayed

**Permission Tests:**
1. Regular user cannot assign requests → 403 error
2. Regular user can only view their own requests
3. Operations staff can view and manage all requests
4. Assigned staff can update only their assigned requests

---

### Manual Testing Checklist

**Request Submission:**
- [ ] Can submit request with all required fields
- [ ] Photo upload works correctly
- [ ] Validation prevents submission with missing fields
- [ ] Success message and redirect after submission

**Request Assignment:**
- [ ] Operations staff can assign requests
- [ ] Regular users cannot assign requests
- [ ] Email notification sent to assignee
- [ ] Activity log records assignment

**Workflow Transitions:**
- [ ] Status transitions follow proper workflow (SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED)
- [ ] Cannot skip workflow steps
- [ ] Only authorized users can perform actions
- [ ] All transitions logged in activity history

**Photo Integration:**
- [ ] Photos upload successfully via Media Gallery integration
- [ ] Photos display in request details
- [ ] Lightbox viewer works for photo viewing
- [ ] Resolution photos separate from original photos

**Analytics:**
- [ ] Statistics calculate correctly
- [ ] Charts display accurate data
- [ ] Date range filtering works
- [ ] Export functionality works

**Permissions:**
- [ ] Users can only view requests they're authorized to see
- [ ] Action buttons only visible to authorized users
- [ ] API endpoints enforce permission checks
- [ ] Error messages clear for unauthorized actions

**Notifications:**
- [ ] Email sent when request submitted
- [ ] Email sent when request assigned
- [ ] Email sent when request resolved
- [ ] Notification preferences respected

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated with MaintenanceRequest models
- [ ] Database migrations tested in staging environment
- [ ] All API endpoints implemented and tested
- [ ] All UI components implemented and tested
- [ ] Permission system tested thoroughly
- [ ] Email notifications configured
- [ ] Media Gallery integration tested
- [ ] Analytics calculations verified
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] Documentation complete

### Deployment Steps

1. Backup production database
2. Run database migrations in production
3. Deploy backend API changes
4. Deploy frontend changes
5. Verify Media Gallery integration in production
6. Configure email notification settings
7. Smoke test critical flows
8. Monitor error logs

### Post-Deployment

- [ ] Can submit maintenance requests successfully
- [ ] Photos upload and display correctly
- [ ] Request assignment workflow functions
- [ ] Status transitions work correctly
- [ ] Email notifications sending
- [ ] Analytics dashboard displays data
- [ ] Permission system enforcing correctly
- [ ] Mobile responsive layouts working
- [ ] No console errors or API errors
- [ ] Monitor system for first 24 hours
- [ ] Gather user feedback on functionality

### Rollback Plan

If critical issues arise:
1. Revert frontend deployment
2. Revert API deployment
3. Database migrations cannot be rolled back easily - verify thoroughly in staging
4. Communicate status to users
5. Fix issues in development
6. Re-deploy when ready

---

## Additional Considerations

### Performance Optimization

- Index maintenance request queries by status, priority, and submittedAt
- Implement pagination for request lists (default 50 per page)
- Lazy load photos in gallery views
- Cache analytics calculations (refresh every 5 minutes)
- Use database query optimization for analytics

### Security

- Validate all user inputs on backend
- Sanitize rich text descriptions to prevent XSS
- Enforce file type and size limits on photo uploads
- Rate limit API endpoints to prevent abuse
- Log all maintenance activities for audit trail

### Accessibility

- Form inputs have proper labels and ARIA attributes
- Status badges have text alternatives
- Keyboard navigation supported throughout
- Color contrast meets WCAG AA standards
- Screen reader friendly

### Future Enhancements

- SMS notifications for urgent requests
- Recurring maintenance schedules (preventive maintenance)
- Parts inventory integration
- Cost tracking per request
- Mobile app for maintenance staff
- QR codes at locations for quick request submission
- Maintenance calendar view
- Vendor management for external contractors

---

**Spec Complete**

**Next Step:** Run `/create-tasks` to generate implementation task list.
