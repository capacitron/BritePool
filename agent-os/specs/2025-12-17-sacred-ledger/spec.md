# Specification: Sacred Ledger - Participation Tracking System

**Feature ID:** F014
**Priority:** High
**Effort:** Large (2 weeks / 14 days)
**Dependencies:** User Authentication (F002), Committee Management (F013), Events Calendar (F009), Task Management (F006)
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
Implement a comprehensive participation tracking system (the "Sacred Ledger") that logs and verifies member contributions across committees, tasks, events, and community service. The system automatically calculates equity units based on verified hours (10 hours = 1 unit), maintains an immutable audit trail of all contributions, and provides a three-stage verification workflow (member logs → committee leader verifies → admin approves) to ensure accuracy and accountability.

### Key Requirements
- Three-stage approval workflow: Member logs → Leader verifies → Admin approves
- Five activity types: Committee Work, Task Completion, Event Volunteering, Course Teaching, Community Service
- Automatic equity unit calculation (10 hours = 1 equity unit)
- Evidence/documentation required for entries over 8 hours
- Only APPROVED entries count toward equity units
- Immutable audit trail (cannot edit approved entries, only add corrections)
- Integration with User, Committee, Task, and Event models
- Comprehensive reporting and analytics for admins
- Member-facing dashboard showing contribution history and equity progress
- Real-time equity recalculation on approval

### Success Metrics
- 100% of participation entries follow three-stage approval workflow
- Zero equity calculation errors (10 hours = 1 unit verified)
- All entries over 8 hours have evidence/documentation attached
- Complete audit trail maintained for all participation activity
- Members can view real-time equity status and contribution history
- Committee leaders can efficiently process verification queue
- Admins can generate comprehensive participation reports

---

## User Flows

### Flow 1: Member Logs Participation Hours

**Actor:** Member (STEWARD, RESIDENT)
**Trigger:** Member completes work and wants to log hours

1. Member navigates to Dashboard → Sacred Ledger → Log Hours
2. System displays the log participation form
3. Member selects activity type from dropdown:
   - Committee Work
   - Task Completion
   - Event Volunteering
   - Course Teaching
   - Community Service
4. If Committee Work: Member selects committee from their committee memberships
5. If Task Completion: Member selects from their assigned completed tasks
6. If Event Volunteering: Member selects from events they attended
7. Member enters:
   - Date of activity
   - Hours worked (0.5 - 24 hours)
   - Description of work performed
8. If hours > 8: System requires evidence upload
   - Member uploads photo/document evidence
   - Evidence stored with entry
9. Member clicks "Submit for Verification"
10. System calls `POST /api/sacred-ledger/entries`
11. Entry created with status `PENDING_VERIFICATION`
12. System notifies relevant committee leader (if committee-related) or admin
13. Member sees confirmation with entry ID and status

**Success Criteria:** Entry created in PENDING_VERIFICATION status, notification sent

---

### Flow 2: Committee Leader Verifies Entry

**Actor:** Committee Leader (COMMITTEE_LEADER)
**Trigger:** Notification received for entry verification

1. Leader navigates to Dashboard → Sacred Ledger → Verification Queue
2. System calls `GET /api/sacred-ledger/verification-queue?role=leader`
3. System displays entries pending leader verification for their committees
4. Leader selects an entry to review
5. System shows entry details:
   - Member name and profile
   - Activity type and description
   - Hours claimed
   - Date of activity
   - Evidence (if any)
   - Related committee/task/event
6. Leader reviews the entry against committee records
7. Leader clicks "Verify" or "Reject":
   - **Verify:** System calls `POST /api/sacred-ledger/entries/{id}/verify`
     - Entry status changes to `PENDING_APPROVAL`
     - Admin receives notification for final approval
   - **Reject:** Leader enters rejection reason
     - System calls `POST /api/sacred-ledger/entries/{id}/reject`
     - Entry status changes to `REJECTED`
     - Member receives notification with reason
8. System removes entry from leader's queue
9. Leader proceeds to next entry or exits

**Success Criteria:** Entry moves to PENDING_APPROVAL or REJECTED with notification

---

### Flow 3: Admin Approves Entry

**Actor:** Admin (WEB_STEWARD, BOARD_CHAIR)
**Trigger:** Entry verified by committee leader

1. Admin navigates to Dashboard → Admin → Sacred Ledger Approvals
2. System calls `GET /api/sacred-ledger/verification-queue?role=admin`
3. System displays entries pending admin approval
4. Admin selects an entry to review
5. System shows complete entry history:
   - Original submission details
   - Leader who verified
   - Verification timestamp
   - Member's total hours and equity units to date
6. Admin reviews and clicks "Approve" or "Reject":
   - **Approve:** System calls `POST /api/sacred-ledger/entries/{id}/approve`
     - Entry status changes to `APPROVED`
     - Entry becomes immutable
     - System recalculates member's equity units
     - Member receives notification
   - **Reject:** Admin enters reason
     - System calls `POST /api/sacred-ledger/entries/{id}/reject`
     - Entry status changes to `REJECTED`
     - Member and leader notified
7. System updates member's equity unit count
8. Audit log records the approval with admin ID and timestamp

**Success Criteria:** Entry APPROVED, equity units recalculated, audit trail complete

---

### Flow 4: Member Views Equity Dashboard

**Actor:** Member (any authenticated user)
**Trigger:** Member wants to check participation status

1. Member navigates to Dashboard → Sacred Ledger → My Equity
2. System calls `GET /api/sacred-ledger/my-summary`
3. System displays equity dashboard with:
   - **Total Approved Hours:** Sum of all approved entries
   - **Total Equity Units:** Floor(approved_hours / 10)
   - **Hours to Next Unit:** Remaining hours needed for next unit
   - **Progress Bar:** Visual representation of progress
4. Dashboard shows breakdown by activity type (pie chart)
5. Member clicks "View History"
6. System calls `GET /api/sacred-ledger/my-entries`
7. System displays paginated list of all entries with:
   - Date, activity type, hours, status
   - Color-coded status badges
   - Filter by status, date range, activity type
8. Member can click any entry to see full details
9. For PENDING/REJECTED entries, member sees current status and any feedback

**Success Criteria:** Member sees accurate equity count and complete history

---

### Flow 5: Admin Generates Participation Report

**Actor:** Admin (WEB_STEWARD, BOARD_CHAIR)
**Trigger:** Quarterly report needed

1. Admin navigates to Dashboard → Admin → Sacred Ledger → Reports
2. System displays report configuration form
3. Admin selects:
   - Date range (start and end dates)
   - Activity types to include (multi-select)
   - Committees to include (multi-select or all)
   - Members to include (search/select or all)
   - Report format (PDF, CSV, or on-screen)
4. Admin clicks "Generate Report"
5. System calls `POST /api/sacred-ledger/reports/generate`
6. System compiles data:
   - Total hours by activity type
   - Hours by committee
   - Top contributors list
   - Equity unit distribution
   - Pending entries summary
7. If PDF: System generates and downloads PDF report
8. If CSV: System generates and downloads CSV export
9. If on-screen: System displays interactive dashboard with charts
10. Admin can save report configuration as template for future use

**Success Criteria:** Complete, accurate report generated in selected format

---

### Flow 6: Admin Adds Correction Entry

**Actor:** Admin (WEB_STEWARD, BOARD_CHAIR)
**Trigger:** Error discovered in approved entry

1. Admin navigates to entry detail page
2. System shows entry is APPROVED and immutable
3. Admin clicks "Add Correction"
4. System displays correction form:
   - Original entry displayed (read-only)
   - Correction type: Hours Adjustment, Void Entry, Add Hours
   - Hours to adjust (+/- value)
   - Reason for correction (required)
5. Admin enters correction details and submits
6. System calls `POST /api/sacred-ledger/entries/{id}/correct`
7. System creates new entry with:
   - Type: CORRECTION
   - Reference to original entry ID
   - Status: APPROVED (immediate)
   - Hours: Positive or negative adjustment
8. System recalculates member's equity units
9. Audit log records correction with:
   - Admin ID
   - Original entry ID
   - Correction reason
   - Timestamp
10. Member receives notification of correction

**Success Criteria:** Correction created, original entry unchanged, equity recalculated

---

## Database Schema

### Enums

```prisma
enum ActivityType {
  COMMITTEE_WORK
  TASK_COMPLETION
  EVENT_VOLUNTEERING
  COURSE_TEACHING
  COMMUNITY_SERVICE
}

enum ParticipationStatus {
  PENDING_VERIFICATION  // Awaiting leader verification
  PENDING_APPROVAL      // Leader verified, awaiting admin approval
  APPROVED              // Fully approved, counts toward equity
  REJECTED              // Rejected at any stage
  VOIDED                // Voided by correction entry
}

enum EntryType {
  STANDARD              // Normal participation entry
  CORRECTION            // Adjustment to previous entry
}
```

### New Models

```prisma
model ParticipationEntry {
  id                    String              @id @default(cuid())

  // Core fields
  userId                String
  user                  User                @relation(fields: [userId], references: [id])
  activityType          ActivityType
  entryType             EntryType           @default(STANDARD)
  status                ParticipationStatus @default(PENDING_VERIFICATION)

  // Hours and description
  hours                 Float               // 0.5 - 24 hours
  description           String              @db.Text
  activityDate          DateTime

  // Related entities (optional based on activity type)
  committeeId           String?
  committee             Committee?          @relation(fields: [committeeId], references: [id])
  taskId                String?
  task                  Task?               @relation(fields: [taskId], references: [id])
  eventId               String?
  event                 Event?              @relation(fields: [eventId], references: [id])
  courseId              String?
  course                Course?             @relation(fields: [courseId], references: [id])

  // Evidence
  evidenceUrls          String[]            // Array of uploaded file URLs
  evidenceRequired      Boolean             @default(false)

  // Correction reference (for CORRECTION type entries)
  correctionForId       String?
  correctionFor         ParticipationEntry? @relation("Corrections", fields: [correctionForId], references: [id])
  corrections           ParticipationEntry[] @relation("Corrections")

  // Workflow fields
  verifiedById          String?
  verifiedBy            User?               @relation("Verifications", fields: [verifiedById], references: [id])
  verifiedAt            DateTime?
  verificationNotes     String?             @db.Text

  approvedById          String?
  approvedBy            User?               @relation("Approvals", fields: [approvedById], references: [id])
  approvedAt            DateTime?
  approvalNotes         String?             @db.Text

  rejectedById          String?
  rejectedBy            User?               @relation("Rejections", fields: [rejectedById], references: [id])
  rejectedAt            DateTime?
  rejectionReason       String?             @db.Text

  // Timestamps
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  // Audit trail relation
  auditLogs             ParticipationAuditLog[]

  @@index([userId])
  @@index([status])
  @@index([activityType])
  @@index([committeeId])
  @@index([activityDate])
  @@index([createdAt])
}

model ParticipationAuditLog {
  id                    String              @id @default(cuid())

  entryId               String
  entry                 ParticipationEntry  @relation(fields: [entryId], references: [id])

  action                String              // CREATED, VERIFIED, APPROVED, REJECTED, CORRECTED
  performedById         String
  performedBy           User                @relation(fields: [performedById], references: [id])

  previousStatus        ParticipationStatus?
  newStatus             ParticipationStatus?
  previousHours         Float?
  newHours              Float?

  notes                 String?             @db.Text
  metadata              Json?               // Additional context data

  ipAddress             String?
  userAgent             String?

  createdAt             DateTime            @default(now())

  @@index([entryId])
  @@index([performedById])
  @@index([createdAt])
}

model MemberEquitySummary {
  id                    String              @id @default(cuid())

  userId                String              @unique
  user                  User                @relation(fields: [userId], references: [id])

  // Calculated totals (updated on approval)
  totalApprovedHours    Float               @default(0)
  totalEquityUnits      Int                 @default(0)

  // Breakdown by activity type
  committeeHours        Float               @default(0)
  taskHours             Float               @default(0)
  eventHours            Float               @default(0)
  teachingHours         Float               @default(0)
  serviceHours          Float               @default(0)

  // Entry counts
  totalEntries          Int                 @default(0)
  pendingEntries        Int                 @default(0)
  approvedEntries       Int                 @default(0)
  rejectedEntries       Int                 @default(0)

  // Timestamps
  lastEntryAt           DateTime?
  lastApprovalAt        DateTime?
  updatedAt             DateTime            @updatedAt

  @@index([userId])
  @@index([totalEquityUnits])
}

model SavedReportTemplate {
  id                    String              @id @default(cuid())

  name                  String
  description           String?

  createdById           String
  createdBy             User                @relation(fields: [createdById], references: [id])

  // Report configuration
  dateRangeType         String              // CUSTOM, LAST_30_DAYS, LAST_QUARTER, YEAR_TO_DATE
  activityTypes         ActivityType[]
  committeeIds          String[]
  includeAllMembers     Boolean             @default(true)
  memberIds             String[]
  groupBy               String[]            // activity_type, committee, member, month

  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([createdById])
}
```

### Model Updates

```prisma
// Add to existing User model
model User {
  // ... existing fields

  // Sacred Ledger relations
  participationEntries        ParticipationEntry[]
  verifiedEntries             ParticipationEntry[]     @relation("Verifications")
  approvedEntries             ParticipationEntry[]     @relation("Approvals")
  rejectedEntries             ParticipationEntry[]     @relation("Rejections")
  equitySummary               MemberEquitySummary?
  participationAuditLogs      ParticipationAuditLog[]
  savedReportTemplates        SavedReportTemplate[]
}

// Add to existing Committee model
model Committee {
  // ... existing fields
  participationEntries        ParticipationEntry[]
}

// Add to existing Task model
model Task {
  // ... existing fields
  participationEntries        ParticipationEntry[]
}

// Add to existing Event model
model Event {
  // ... existing fields
  participationEntries        ParticipationEntry[]
}

// Add to existing Course model
model Course {
  // ... existing fields
  participationEntries        ParticipationEntry[]
}
```

### Migration

```bash
npx prisma db push
```

---

## API Endpoints

### 1. Create Participation Entry

**Endpoint:** `POST /api/sacred-ledger/entries`
**Authentication:** Required (STEWARD, RESIDENT or higher)

**Request Body:**
```json
{
  "activityType": "COMMITTEE_WORK",
  "hours": 4.5,
  "description": "Attended weekly planning meeting and prepared agenda for next month",
  "activityDate": "2025-12-15",
  "committeeId": "cm123abc",
  "evidenceUrls": []
}
```

**Response (201 Created):**
```json
{
  "id": "entry123",
  "userId": "user456",
  "activityType": "COMMITTEE_WORK",
  "hours": 4.5,
  "description": "Attended weekly planning meeting and prepared agenda for next month",
  "activityDate": "2025-12-15T00:00:00.000Z",
  "status": "PENDING_VERIFICATION",
  "committeeId": "cm123abc",
  "committeeName": "Planning Committee",
  "evidenceRequired": false,
  "createdAt": "2025-12-15T14:30:00.000Z"
}
```

**Validation Rules:**
- Hours must be between 0.5 and 24
- Activity date cannot be in the future
- Activity date cannot be more than 90 days in the past
- Evidence required if hours > 8
- Committee ID required for COMMITTEE_WORK
- Task ID required for TASK_COMPLETION
- Event ID required for EVENT_VOLUNTEERING
- Course ID required for COURSE_TEACHING

**Error Cases:**
- 400: Invalid hours range, missing required fields, invalid activity date
- 401: Not authenticated
- 403: User not a member of selected committee
- 422: Evidence required but not provided

---

### 2. Get My Entries

**Endpoint:** `GET /api/sacred-ledger/my-entries`
**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (PENDING_VERIFICATION, PENDING_APPROVAL, APPROVED, REJECTED)
- `activityType` (optional): Filter by activity type
- `startDate` (optional): Filter entries from date
- `endDate` (optional): Filter entries to date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "entries": [
    {
      "id": "entry123",
      "activityType": "COMMITTEE_WORK",
      "hours": 4.5,
      "description": "Attended weekly planning meeting...",
      "activityDate": "2025-12-15T00:00:00.000Z",
      "status": "APPROVED",
      "committeeName": "Planning Committee",
      "verifiedAt": "2025-12-16T10:00:00.000Z",
      "approvedAt": "2025-12-16T14:00:00.000Z",
      "createdAt": "2025-12-15T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 3. Get My Equity Summary

**Endpoint:** `GET /api/sacred-ledger/my-summary`
**Authentication:** Required

**Response (200 OK):**
```json
{
  "totalApprovedHours": 87.5,
  "totalEquityUnits": 8,
  "hoursToNextUnit": 2.5,
  "progressPercent": 75,
  "breakdown": {
    "committeeHours": 45.0,
    "taskHours": 20.0,
    "eventHours": 12.5,
    "teachingHours": 5.0,
    "serviceHours": 5.0
  },
  "counts": {
    "totalEntries": 52,
    "pendingEntries": 3,
    "approvedEntries": 47,
    "rejectedEntries": 2
  },
  "lastEntryAt": "2025-12-15T14:30:00.000Z",
  "lastApprovalAt": "2025-12-14T16:00:00.000Z"
}
```

---

### 4. Get Verification Queue

**Endpoint:** `GET /api/sacred-ledger/verification-queue`
**Authentication:** Required (COMMITTEE_LEADER or higher)

**Query Parameters:**
- `role`: "leader" (committee leader queue) or "admin" (admin approval queue)
- `committeeId` (optional): Filter by committee (leaders only)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200 OK):**
```json
{
  "entries": [
    {
      "id": "entry789",
      "user": {
        "id": "user123",
        "name": "John Doe",
        "avatarUrl": "/avatars/john.jpg"
      },
      "activityType": "COMMITTEE_WORK",
      "hours": 6.0,
      "description": "Led monthly committee meeting and drafted policy proposal",
      "activityDate": "2025-12-14T00:00:00.000Z",
      "status": "PENDING_VERIFICATION",
      "committeeName": "Policy Committee",
      "committeeId": "cm456def",
      "hasEvidence": true,
      "evidenceUrls": ["/uploads/evidence/doc123.pdf"],
      "createdAt": "2025-12-14T18:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### 5. Verify Entry (Committee Leader)

**Endpoint:** `POST /api/sacred-ledger/entries/{id}/verify`
**Authentication:** Required (COMMITTEE_LEADER of related committee)

**Request Body:**
```json
{
  "notes": "Confirmed attendance at meeting, work completed as described"
}
```

**Response (200 OK):**
```json
{
  "id": "entry789",
  "status": "PENDING_APPROVAL",
  "verifiedBy": {
    "id": "leader456",
    "name": "Jane Smith"
  },
  "verifiedAt": "2025-12-15T10:00:00.000Z",
  "verificationNotes": "Confirmed attendance at meeting, work completed as described"
}
```

**Error Cases:**
- 400: Entry not in PENDING_VERIFICATION status
- 403: User is not leader of the related committee
- 404: Entry not found

---

### 6. Approve Entry (Admin)

**Endpoint:** `POST /api/sacred-ledger/entries/{id}/approve`
**Authentication:** Required (WEB_STEWARD, BOARD_CHAIR)

**Request Body:**
```json
{
  "notes": "Approved after verification by committee leader"
}
```

**Response (200 OK):**
```json
{
  "id": "entry789",
  "status": "APPROVED",
  "approvedBy": {
    "id": "admin789",
    "name": "Admin User"
  },
  "approvedAt": "2025-12-15T14:00:00.000Z",
  "approvalNotes": "Approved after verification by committee leader",
  "equityUpdate": {
    "previousHours": 81.5,
    "newHours": 87.5,
    "previousUnits": 8,
    "newUnits": 8
  }
}
```

**Error Cases:**
- 400: Entry not in PENDING_APPROVAL status
- 403: User is not an admin
- 404: Entry not found

---

### 7. Reject Entry

**Endpoint:** `POST /api/sacred-ledger/entries/{id}/reject`
**Authentication:** Required (COMMITTEE_LEADER or higher)

**Request Body:**
```json
{
  "reason": "Hours do not match committee attendance records. Please resubmit with correct hours."
}
```

**Response (200 OK):**
```json
{
  "id": "entry789",
  "status": "REJECTED",
  "rejectedBy": {
    "id": "leader456",
    "name": "Jane Smith"
  },
  "rejectedAt": "2025-12-15T10:30:00.000Z",
  "rejectionReason": "Hours do not match committee attendance records..."
}
```

---

### 8. Add Correction Entry

**Endpoint:** `POST /api/sacred-ledger/entries/{id}/correct`
**Authentication:** Required (WEB_STEWARD, BOARD_CHAIR)

**Request Body:**
```json
{
  "correctionType": "HOURS_ADJUSTMENT",
  "adjustmentHours": -2.0,
  "reason": "Original entry included break time that should not count toward participation hours"
}
```

**Response (201 Created):**
```json
{
  "id": "correction123",
  "entryType": "CORRECTION",
  "correctionForId": "entry789",
  "hours": -2.0,
  "status": "APPROVED",
  "description": "CORRECTION: Original entry included break time...",
  "approvedAt": "2025-12-15T16:00:00.000Z",
  "equityUpdate": {
    "previousHours": 87.5,
    "newHours": 85.5,
    "previousUnits": 8,
    "newUnits": 8
  }
}
```

---

### 9. Generate Report

**Endpoint:** `POST /api/sacred-ledger/reports/generate`
**Authentication:** Required (WEB_STEWARD, BOARD_CHAIR)

**Request Body:**
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "activityTypes": ["COMMITTEE_WORK", "TASK_COMPLETION", "EVENT_VOLUNTEERING"],
  "committeeIds": [],
  "memberIds": [],
  "includeAllMembers": true,
  "groupBy": ["activity_type", "month"],
  "format": "json"
}
```

**Response (200 OK):**
```json
{
  "reportId": "report456",
  "generatedAt": "2025-12-15T16:30:00.000Z",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-12-31"
  },
  "summary": {
    "totalHours": 12450.5,
    "totalEquityUnits": 1245,
    "totalEntries": 856,
    "uniqueMembers": 128
  },
  "byActivityType": {
    "COMMITTEE_WORK": { "hours": 5200.0, "entries": 320 },
    "TASK_COMPLETION": { "hours": 3100.5, "entries": 215 },
    "EVENT_VOLUNTEERING": { "hours": 4150.0, "entries": 321 }
  },
  "byMonth": [
    { "month": "2025-01", "hours": 980.5, "entries": 67 },
    { "month": "2025-02", "hours": 1050.0, "entries": 72 }
  ],
  "topContributors": [
    { "userId": "user123", "name": "John Doe", "hours": 245.5, "units": 24 }
  ]
}
```

---

### 10. Get Leaderboard

**Endpoint:** `GET /api/sacred-ledger/leaderboard`
**Authentication:** Required

**Query Parameters:**
- `period`: "all_time", "year", "quarter", "month"
- `limit`: Number of entries (default: 10, max: 50)

**Response (200 OK):**
```json
{
  "period": "year",
  "periodLabel": "2025",
  "leaders": [
    {
      "rank": 1,
      "userId": "user123",
      "name": "John Doe",
      "avatarUrl": "/avatars/john.jpg",
      "totalHours": 245.5,
      "equityUnits": 24,
      "entryCount": 48
    },
    {
      "rank": 2,
      "userId": "user456",
      "name": "Jane Smith",
      "avatarUrl": "/avatars/jane.jpg",
      "totalHours": 198.0,
      "equityUnits": 19,
      "entryCount": 35
    }
  ],
  "currentUserRank": 15,
  "currentUserStats": {
    "totalHours": 87.5,
    "equityUnits": 8
  }
}
```

---

## UI Components

### 1. Sacred Ledger Dashboard Page

**Location:** `app/dashboard/sacred-ledger/page.tsx`

**Features:**
- Equity summary card with progress visualization
- Hours breakdown by activity type (pie chart)
- Recent entries list with status badges
- Quick log button to open entry form
- Pending entries alert banner

**Component Structure:**
```tsx
export default function SacredLedgerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sacred Ledger"
        subtitle="Track your participation and equity units"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <EquitySummaryCard />
        <TotalHoursCard />
        <PendingEntriesCard />
        <NextUnitProgressCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityBreakdownChart />
        <MonthlyTrendChart />
      </div>

      <RecentEntriesTable />

      <LogHoursModal />
    </div>
  );
}
```

---

### 2. Log Hours Form Modal

**Location:** `app/components/sacred-ledger/LogHoursModal.tsx`

**Features:**
- Activity type selection with dynamic form fields
- Committee/task/event selector based on activity type
- Hours input with validation (0.5 - 24)
- Date picker (max 90 days past)
- Rich text description editor
- File upload for evidence (drag & drop)
- Form validation with error messages

**Component Structure:**
```tsx
export function LogHoursModal({ open, onClose }: LogHoursModalProps) {
  const [activityType, setActivityType] = useState<ActivityType | null>(null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Participation Hours</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ActivityTypeSelect
            value={activityType}
            onChange={setActivityType}
          />

          {activityType === 'COMMITTEE_WORK' && (
            <CommitteeSelect />
          )}

          <div className="grid grid-cols-2 gap-4">
            <HoursInput />
            <DatePicker maxPastDays={90} />
          </div>

          <DescriptionEditor />

          {hoursRequireEvidence && (
            <EvidenceUploader />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Submit for Verification</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3. Verification Queue Page

**Location:** `app/dashboard/sacred-ledger/verification/page.tsx`

**Features:**
- Tabbed interface: Leader Queue / Admin Queue
- Entry cards with member info, description, evidence preview
- Bulk selection for batch verification
- Quick actions: Verify, Reject with reason
- Filter by committee, date range
- Sort by date, hours, member

---

### 4. Entry Detail Modal

**Location:** `app/components/sacred-ledger/EntryDetailModal.tsx`

**Features:**
- Full entry details display
- Status timeline (Created → Verified → Approved)
- Evidence viewer (images, documents)
- Action buttons based on user role and entry status
- Rejection reason display for rejected entries
- Correction history for corrected entries

---

### 5. Reports Dashboard (Admin)

**Location:** `app/dashboard/admin/sacred-ledger/reports/page.tsx`

**Features:**
- Report builder with filter options
- Date range picker with presets
- Activity type and committee filters
- Member search and selection
- Grouping options (by type, committee, member, month)
- Export buttons (PDF, CSV)
- Saved report templates

---

### 6. Leaderboard Component

**Location:** `app/components/sacred-ledger/Leaderboard.tsx`

**Features:**
- Period selector (All Time, Year, Quarter, Month)
- Ranked list with avatars and stats
- Current user highlight
- Animated rank changes
- Trophy icons for top 3

---

## Implementation Details

### Phase 1: Database & Core Models (Days 1-3)

**Day 1:**
- Create Prisma schema with all enums and models
- Run migrations
- Create seed data for testing
- Set up audit log triggers

**Day 2:**
- Implement `createParticipationEntry` service
- Implement `calculateEquityUnits` utility
- Implement `updateMemberEquitySummary` service
- Write unit tests for equity calculation

**Day 3:**
- Implement `createAuditLog` service
- Implement evidence file upload handler
- Set up S3/Cloudinary integration for evidence storage
- Implement validation rules

### Phase 2: API Endpoints (Days 4-6)

**Day 4:**
- `POST /api/sacred-ledger/entries`
- `GET /api/sacred-ledger/my-entries`
- `GET /api/sacred-ledger/my-summary`
- Entry validation middleware

**Day 5:**
- `GET /api/sacred-ledger/verification-queue`
- `POST /api/sacred-ledger/entries/{id}/verify`
- `POST /api/sacred-ledger/entries/{id}/approve`
- `POST /api/sacred-ledger/entries/{id}/reject`

**Day 6:**
- `POST /api/sacred-ledger/entries/{id}/correct`
- `POST /api/sacred-ledger/reports/generate`
- `GET /api/sacred-ledger/leaderboard`
- Integration tests

### Phase 3: UI Components (Days 7-10)

**Day 7:**
- Sacred Ledger dashboard layout
- Equity summary cards
- Activity breakdown charts

**Day 8:**
- Log Hours modal
- Activity type selector
- Evidence uploader

**Day 9:**
- My entries table with filters
- Entry detail modal
- Status badges and timeline

**Day 10:**
- Verification queue page
- Bulk verification actions
- Rejection modal with reason

### Phase 4: Admin Features (Days 11-13)

**Day 11:**
- Admin approval queue
- Correction entry flow
- Admin notifications

**Day 12:**
- Reports dashboard
- Report builder
- Export functionality (PDF, CSV)

**Day 13:**
- Saved report templates
- Leaderboard component
- Period filtering

### Phase 5: Testing & Polish (Day 14)

**Day 14:**
- End-to-end testing
- Performance optimization
- Documentation
- Bug fixes

---

### Equity Calculation Logic

```typescript
// lib/sacred-ledger/equity.ts

export const HOURS_PER_EQUITY_UNIT = 10;

export function calculateEquityUnits(totalApprovedHours: number): number {
  return Math.floor(totalApprovedHours / HOURS_PER_EQUITY_UNIT);
}

export function getHoursToNextUnit(totalApprovedHours: number): number {
  const remainder = totalApprovedHours % HOURS_PER_EQUITY_UNIT;
  return HOURS_PER_EQUITY_UNIT - remainder;
}

export function getProgressPercent(totalApprovedHours: number): number {
  const remainder = totalApprovedHours % HOURS_PER_EQUITY_UNIT;
  return Math.round((remainder / HOURS_PER_EQUITY_UNIT) * 100);
}

export async function recalculateMemberEquity(userId: string): Promise<void> {
  const entries = await prisma.participationEntry.findMany({
    where: {
      userId,
      status: 'APPROVED',
      entryType: { in: ['STANDARD', 'CORRECTION'] }
    }
  });

  const totals = entries.reduce((acc, entry) => {
    acc.total += entry.hours;
    switch (entry.activityType) {
      case 'COMMITTEE_WORK': acc.committee += entry.hours; break;
      case 'TASK_COMPLETION': acc.task += entry.hours; break;
      case 'EVENT_VOLUNTEERING': acc.event += entry.hours; break;
      case 'COURSE_TEACHING': acc.teaching += entry.hours; break;
      case 'COMMUNITY_SERVICE': acc.service += entry.hours; break;
    }
    return acc;
  }, { total: 0, committee: 0, task: 0, event: 0, teaching: 0, service: 0 });

  await prisma.memberEquitySummary.upsert({
    where: { userId },
    create: {
      userId,
      totalApprovedHours: totals.total,
      totalEquityUnits: calculateEquityUnits(totals.total),
      committeeHours: totals.committee,
      taskHours: totals.task,
      eventHours: totals.event,
      teachingHours: totals.teaching,
      serviceHours: totals.service,
      approvedEntries: entries.length
    },
    update: {
      totalApprovedHours: totals.total,
      totalEquityUnits: calculateEquityUnits(totals.total),
      committeeHours: totals.committee,
      taskHours: totals.task,
      eventHours: totals.event,
      teachingHours: totals.teaching,
      serviceHours: totals.service,
      approvedEntries: entries.length,
      lastApprovalAt: new Date()
    }
  });
}
```

---

## Testing Requirements

### Unit Tests

```typescript
// __tests__/sacred-ledger/equity.test.ts

describe('Equity Calculations', () => {
  test('calculates correct equity units', () => {
    expect(calculateEquityUnits(0)).toBe(0);
    expect(calculateEquityUnits(9.9)).toBe(0);
    expect(calculateEquityUnits(10)).toBe(1);
    expect(calculateEquityUnits(25)).toBe(2);
    expect(calculateEquityUnits(100)).toBe(10);
  });

  test('calculates hours to next unit', () => {
    expect(getHoursToNextUnit(0)).toBe(10);
    expect(getHoursToNextUnit(7.5)).toBe(2.5);
    expect(getHoursToNextUnit(10)).toBe(10);
    expect(getHoursToNextUnit(15)).toBe(5);
  });

  test('calculates progress percent', () => {
    expect(getProgressPercent(0)).toBe(0);
    expect(getProgressPercent(5)).toBe(50);
    expect(getProgressPercent(7.5)).toBe(75);
    expect(getProgressPercent(10)).toBe(0);
  });
});

describe('Entry Validation', () => {
  test('rejects hours outside valid range', async () => {
    await expect(createEntry({ hours: 0.4 })).rejects.toThrow();
    await expect(createEntry({ hours: 25 })).rejects.toThrow();
  });

  test('requires evidence for entries over 8 hours', async () => {
    await expect(createEntry({ hours: 9, evidenceUrls: [] }))
      .rejects.toThrow('Evidence required');
  });

  test('rejects future dates', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await expect(createEntry({ activityDate: tomorrow }))
      .rejects.toThrow('Date cannot be in the future');
  });
});
```

### Integration Tests

```typescript
// __tests__/sacred-ledger/workflow.test.ts

describe('Three-Stage Workflow', () => {
  test('entry goes through complete workflow', async () => {
    // Create entry as member
    const entry = await createEntry(memberSession, entryData);
    expect(entry.status).toBe('PENDING_VERIFICATION');

    // Verify as committee leader
    const verified = await verifyEntry(leaderSession, entry.id);
    expect(verified.status).toBe('PENDING_APPROVAL');

    // Approve as admin
    const approved = await approveEntry(adminSession, entry.id);
    expect(approved.status).toBe('APPROVED');

    // Check equity updated
    const summary = await getMemberSummary(memberSession);
    expect(summary.totalApprovedHours).toBe(entryData.hours);
  });

  test('rejected entry does not count toward equity', async () => {
    const entry = await createEntry(memberSession, entryData);
    await rejectEntry(leaderSession, entry.id, 'Invalid hours');

    const summary = await getMemberSummary(memberSession);
    expect(summary.totalApprovedHours).toBe(0);
    expect(summary.rejectedEntries).toBe(1);
  });

  test('correction adjusts equity correctly', async () => {
    // Approve initial entry
    const entry = await approveEntryWorkflow(10);
    let summary = await getMemberSummary(memberSession);
    expect(summary.totalEquityUnits).toBe(1);

    // Add correction reducing hours
    await createCorrection(adminSession, entry.id, -5);
    summary = await getMemberSummary(memberSession);
    expect(summary.totalApprovedHours).toBe(5);
    expect(summary.totalEquityUnits).toBe(0);
  });
});
```

### Manual Testing Checklist

- [ ] Log hours with each activity type
- [ ] Verify evidence upload works for entries > 8 hours
- [ ] Committee leader can only see their committee's entries
- [ ] Admin can see all pending approvals
- [ ] Verify action moves entry to PENDING_APPROVAL
- [ ] Approve action moves entry to APPROVED and updates equity
- [ ] Reject action records reason and notifies member
- [ ] Equity calculation is accurate (10 hours = 1 unit)
- [ ] Corrections properly adjust hours and equity
- [ ] Leaderboard updates correctly
- [ ] Reports generate with correct data
- [ ] CSV and PDF exports contain accurate information
- [ ] Audit log records all actions with timestamps
- [ ] Notifications sent at each workflow stage

---

## Deployment Checklist

### Pre-Deployment

- [ ] All migrations tested on staging database
- [ ] Seed data created for QA testing
- [ ] Environment variables set:
  - `EVIDENCE_UPLOAD_BUCKET`
  - `EVIDENCE_MAX_FILE_SIZE_MB`
- [ ] S3/Cloudinary bucket configured for evidence uploads
- [ ] Notification templates created
- [ ] Admin users have correct roles

### Deployment Steps

1. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

2. Initialize MemberEquitySummary for existing users:
   ```bash
   npx ts-node scripts/init-equity-summaries.ts
   ```

3. Deploy application code

4. Verify API endpoints responding:
   ```bash
   curl -X GET https://api.britepool.org/api/sacred-ledger/my-summary
   ```

5. Run smoke tests on staging

6. Enable feature for users

### Post-Deployment

- [ ] Verify entry creation works end-to-end
- [ ] Test verification workflow with real committee leader
- [ ] Test approval workflow with admin
- [ ] Verify equity calculations are correct
- [ ] Check audit logs are being created
- [ ] Monitor error rates for first 24 hours
- [ ] Verify notifications are being sent
- [ ] Check dashboard performance metrics

---

## Security Considerations

- Entries cannot be edited after APPROVED status
- Only corrections can modify equity after approval
- All modifications recorded in audit log
- Committee leaders can only verify their own committee's entries
- Evidence uploads validated for file type and size
- Rate limiting on entry creation (max 10 per hour per user)
- Admin actions require confirmation dialogs

---

## Future Enhancements

1. Mobile app for quick hour logging
2. QR code check-in for events
3. Automated task completion logging integration
4. Gamification with badges and achievements
5. Public recognition feed for approved entries
6. Integration with external volunteer tracking systems
7. Bulk entry upload via CSV
8. Scheduled reminder notifications for pending approvals
