# Specification: Application & Onboarding Workflow

**Feature ID:** F021
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** Authentication (F002), Document Management (F020), Committees (F013)
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
Implement a comprehensive multi-step application and onboarding system that allows prospective members to submit applications, upload required documentation, schedule interviews with committee leaders, and complete onboarding steps. Includes an admin review dashboard for tracking application status and automated email notifications for each step of the process.

### Key Requirements
- Multi-step application form with progress tracking
- Document upload system (resume, certifications, references)
- Interview scheduling integration with committee leaders
- Onboarding checklist with step completion tracking
- Admin review dashboard with status management
- Automated email notifications for status changes
- Application versioning and resubmission workflow
- Role-based access for reviewers and applicants

### Success Metrics
- 100% of applications tracked through complete workflow
- All required documents uploaded before review
- Interview scheduling automated with committee leader availability
- Admin can review and approve/reject applications with comments
- Applicants receive timely email notifications for each status change
- Onboarding steps completed before full member access granted
- Complete audit trail of application process

---

## User Flows

### Flow 1: Prospective Member Submits Application

```
1. Prospective user visits public site
2. User clicks "Apply for Membership" button
3. User redirected to /apply (public route, no login required)
4. User sees multi-step application form:
   Step 1: Personal Information
     - Full Name
     - Email Address
     - Phone Number
     - Current Location
     - Preferred Language (English/Spanish)
   Step 2: Occupational Request & Interests
     - Desired Role (dropdown: Steward, Partner, Resident, Practitioner)
     - Areas of Interest (checkboxes: Governance, Wealth, Education, Health, Operations)
     - Skills & Expertise (textarea)
     - Why Join Statement (rich text)
   Step 3: Document Upload
     - Resume/CV (PDF, DOC, required)
     - Certifications (PDF, optional, multiple)
     - References (PDF, TXT, optional, multiple)
   Step 4: Review & Submit
     - Summary of all entered information
     - Consent checkbox for processing application
5. User completes each step (progress bar shows 1/4, 2/4, etc.)
6. User uploads documents (drag-and-drop or file picker)
7. User reviews all information
8. User submits application → POST /api/applications/submit
9. System validates all required fields
10. Application record created with status: SUBMITTED
11. Confirmation email sent to applicant
12. Admin notification email sent to committee leaders
13. User redirected to /apply/confirmation page with application ID
14. User can bookmark link to track status: /apply/status/[applicationId]
```

### Flow 2: Admin Reviews Application

```
1. Admin/Committee Leader logs in
2. Admin navigates to /dashboard/admin/applications
3. Admin sees application dashboard:
   - List of all applications with filters (status, date, role)
   - Sortable columns (submitted date, name, status, assigned reviewer)
   - Search by name or email
   - Status badges (Submitted, Under Review, Interview Scheduled, Approved, Rejected)
4. Admin clicks on application row
5. Admin views full application detail page:
   - Applicant information
   - Occupational request and interests
   - Uploaded documents (viewable in-browser, downloadable)
   - Application timeline (submission, reviews, status changes)
   - Internal notes section
6. Admin can take actions:
   - Assign to reviewer (select committee leader)
   - Update status (dropdown: Under Review, Interview Needed, Approved, Rejected)
   - Add internal notes (visible to admins only)
   - Schedule interview (opens interview scheduler)
   - Request additional documents (triggers email to applicant)
7. Admin updates status → POST /api/applications/[id]/status
8. System logs status change with timestamp and admin ID
9. Automated email sent to applicant with status update
10. If status = APPROVED → Onboarding workflow initiated
```

### Flow 3: Interview Scheduling

```
1. Admin/Committee Leader on application detail page
2. Admin clicks "Schedule Interview" button
3. Interview scheduling modal opens:
   - Select committee members (multi-select from committee leaders)
   - Interview date/time picker
   - Duration (dropdown: 30min, 1hr, 1.5hr)
   - Location (dropdown: Virtual - Zoom, Phone, In-Person)
   - Virtual meeting link (auto-populated for Zoom, or manual entry)
   - Interview notes/agenda (optional textarea)
4. Admin submits → POST /api/applications/[id]/interviews
5. Interview record created and linked to application
6. Application status updated to INTERVIEW_SCHEDULED
7. Email notifications sent to:
   - Applicant (with date, time, location, meeting link)
   - Committee members (calendar invite with applicant details)
8. Interview appears in Events Calendar (EventType: INTERVIEW)
9. After interview, committee leader can:
   - Mark interview as completed
   - Add interview notes
   - Update application status
```

### Flow 4: Applicant Tracks Application Status

```
1. Applicant receives confirmation email with tracking link
2. Applicant clicks link → /apply/status/[applicationId]
3. Applicant sees status tracking page (public, no login required):
   - Application ID and submission date
   - Current status badge
   - Progress timeline with completed steps:
     ✓ Application Submitted (date)
     ✓ Under Review (date)
     ○ Interview Scheduled (pending)
     ○ Decision Pending
     ○ Approved / Rejected
   - Next steps information
   - Contact information for questions
4. If interview scheduled, applicant sees:
   - Interview date and time
   - Location/Virtual link
   - Committee members interviewing
   - Add to Calendar button (iCal download)
5. If additional documents requested:
   - Upload form appears on status page
   - Applicant can upload missing documents
   - Notification sent when documents uploaded
```

### Flow 5: Approved Application - Onboarding Workflow

```
1. Admin approves application (status → APPROVED)
2. System automatically creates onboarding checklist
3. Applicant receives approval email with instructions:
   - Congratulations message
   - Onboarding checklist link: /onboarding/[applicationId]
   - Credentials creation link
4. Applicant navigates to onboarding page
5. Applicant sees onboarding checklist:
   ☐ Create Account & Set Password
   ☐ Review & Accept Membership Contract
   ☐ Complete Member Profile
   ☐ Set Up Payment Method (if applicable)
   ☐ Join Assigned Committees
   ☐ Schedule Orientation Session
   ☐ Review Member Handbook
6. Applicant completes each step:
   - Click step → redirected to relevant page
   - Complete action → step marked complete
   - Progress bar updates (3/7 completed)
7. System tracks completion:
   - Each ApplicationStep has completedAt timestamp
   - Email reminders sent for incomplete steps (after 48hrs, 1 week)
8. When all steps completed:
   - Application status updated to ONBOARDED
   - User role updated to approved role (STEWARD, PARTNER, etc.)
   - Welcome email sent with full platform access
   - Admin notification of completed onboarding
```

### Flow 6: Application Rejection & Resubmission

```
1. Admin rejects application (status → REJECTED)
2. Admin required to provide rejection reason (textarea)
3. System logs rejection with reason
4. Applicant receives rejection email:
   - Polite explanation
   - Rejection reason
   - Option to resubmit after addressing concerns
   - Resubmission link (if allowed)
5. If resubmission allowed:
   - Applicant clicks link → /apply/resubmit/[applicationId]
   - Application form pre-populated with previous data
   - Applicant can edit and resubmit
   - New application version created (linked to original)
   - Original application status: RESUBMITTED
   - New application status: SUBMITTED
```

---

## Database Schema

### New Model: Application

```prisma
model Application {
  id              String   @id @default(cuid())

  // Applicant Information
  fullName        String
  email           String
  phone           String?
  location        String?
  preferredLanguage String @default("en")

  // Occupational Request
  desiredRole     UserRole
  areasOfInterest CommitteeType[]
  skills          String?
  whyJoinStatement String

  // Status & Workflow
  status          ApplicationStatus @default(SUBMITTED)
  assignedReviewerId String?
  assignedReviewer   User? @relation("ApplicationsReviewed", fields: [assignedReviewerId], references: [id])

  // Rejection/Notes
  rejectionReason String?
  internalNotes   String?

  // Relations
  documents       ApplicationDocument[]
  interviews      Interview[]
  steps           ApplicationStep[]
  statusHistory   ApplicationStatusHistory[]

  // Version Control (for resubmissions)
  version         Int      @default(1)
  previousVersionId String?
  previousVersion   Application? @relation("ApplicationVersions", fields: [previousVersionId], references: [id])
  nextVersions      Application[] @relation("ApplicationVersions")

  // Linked User (after approval)
  userId          String?  @unique
  user            User?    @relation("UserApplication", fields: [userId], references: [id])

  // Timestamps
  submittedAt     DateTime @default(now())
  reviewedAt      DateTime?
  approvedAt      DateTime?
  rejectedAt      DateTime?
  onboardedAt     DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([email])
  @@index([status])
  @@index([submittedAt])
  @@index([assignedReviewerId])
}

enum ApplicationStatus {
  SUBMITTED
  UNDER_REVIEW
  INTERVIEW_SCHEDULED
  INTERVIEW_COMPLETED
  ADDITIONAL_INFO_REQUESTED
  APPROVED
  REJECTED
  RESUBMITTED
  ONBOARDING
  ONBOARDED
}
```

### New Model: ApplicationDocument

```prisma
model ApplicationDocument {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  documentType  DocumentType
  filename      String
  fileUrl       String    // S3 or local storage URL
  fileSize      Int       // Size in bytes
  mimeType      String

  uploadedAt    DateTime @default(now())

  @@index([applicationId])
  @@index([documentType])
}

enum DocumentType {
  RESUME
  CERTIFICATION
  REFERENCE
  COVER_LETTER
  OTHER
}
```

### New Model: Interview

```prisma
model Interview {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  // Interview Details
  scheduledAt   DateTime
  duration      Int       // Duration in minutes
  location      String    // "Virtual - Zoom", "Phone", "In-Person"
  virtualLink   String?
  agenda        String?

  // Participants
  interviewers  String[]  // Array of user IDs (committee members)

  // Completion
  status        InterviewStatus @default(SCHEDULED)
  completedAt   DateTime?
  notes         String?

  // Event Integration
  eventId       String?   @unique
  event         Event?    @relation("InterviewEvent", fields: [eventId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([applicationId])
  @@index([scheduledAt])
  @@index([status])
}

enum InterviewStatus {
  SCHEDULED
  RESCHEDULED
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

### New Model: ApplicationStep

```prisma
model ApplicationStep {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  stepType      OnboardingStepType
  title         String
  description   String?
  order         Int      @default(0)

  isRequired    Boolean  @default(true)
  isCompleted   Boolean  @default(false)
  completedAt   DateTime?

  // Metadata
  metadata      Json?    // Flexible field for step-specific data

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([applicationId])
  @@index([isCompleted])
}

enum OnboardingStepType {
  CREATE_ACCOUNT
  ACCEPT_CONTRACT
  COMPLETE_PROFILE
  SETUP_PAYMENT
  JOIN_COMMITTEES
  SCHEDULE_ORIENTATION
  REVIEW_HANDBOOK
  CUSTOM
}
```

### New Model: ApplicationStatusHistory

```prisma
model ApplicationStatusHistory {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  fromStatus    ApplicationStatus?
  toStatus      ApplicationStatus

  changedById   String?
  changedBy     User?    @relation("StatusChanges", fields: [changedById], references: [id])

  note          String?

  changedAt     DateTime @default(now())

  @@index([applicationId])
  @@index([changedAt])
}
```

### Updates to Existing Models

**User Model** (add relations):
```prisma
model User {
  // ... existing fields

  // Application Relations
  application          Application?  @relation("UserApplication")
  reviewingApplications Application[] @relation("ApplicationsReviewed")
  statusChanges        ApplicationStatusHistory[] @relation("StatusChanges")

  // ... existing relations
}
```

**Event Model** (add interview relation):
```prisma
model Event {
  // ... existing fields

  // Interview Integration
  interview     Interview? @relation("InterviewEvent")

  // ... existing relations
}
```

### Database Migration

Run Prisma migrations:
```bash
npx prisma db push
```

---

## API Endpoints

### 1. POST /api/applications/submit

**Purpose:** Submit a new membership application (public endpoint)

**Authentication:** None required (public endpoint)

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+1-555-0123",
  "location": "San Francisco, CA",
  "preferredLanguage": "en",
  "desiredRole": "PARTNER",
  "areasOfInterest": ["EDUCATION", "HEALTH"],
  "skills": "Web development, teaching, community organizing",
  "whyJoinStatement": "I want to contribute to building regenerative communities...",
  "documents": [
    {
      "documentType": "RESUME",
      "filename": "jane_smith_resume.pdf",
      "fileUrl": "s3://bucket/applications/abc123/resume.pdf",
      "fileSize": 256000,
      "mimeType": "application/pdf"
    }
  ]
}
```

**Logic:**
1. Validate all required fields
2. Check for duplicate application (same email within 30 days)
3. Create Application record with status: SUBMITTED
4. Create ApplicationDocument records for uploaded files
5. Initialize default onboarding steps (not visible until approved)
6. Send confirmation email to applicant
7. Send notification email to admins/committee leaders

**Response:**
```json
{
  "success": true,
  "applicationId": "app_clx123...",
  "trackingUrl": "/apply/status/app_clx123...",
  "message": "Application submitted successfully. Check your email for confirmation."
}
```

**Error Cases:**
- Missing required fields → 400
- Invalid email format → 400
- Duplicate application within 30 days → 409
- File upload failed → 500

---

### 2. GET /api/applications/[id]

**Purpose:** Get application details (public for applicant, protected for admin)

**Authentication:** Optional (public with applicationId, or authenticated admin)

**Query Parameters:**
- `accessToken` (optional): For applicant access without login

**Response:**
```json
{
  "application": {
    "id": "app_clx123...",
    "fullName": "Jane Smith",
    "email": "jane.smith@example.com",
    "desiredRole": "PARTNER",
    "areasOfInterest": ["EDUCATION", "HEALTH"],
    "status": "UNDER_REVIEW",
    "submittedAt": "2025-12-17T10:00:00Z",
    "documents": [
      {
        "id": "doc_456...",
        "documentType": "RESUME",
        "filename": "jane_smith_resume.pdf",
        "fileUrl": "s3://...",
        "uploadedAt": "2025-12-17T10:00:00Z"
      }
    ],
    "interviews": [
      {
        "id": "int_789...",
        "scheduledAt": "2025-12-20T14:00:00Z",
        "location": "Virtual - Zoom",
        "virtualLink": "https://zoom.us/j/123456789",
        "status": "SCHEDULED"
      }
    ],
    "statusHistory": [
      {
        "toStatus": "SUBMITTED",
        "changedAt": "2025-12-17T10:00:00Z"
      },
      {
        "toStatus": "UNDER_REVIEW",
        "changedAt": "2025-12-18T09:00:00Z",
        "changedBy": "Admin Name"
      }
    ]
  }
}
```

**Admin-only fields (when authenticated):**
- `internalNotes`
- `assignedReviewer`
- `rejectionReason`

**Error Cases:**
- Application not found → 404
- Unauthorized access → 403

---

### 3. GET /api/applications (Admin Only)

**Purpose:** List all applications with filtering and sorting

**Authentication:** Required, role: COMMITTEE_LEADER, BOARD_CHAIR, or WEB_STEWARD

**Query Parameters:**
- `status` (optional): Filter by ApplicationStatus
- `role` (optional): Filter by desiredRole
- `sortBy` (optional): Sort field (submittedAt, fullName, status)
- `sortOrder` (optional): asc or desc
- `page` (optional): Page number for pagination
- `limit` (optional): Results per page (default: 20)
- `search` (optional): Search by name or email

**Response:**
```json
{
  "applications": [
    {
      "id": "app_clx123...",
      "fullName": "Jane Smith",
      "email": "jane.smith@example.com",
      "desiredRole": "PARTNER",
      "status": "UNDER_REVIEW",
      "submittedAt": "2025-12-17T10:00:00Z",
      "assignedReviewer": {
        "id": "user_456...",
        "name": "John Reviewer"
      },
      "documentCount": 3,
      "hasInterview": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### 4. PATCH /api/applications/[id]/status

**Purpose:** Update application status (Admin only)

**Authentication:** Required, role: COMMITTEE_LEADER, BOARD_CHAIR, or WEB_STEWARD

**Request Body:**
```json
{
  "status": "APPROVED",
  "note": "Strong candidate with relevant skills",
  "assignedReviewerId": "user_789...",
  "internalNotes": "Follow up on references"
}
```

**Logic:**
1. Validate status transition is allowed
2. Create ApplicationStatusHistory record
3. Update Application.status
4. If status = APPROVED:
   - Create default onboarding steps
   - Send approval email with onboarding link
5. If status = REJECTED:
   - Require rejection reason
   - Send rejection email
6. Send notification email to applicant
7. Log audit trail

**Response:**
```json
{
  "success": true,
  "application": {
    "id": "app_clx123...",
    "status": "APPROVED",
    "updatedAt": "2025-12-18T10:30:00Z"
  }
}
```

**Error Cases:**
- Unauthorized → 403
- Invalid status transition → 400
- Application not found → 404

---

### 5. POST /api/applications/[id]/interviews

**Purpose:** Schedule interview for application

**Authentication:** Required, role: COMMITTEE_LEADER, BOARD_CHAIR, or WEB_STEWARD

**Request Body:**
```json
{
  "scheduledAt": "2025-12-20T14:00:00Z",
  "duration": 60,
  "location": "Virtual - Zoom",
  "virtualLink": "https://zoom.us/j/123456789",
  "agenda": "Discuss candidate background and fit for partner role",
  "interviewers": ["user_123...", "user_456..."]
}
```

**Logic:**
1. Create Interview record
2. Update application status to INTERVIEW_SCHEDULED
3. Create Event record (EventType: custom or new INTERVIEW type)
4. Link Interview.eventId to Event.id
5. Send email notifications to:
   - Applicant (with calendar invite)
   - Interviewers (with applicant details)
6. Create ApplicationStatusHistory record

**Response:**
```json
{
  "success": true,
  "interview": {
    "id": "int_789...",
    "scheduledAt": "2025-12-20T14:00:00Z",
    "location": "Virtual - Zoom",
    "virtualLink": "https://zoom.us/j/123456789",
    "status": "SCHEDULED"
  }
}
```

---

### 6. PATCH /api/applications/[id]/interviews/[interviewId]

**Purpose:** Update interview details or mark as completed

**Authentication:** Required, role: COMMITTEE_LEADER, BOARD_CHAIR, or WEB_STEWARD

**Request Body:**
```json
{
  "status": "COMPLETED",
  "notes": "Great interview. Candidate has strong technical skills and aligns with community values.",
  "completedAt": "2025-12-20T15:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "interview": {
    "id": "int_789...",
    "status": "COMPLETED",
    "completedAt": "2025-12-20T15:00:00Z"
  }
}
```

---

### 7. POST /api/applications/[id]/documents

**Purpose:** Upload additional documents to application

**Authentication:** Optional (public with applicationId, or authenticated admin)

**Request Body:** Multipart form data with file upload

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc_999...",
    "documentType": "CERTIFICATION",
    "filename": "teaching_certificate.pdf",
    "fileUrl": "s3://...",
    "uploadedAt": "2025-12-18T11:00:00Z"
  }
}
```

---

### 8. GET /api/applications/[id]/onboarding

**Purpose:** Get onboarding steps for approved application

**Authentication:** Optional (public with applicationId, or authenticated user)

**Response:**
```json
{
  "application": {
    "id": "app_clx123...",
    "status": "ONBOARDING",
    "approvedAt": "2025-12-18T10:30:00Z"
  },
  "steps": [
    {
      "id": "step_1...",
      "stepType": "CREATE_ACCOUNT",
      "title": "Create Your Account",
      "description": "Set up your login credentials",
      "order": 1,
      "isRequired": true,
      "isCompleted": false,
      "completedAt": null
    },
    {
      "id": "step_2...",
      "stepType": "ACCEPT_CONTRACT",
      "title": "Accept Membership Contract",
      "description": "Review and accept the covenant agreement",
      "order": 2,
      "isRequired": true,
      "isCompleted": false,
      "completedAt": null
    }
  ],
  "progress": {
    "completed": 0,
    "total": 7,
    "percentage": 0
  }
}
```

---

### 9. PATCH /api/applications/[id]/onboarding/[stepId]

**Purpose:** Mark onboarding step as completed

**Authentication:** Required (user linked to application)

**Request Body:**
```json
{
  "isCompleted": true,
  "metadata": {
    "contractVersion": "1.0.0"
  }
}
```

**Logic:**
1. Verify user is linked to application
2. Mark step as completed with timestamp
3. Check if all required steps completed
4. If all completed:
   - Update application status to ONBOARDED
   - Update user role to approved role
   - Send welcome email with full access
   - Notify admins of completed onboarding

**Response:**
```json
{
  "success": true,
  "step": {
    "id": "step_2...",
    "isCompleted": true,
    "completedAt": "2025-12-19T09:00:00Z"
  },
  "progress": {
    "completed": 1,
    "total": 7,
    "percentage": 14
  }
}
```

---

## UI Components

### 1. Public Application Form

**Location:** `app/(public)/apply/page.tsx`

**Features:**
- Multi-step form with progress indicator (1/4, 2/4, 3/4, 4/4)
- Form validation with real-time error messages
- Auto-save to localStorage (prevent data loss)
- Drag-and-drop file upload with preview
- File type and size validation
- Mobile-responsive design
- Accessibility compliant (ARIA labels, keyboard navigation)

**Component Structure:**
```tsx
export default function ApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    // ... all form fields
  });
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const steps = [
    { number: 1, title: 'Personal Information', component: PersonalInfoStep },
    { number: 2, title: 'Occupational Request', component: OccupationalStep },
    { number: 3, title: 'Document Upload', component: DocumentUploadStep },
    { number: 4, title: 'Review & Submit', component: ReviewStep }
  ];

  const handleNext = () => setCurrentStep(currentStep + 1);
  const handleBack = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    // Submit application
    const response = await fetch('/api/applications/submit', {
      method: 'POST',
      body: JSON.stringify({ ...formData, documents: uploadedDocuments })
    });

    if (response.ok) {
      const { applicationId } = await response.json();
      router.push(`/apply/confirmation?id=${applicationId}`);
    }
  };

  return (
    <div className="min-h-screen bg-earth-light">
      {/* Progress Bar */}
      <ApplicationProgress currentStep={currentStep} totalSteps={4} />

      {/* Step Content */}
      <div className="max-w-3xl mx-auto p-8">
        {steps[currentStep - 1].component({
          formData,
          setFormData,
          uploadedDocuments,
          setUploadedDocuments
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between max-w-3xl mx-auto p-8">
        {currentStep > 1 && (
          <button onClick={handleBack} className="btn-secondary">
            Back
          </button>
        )}
        {currentStep < 4 ? (
          <button onClick={handleNext} className="btn-primary">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn-primary">
            Submit Application
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### 2. Application Status Tracking Page

**Location:** `app/(public)/apply/status/[applicationId]/page.tsx`

**Features:**
- Public access with application ID
- Status timeline with visual progress
- Interview details with calendar integration
- Document upload section (if additional docs requested)
- Mobile-responsive design

---

### 3. Admin Application Dashboard

**Location:** `app/dashboard/admin/applications/page.tsx`

**Features:**
- Filterable table with all applications
- Status badges with color coding
- Search functionality
- Sort by columns (date, status, name)
- Bulk actions (assign reviewer, export CSV)
- Quick status update dropdown
- Click row to view full details

**Component Structure:**
```tsx
export default function ApplicationsDashboard() {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    search: ''
  });

  useEffect(() => {
    fetchApplications(filters);
  }, [filters]);

  return (
    <div className="dashboard-container">
      <header>
        <h1>Application Management</h1>
        <ApplicationFilters filters={filters} setFilters={setFilters} />
      </header>

      <ApplicationsTable
        applications={applications}
        onRowClick={(app) => router.push(`/dashboard/admin/applications/${app.id}`)}
        onStatusChange={(appId, status) => updateApplicationStatus(appId, status)}
      />

      <Pagination />
    </div>
  );
}
```

---

### 4. Application Detail Page (Admin)

**Location:** `app/dashboard/admin/applications/[id]/page.tsx`

**Features:**
- Full application details display
- Document viewer/downloader
- Status update form with notes
- Interview scheduling interface
- Reviewer assignment
- Internal notes section
- Activity timeline
- Action buttons (Approve, Reject, Request Info)

---

### 5. Interview Scheduling Modal

**Location:** `app/components/applications/InterviewScheduler.tsx`

**Features:**
- Date/time picker with timezone support
- Committee member multi-select
- Virtual meeting integration (Zoom API)
- Location dropdown
- Agenda/notes textarea
- Calendar preview
- Send invites checkbox

---

### 6. Onboarding Checklist Page

**Location:** `app/(public)/onboarding/[applicationId]/page.tsx`

**Features:**
- Progress bar showing completion percentage
- Checklist with expandable steps
- Click step to navigate to action
- Step completion checkmarks
- Estimated time for each step
- Help tooltips
- Mobile-responsive design

**Component Structure:**
```tsx
export default function OnboardingPage({ params }) {
  const { applicationId } = params;
  const [steps, setSteps] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    fetchOnboardingSteps(applicationId);
  }, [applicationId]);

  const handleStepClick = (step) => {
    // Navigate to step action page
    if (step.stepType === 'CREATE_ACCOUNT') {
      router.push('/register');
    } else if (step.stepType === 'ACCEPT_CONTRACT') {
      router.push('/contract-review');
    }
    // ... other step types
  };

  return (
    <div className="min-h-screen bg-earth-light">
      <header className="bg-stone-warm p-8">
        <h1 className="text-3xl font-serif">Welcome to BRITE POOL!</h1>
        <p>Complete these steps to finish your onboarding</p>
        <ProgressBar completed={progress.completed} total={progress.total} />
      </header>

      <div className="max-w-3xl mx-auto p-8">
        {steps.map((step) => (
          <OnboardingStepCard
            key={step.id}
            step={step}
            onClick={() => handleStepClick(step)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### 7. Document Upload Component

**Location:** `app/components/applications/DocumentUpload.tsx`

**Features:**
- Drag-and-drop zone
- File type validation (PDF, DOC, DOCX, TXT)
- File size limit (10MB per file)
- Multiple file upload
- Upload progress indicators
- File preview thumbnails
- Remove uploaded file option
- Accessibility (keyboard upload, screen reader support)

---

## Implementation Details

### Phase 1: Database & API Foundation (Days 1-2)

1. **Day 1: Database Schema**
   - Add new models to Prisma schema (Application, ApplicationDocument, Interview, ApplicationStep, ApplicationStatusHistory)
   - Update existing models (User, Event) with new relations
   - Run `npx prisma db push` to sync database
   - Create seed script for default onboarding steps template

2. **Day 2: Core API Endpoints**
   - Implement POST /api/applications/submit
   - Implement GET /api/applications (admin list)
   - Implement GET /api/applications/[id]
   - Add validation middleware
   - Set up file upload handler (multer or similar)

### Phase 2: File Storage & Document Management (Day 3)

1. **File Upload System**
   - Configure AWS S3 bucket or local storage
   - Implement secure file upload with virus scanning
   - Generate signed URLs for document access
   - Implement POST /api/applications/[id]/documents

2. **Document Viewer**
   - Implement in-browser PDF viewer
   - Add download functionality
   - Implement access control (applicant or admin only)

### Phase 3: Admin Dashboard UI (Days 4-5)

1. **Day 4: Application List & Filtering**
   - Create applications dashboard page
   - Implement table with sorting and filtering
   - Add search functionality
   - Create status badges component
   - Implement pagination

2. **Day 5: Application Detail & Status Management**
   - Create application detail page
   - Implement status update form
   - Add internal notes section
   - Create activity timeline component
   - Implement PATCH /api/applications/[id]/status

### Phase 4: Interview Scheduling (Day 6)

1. **Interview System**
   - Implement POST /api/applications/[id]/interviews
   - Create interview scheduling modal
   - Integrate with Events Calendar
   - Add calendar invite generation (iCal)
   - Implement PATCH /api/applications/[id]/interviews/[id]

2. **Email Notifications**
   - Set up email service (SendGrid, AWS SES)
   - Create email templates for:
     - Application submission confirmation
     - Status change notifications
     - Interview scheduling
     - Approval/rejection
   - Implement automated email sending

### Phase 5: Public Application Form & Onboarding (Day 7)

1. **Public Application Form**
   - Create multi-step form UI
   - Implement progress tracking
   - Add document upload component
   - Implement form validation
   - Add auto-save to localStorage

2. **Onboarding Workflow**
   - Create onboarding checklist page
   - Implement GET /api/applications/[id]/onboarding
   - Implement PATCH /api/applications/[id]/onboarding/[stepId]
   - Create default onboarding steps on approval
   - Add progress tracking

3. **Application Tracking**
   - Create public status tracking page
   - Implement status timeline component
   - Add interview details display

---

## Testing Requirements

### Unit Tests

```typescript
// Test application submission
test('POST /api/applications/submit creates application', async () => {
  const applicationData = {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    desiredRole: 'PARTNER',
    // ... other fields
  };

  const res = await fetch('/api/applications/submit', {
    method: 'POST',
    body: JSON.stringify(applicationData)
  });

  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.applicationId).toBeTruthy();

  const application = await prisma.application.findUnique({
    where: { id: data.applicationId }
  });
  expect(application.status).toBe('SUBMITTED');
  expect(application.email).toBe('jane@example.com');
});

// Test status update
test('PATCH /api/applications/[id]/status updates status', async () => {
  const application = await createTestApplication();

  const res = await fetch(`/api/applications/${application.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'APPROVED' })
  });

  expect(res.status).toBe(200);

  const updated = await prisma.application.findUnique({
    where: { id: application.id }
  });
  expect(updated.status).toBe('APPROVED');

  // Check status history created
  const history = await prisma.applicationStatusHistory.findFirst({
    where: { applicationId: application.id, toStatus: 'APPROVED' }
  });
  expect(history).toBeTruthy();
});

// Test onboarding step completion
test('Completing all onboarding steps updates application status', async () => {
  const application = await createApprovedApplication();
  const steps = await prisma.applicationStep.findMany({
    where: { applicationId: application.id }
  });

  // Complete all steps
  for (const step of steps) {
    await fetch(`/api/applications/${application.id}/onboarding/${step.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ isCompleted: true })
    });
  }

  const updated = await prisma.application.findUnique({
    where: { id: application.id }
  });
  expect(updated.status).toBe('ONBOARDED');
});
```

### Integration Tests

1. **Full Application Flow**
   - Submit application → Admin reviews → Schedule interview → Approve → Complete onboarding
   - Verify all status transitions
   - Verify email notifications sent
   - Verify user account created with correct role

2. **Document Upload Flow**
   - Upload documents during application
   - Upload additional documents after submission
   - Verify file storage and access
   - Test file type validation

3. **Interview Scheduling Flow**
   - Schedule interview → Send notifications → Mark completed
   - Verify Event Calendar integration
   - Test calendar invite generation

### Manual Testing Checklist

- [ ] Public application form submission works
- [ ] Document upload accepts valid files and rejects invalid types
- [ ] File size limits enforced
- [ ] Admin can view all applications
- [ ] Filtering and search work correctly
- [ ] Status updates trigger email notifications
- [ ] Interview scheduling creates calendar events
- [ ] Applicants can track status publicly
- [ ] Onboarding checklist displays correctly
- [ ] Completing all steps grants full access
- [ ] Rejection flow works with reason
- [ ] Resubmission creates new version
- [ ] All emails formatted correctly
- [ ] Mobile responsive design works
- [ ] Accessibility compliance verified

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated with all new models
- [ ] Database migrations tested locally
- [ ] All API endpoints implemented and tested
- [ ] File storage configured (S3 or local)
- [ ] Email service configured (SendGrid/AWS SES)
- [ ] Email templates created and tested
- [ ] Environment variables configured:
  - `AWS_S3_BUCKET` (if using S3)
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `EMAIL_SERVICE_API_KEY`
  - `APPLICATION_ADMIN_EMAILS`
- [ ] All tests passing
- [ ] Security review completed (file upload, access control)

### Deployment Steps

1. Backup production database
2. Deploy database migrations (`npx prisma migrate deploy`)
3. Deploy application code
4. Verify file upload functionality
5. Test email notifications in production
6. Smoke test application submission
7. Monitor error logs

### Post-Deployment

- [ ] Submit test application and verify full workflow
- [ ] Verify admin dashboard loads correctly
- [ ] Test document uploads in production
- [ ] Verify email notifications are delivered
- [ ] Check interview scheduling integration
- [ ] Test onboarding workflow end-to-end
- [ ] Verify status tracking page accessible publicly
- [ ] Monitor application performance
- [ ] Set up alerts for failed email deliveries
- [ ] Document admin procedures for application review

---

## Email Templates

### 1. Application Submission Confirmation

**Subject:** Application Received - BRITE POOL Ministerium

**Body:**
```
Dear [Applicant Name],

Thank you for your interest in joining the BRITE POOL Ministerium of Empowerment!

We have received your application for the [Desired Role] position. Your application ID is [Application ID].

You can track the status of your application at any time by visiting:
[Tracking URL]

What happens next:
1. Our committee will review your application within 5-7 business days
2. You may be contacted to schedule an interview
3. We will keep you updated via email as your application progresses

If you have any questions, please don't hesitate to reach out to us at applications@britepool.org.

With gratitude,
The BRITE POOL Team
```

### 2. Interview Scheduled

**Subject:** Interview Scheduled - BRITE POOL Application

**Body:**
```
Dear [Applicant Name],

Great news! We would like to schedule an interview with you to discuss your application.

Interview Details:
- Date: [Date]
- Time: [Time] [Timezone]
- Duration: [Duration]
- Location: [Location/Virtual Link]
- Interviewers: [Names]

[If virtual: Join the meeting: [Virtual Link]]

Please add this interview to your calendar using the attached invite.

If you need to reschedule, please contact us at least 24 hours in advance.

We look forward to speaking with you!

Best regards,
[Interviewer Names]
BRITE POOL Committee
```

### 3. Application Approved

**Subject:** Congratulations! Your BRITE POOL Application Has Been Approved

**Body:**
```
Dear [Applicant Name],

Congratulations! We are thrilled to inform you that your application to join BRITE POOL as a [Approved Role] has been APPROVED!

Next Steps - Complete Your Onboarding:
To activate your full membership, please complete the following onboarding steps:
[Onboarding Checklist URL]

Your onboarding checklist includes:
✓ Create your account
✓ Accept our membership covenant
✓ Complete your member profile
✓ [Additional steps...]

Please complete your onboarding within the next 14 days. We're excited to welcome you into our community!

If you have any questions during the onboarding process, reach out to welcome@britepool.org.

Welcome to the BRITE POOL family!

With gratitude,
[Approver Name]
BRITE POOL Committee
```

### 4. Application Status Update

**Subject:** Update on Your BRITE POOL Application

**Body:**
```
Dear [Applicant Name],

This is an update regarding your application (ID: [Application ID]).

Status Update: [Previous Status] → [New Status]

[Custom message based on status]

You can view your full application status at:
[Tracking URL]

If you have any questions, please contact us at applications@britepool.org.

Best regards,
The BRITE POOL Team
```

---

## Security Considerations

### File Upload Security

1. **File Type Validation**
   - Whitelist allowed MIME types (PDF, DOC, DOCX, TXT)
   - Verify file extensions match MIME types
   - Scan files for malware (ClamAV or cloud service)

2. **File Size Limits**
   - Maximum 10MB per file
   - Total upload limit per application

3. **Storage Security**
   - Store files in private S3 bucket (not publicly accessible)
   - Generate signed URLs with expiration for viewing
   - Implement access control (only applicant and admins)

### Data Privacy

1. **Applicant Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Implement GDPR-compliant data retention policies
   - Allow applicants to request data deletion

2. **Access Control**
   - Applicants can only view their own application
   - Admins/committee leaders can view all applications
   - Audit logging for all data access

### Authentication & Authorization

1. **Public Access**
   - Application submission does not require login
   - Status tracking requires application ID (acts as token)
   - Implement rate limiting to prevent abuse

2. **Admin Access**
   - Require authentication for admin endpoints
   - Verify role permissions (COMMITTEE_LEADER or higher)
   - Log all admin actions for audit trail

---

## Future Enhancements

1. **Application Portal**
   - Allow applicants to create account and save draft applications
   - Enable applicants to edit application before submission
   - Add application templates for different roles

2. **Advanced Interview Features**
   - Video interview integration (Zoom, Google Meet)
   - Interview scoring rubric
   - Interview feedback collection from all interviewers

3. **Analytics Dashboard**
   - Application conversion rates
   - Average time to approval
   - Applicant source tracking
   - Interviewer workload distribution

4. **Automated Workflows**
   - Auto-assign reviewers based on role/interest
   - Automated interview scheduling based on committee calendar
   - AI-powered resume screening and skill matching

5. **Multi-Language Support**
   - Spanish translation of application form
   - Multi-language email templates

6. **Application Scoring**
   - Weighted criteria scoring system
   - Committee voting on applications
   - Score-based application ranking

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
