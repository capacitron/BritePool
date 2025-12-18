# Specification: Committee Management System

**Feature ID:** F013
**Priority:** High
**Effort:** Large (2 weeks / 14 days)
**Dependencies:** User Authentication (F002), Events Calendar (F009), Task Management (F006), Forums (F004)
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
Implement a comprehensive committee management system that enables structured governance and operations across five ministerial boards: Governance, Wealth, Education, Health, and Operations. Committee leaders can manage member assignments, schedule meetings integrated with the events calendar, track decisions and resolutions, and coordinate committee-specific tasks and discussions.

### Key Requirements
- Five pre-defined committees aligned with ministerial structure (Governance Board, Wealth Board, Education Board, Health Board, Operations Board)
- Role-based access control (Committee Leaders vs. Members)
- Member assignment and removal workflow
- Integrated meeting scheduling via Events Calendar
- Decision/resolution tracking with voting capabilities
- Committee-specific task management
- Committee discussions via Forums integration
- Dashboard views showing committee activity and metrics

### Success Metrics
- All five committees successfully created and populated with members
- Committee leaders can assign/remove members without admin intervention
- 100% of committee meetings tracked via Events Calendar integration
- All committee decisions logged with voting records
- Committee members can view and participate in committee-specific discussions
- Clear audit trail of all committee actions

---

## User Flows

### Flow 1: Committee Leader Creates New Committee (Admin-Initiated)

```
1. Admin logs in with WEB_STEWARD or BOARD_CHAIR role
2. Admin navigates to /dashboard/admin/committees
3. Admin clicks "Create Committee" button
4. Admin sees committee creation form:
   - Committee Name (required)
   - Committee Type (dropdown: Governance, Wealth, Education, Health, Operations)
   - Description (optional, rich text)
   - Committee Leader (user search/select, role: COMMITTEE_LEADER)
5. Admin submits form → POST /api/committees
6. System validates:
   - Committee type is unique (no duplicate types)
   - Selected leader has COMMITTEE_LEADER or higher role
7. Committee created with auto-generated slug
8. System redirects to /dashboard/committees/[slug]
9. Admin/Leader can now assign members
```

### Flow 2: Committee Leader Assigns Members to Committee

```
1. Committee Leader logs in (role: COMMITTEE_LEADER or BOARD_CHAIR)
2. Leader navigates to /dashboard/committees/[slug]
3. Leader clicks "Members" tab
4. Leader sees current member list with roles
5. Leader clicks "Add Member" button
6. Modal opens with member search/filter:
   - Search by name or email
   - Filter by role (Steward, Partner, Resident, etc.)
   - Shows members not already in this committee
7. Leader selects member(s) and assigns role:
   - Role: MEMBER (default) or LEADER
8. Leader clicks "Add to Committee"
9. POST /api/committees/[id]/members
10. System validates:
    - Leader has permission for this committee
    - Member exists and has accepted covenant
    - Member not already in committee
11. CommitteeMember record created with joinedAt timestamp
12. Member list updates with new member(s)
13. (Optional) Email notification sent to newly assigned member
```

### Flow 3: Committee Leader Schedules Meeting (Integrated with Events Calendar)

```
1. Committee Leader navigates to /dashboard/committees/[slug]
2. Leader clicks "Meetings" tab
3. Leader sees upcoming committee meetings (pulled from Events)
4. Leader clicks "Schedule New Meeting" button
5. System redirects to /dashboard/events/create with pre-populated data:
   - Event Type: COMMITTEE_MEETING
   - Committee: [current committee pre-selected]
   - Attendees: All committee members auto-added
6. Leader fills meeting details:
   - Title (e.g., "Wealth Board Monthly Meeting")
   - Description/Agenda
   - Start Time & End Time
   - Location (physical or virtual link)
7. Leader submits → POST /api/events
8. Event created with committeeId relationship
9. All committee members receive event notification
10. Meeting appears in committee "Meetings" tab
11. Meeting also appears in main Events Calendar
```

### Flow 4: Committee Member Participates in Discussion

```
1. Committee Member logs in
2. Member navigates to /dashboard/committees or clicks from navigation
3. Member sees list of committees they belong to
4. Member clicks on committee card (e.g., "Health Board")
5. Member navigates to "Discussions" tab
6. Member sees committee-specific forum category:
   - Category: "[Committee Name] Discussions" (e.g., "Health Board Discussions")
   - Restricted to committee members only
7. Member can:
   - View existing discussion threads
   - Create new discussion topic
   - Reply to existing threads
   - Attach files or images
8. Discussion posts use ForumPost model with:
   - categoryId → linked to committee-specific category
   - authorId → current user
   - content → markdown/rich text
9. All committee members can see and participate
10. Non-committee members cannot access these discussions
```

### Flow 5: Committee Leader Records Decision/Resolution

```
1. Committee Leader navigates to /dashboard/committees/[slug]
2. Leader clicks "Decisions" tab
3. Leader sees history of past decisions
4. Leader clicks "Record New Decision" button
5. Decision form opens:
   - Decision Title (required, e.g., "Approve Q1 Budget Allocation")
   - Description/Context (rich text, details of decision)
   - Decision Type (dropdown: Vote, Resolution, Policy Change, etc.)
   - Voting Record (optional):
     - For: [member checkboxes]
     - Against: [member checkboxes]
     - Abstain: [member checkboxes]
   - Date Decided (defaults to today)
   - Related Documents (file upload)
6. Leader submits → POST /api/committees/[id]/decisions
7. CommitteeDecision record created:
   - committeeId
   - title, description, type
   - votingRecord (JSON: { for: [...userIds], against: [...], abstain: [...] })
   - decidedAt
   - createdBy (leaderId)
8. Decision appears in committee "Decisions" tab
9. All committee members can view decision
10. (Optional) Email notification sent to committee members
```

### Flow 6: Admin Views All Committee Activity

```
1. Admin logs in with WEB_STEWARD or BOARD_CHAIR role
2. Admin navigates to /dashboard/admin/committees
3. Admin sees overview dashboard:
   - List of all 5 committees with stats
   - Total members per committee
   - Recent meetings (last 30 days)
   - Recent decisions (last 30 days)
   - Active tasks count per committee
4. Admin can click into any committee to view details
5. Admin sees same committee detail view as leaders
6. Admin can:
   - Add/remove members from any committee
   - Edit committee details
   - Archive/unarchive committees
   - View full activity log
7. Activity log shows:
   - Member assignments/removals with timestamps
   - Meetings scheduled
   - Decisions recorded
   - Tasks created/completed
```

---

## Database Schema

### Existing Models (from Prisma schema)

The following models already exist and will be utilized:

```prisma
model Committee {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  type        CommitteeType

  members     CommitteeMember[]
  tasks       Task[]
  events      Event[]
  decisions   CommitteeDecision[]  // NEW RELATION
  discussions ForumCategory?       // NEW RELATION (one-to-one)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
}

model CommitteeMember {
  id          String   @id @default(cuid())
  userId      String
  committeeId String
  role        CommitteeMemberRole @default(MEMBER)

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  committee   Committee @relation(fields: [committeeId], references: [id], onDelete: Cascade)

  joinedAt    DateTime @default(now())

  @@unique([userId, committeeId])
  @@index([committeeId])
  @@index([userId])
}

enum CommitteeType {
  GOVERNANCE   // Governance Board - Leadership, policy, covenant oversight
  WEALTH       // Wealth Board - Financial stewardship, fundraising, resource allocation
  EDUCATION    // Education Board - Course creation, workshops, knowledge sharing
  HEALTH       // Health Board - Wellness, healing, practitioner coordination
  OPERATIONS   // Operations Board - Maintenance, logistics, sanctuary management
}

enum CommitteeMemberRole {
  LEADER
  MEMBER
}
```

### New Model: CommitteeDecision

```prisma
model CommitteeDecision {
  id          String   @id @default(cuid())
  committeeId String
  committee   Committee @relation(fields: [committeeId], references: [id], onDelete: Cascade)

  title       String
  description String?
  type        DecisionType @default(RESOLUTION)

  // Voting record stored as JSON
  votingRecord Json?  // { for: ["userId1", "userId2"], against: ["userId3"], abstain: [] }

  decidedAt   DateTime @default(now())
  createdById String
  createdBy   User     @relation("DecisionsCreated", fields: [createdById], references: [id])

  // Optional attachments/documents
  attachments Json?    // [{ name: "file.pdf", url: "s3://..." }]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([committeeId])
  @@index([decidedAt])
}

enum DecisionType {
  VOTE
  RESOLUTION
  POLICY_CHANGE
  APPROVAL
  RECOMMENDATION
}
```

### Integration with Existing Models

**Event Model** (already exists):
```prisma
model Event {
  // ... existing fields

  committeeId String?
  committee   Committee? @relation(fields: [committeeId], references: [id])

  // Committee meetings use EventType.COMMITTEE_MEETING
}
```

**Task Model** (already exists):
```prisma
model Task {
  // ... existing fields

  committeeId  String?
  committee    Committee? @relation(fields: [committeeId], references: [id])
}
```

**ForumCategory Model** (update for committee discussions):
```prisma
model ForumCategory {
  // ... existing fields

  committeeId String?   @unique
  committee   Committee? @relation(fields: [committeeId], references: [id])

  // When committeeId is set, category is restricted to committee members only
}
```

**User Model** (add relation for decisions):
```prisma
model User {
  // ... existing relations

  decisionsCreated CommitteeDecision[] @relation("DecisionsCreated")
}
```

### Database Migration

Run Prisma migrations:
```bash
npx prisma db push
```

### Seed Data: Initialize Five Committees

```typescript
// prisma/seed.ts
async function seedCommittees() {
  const committees = [
    {
      name: 'Governance Board',
      slug: 'governance',
      type: 'GOVERNANCE',
      description: 'Leadership, policy development, covenant oversight, and strategic direction for the ministerium.'
    },
    {
      name: 'Wealth Board',
      slug: 'wealth',
      type: 'WEALTH',
      description: 'Financial stewardship, fundraising initiatives, resource allocation, and investment oversight.'
    },
    {
      name: 'Education Board',
      slug: 'education',
      type: 'EDUCATION',
      description: 'Course creation, workshop development, knowledge sharing programs, and learning initiatives.'
    },
    {
      name: 'Health Board',
      slug: 'health',
      type: 'HEALTH',
      description: 'Wellness programs, healing modalities, practitioner coordination, and health sanctuary operations.'
    },
    {
      name: 'Operations Board',
      slug: 'operations',
      type: 'OPERATIONS',
      description: 'Facility maintenance, logistics coordination, sanctuary management, and operational support.'
    }
  ];

  for (const committee of committees) {
    await prisma.committee.upsert({
      where: { slug: committee.slug },
      update: {},
      create: committee
    });
  }
}
```

---

## API Endpoints

### 1. GET /api/committees

**Purpose:** List all committees (optionally filtered)

**Authentication:** Required (any authenticated user)

**Query Parameters:**
- `type` (optional): Filter by CommitteeType
- `includeMembers` (optional, boolean): Include member details
- `includeStats` (optional, boolean): Include activity statistics

**Response:**
```json
{
  "committees": [
    {
      "id": "clx123...",
      "name": "Governance Board",
      "slug": "governance",
      "type": "GOVERNANCE",
      "description": "Leadership, policy development...",
      "memberCount": 8,
      "userRole": "LEADER",
      "stats": {
        "upcomingMeetings": 2,
        "activeTasks": 5,
        "recentDecisions": 3
      }
    }
  ]
}
```

**Error Cases:**
- User not authenticated → 401

---

### 2. POST /api/committees (Admin Only)

**Purpose:** Create a new committee

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "name": "Governance Board",
  "type": "GOVERNANCE",
  "description": "Leadership and policy...",
  "leaderId": "user_clx456..."
}
```

**Response:**
```json
{
  "success": true,
  "committee": {
    "id": "clx123...",
    "name": "Governance Board",
    "slug": "governance",
    "type": "GOVERNANCE",
    "description": "...",
    "createdAt": "2025-12-17T10:00:00Z"
  }
}
```

**Error Cases:**
- User not authorized → 403
- Committee type already exists → 400

---

### 3. POST /api/committees/[id]/members

**Purpose:** Assign member(s) to committee

**Authentication:** Required, role: Committee LEADER, BOARD_CHAIR, or WEB_STEWARD

**Request Body:**
```json
{
  "userId": "user_clx456...",
  "role": "MEMBER"
}
```

**Response:**
```json
{
  "success": true,
  "addedMembers": [
    {
      "id": "cm_123...",
      "userId": "user_456...",
      "role": "MEMBER",
      "joinedAt": "2025-12-17T12:00:00Z"
    }
  ]
}
```

**Error Cases:**
- User not authorized → 403
- User already in committee → 400

---

### 4. POST /api/committees/[id]/decisions

**Purpose:** Record a committee decision or resolution

**Authentication:** Required, role: Committee LEADER, BOARD_CHAIR, or WEB_STEWARD

**Request Body:**
```json
{
  "title": "Approve Q1 Budget Allocation",
  "description": "Voted to allocate $50,000 to sanctuary infrastructure improvements.",
  "type": "VOTE",
  "votingRecord": {
    "for": ["user_1", "user_2", "user_3"],
    "against": [],
    "abstain": ["user_4"]
  },
  "decidedAt": "2025-12-17T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "decision": {
    "id": "cd_123...",
    "title": "Approve Q1 Budget Allocation",
    "type": "VOTE",
    "decidedAt": "2025-12-17T10:00:00Z"
  }
}
```

---

### 5. GET /api/committees/[id]/meetings

**Purpose:** Get committee meetings (from Events Calendar)

**Authentication:** Required, must be committee member or admin

**Response:**
```json
{
  "meetings": [
    {
      "id": "evt_789...",
      "title": "Governance Board Monthly Meeting",
      "startTime": "2025-12-20T14:00:00Z",
      "location": "Virtual - Zoom"
    }
  ]
}
```

---

## UI Components

### 1. Committees List Page

**Location:** `app/dashboard/committees/page.tsx`

**Features:**
- Grid display of all five committees
- Committee cards showing name, description, member count, user role
- Filter by user's committees vs. all committees
- Click card to navigate to committee detail page

---

### 2. Committee Detail Page

**Location:** `app/dashboard/committees/[slug]/page.tsx`

**Features:**
- Tabbed interface (Overview, Members, Meetings, Decisions, Discussions, Tasks)
- Committee header with name, description, member count
- Role-based action buttons (e.g., "Add Member" for leaders)
- Breadcrumb navigation

---

### 3. Committee Member Manager

**Location:** `app/components/committees/CommitteeMembersTab.tsx`

**Features:**
- List of current committee members with roles
- Search/filter members
- "Add Member" button (leaders only)
- Modal for adding members
- Remove member action (with confirmation)

---

### 4. Committee Decision Form

**Location:** `app/components/committees/CommitteeDecisionsTab.tsx`

**Features:**
- List of past decisions with filters
- "Record New Decision" button (leaders only)
- Decision form modal with title, description, type, voting record
- Decision detail view showing voting breakdown

---

## Implementation Details

### Phase 1: Database & API (Days 1-4)

1. Update Prisma schema with CommitteeDecision model
2. Run database migrations
3. Create seed script for five committees
4. Implement API endpoints for committees, members, and decisions
5. Add permission checks and validation

### Phase 2: Committee Dashboard UI (Days 5-7)

1. Create committees list page
2. Implement committee detail page with tabs
3. Add overview and statistics components
4. Style with biophilic design system

### Phase 3: Member Management & Assignments (Days 8-10)

1. Create member list and search component
2. Implement add/remove member modals
3. Add role management functionality
4. Test member management workflows

### Phase 4: Decisions & Meeting Integration (Days 11-14)

1. Create decisions tab component
2. Implement decision form modal
3. Integrate with Events Calendar for meetings
4. Add tasks and discussions integration
5. Final UI polish and testing

---

## Testing Requirements

### Unit Tests
- API endpoint tests for creating committees, adding members, recording decisions
- Component tests for committee cards, member lists, decision forms

### Integration Tests
- Committee leader creates and manages committee
- Committee member participation flow
- Admin oversight and management

### Manual Testing Checklist
- [ ] Admin can create new committee
- [ ] Leader can add/remove members
- [ ] Cannot remove last leader from committee
- [ ] Meetings appear in Events Calendar
- [ ] Decisions recorded with voting records
- [ ] Only committee members can view discussions
- [ ] Permissions enforced correctly

---

## Deployment Checklist

### Pre-Deployment
- [ ] Prisma schema updated
- [ ] Database migrations tested
- [ ] Seed script created and tested
- [ ] All API endpoints implemented
- [ ] All tests passing

### Deployment Steps
1. Run database migrations
2. Seed five committees
3. Build application
4. Deploy to hosting platform
5. Smoke tests

### Post-Deployment
- [ ] All five committees created in production
- [ ] Committee pages load without errors
- [ ] Can assign members to committees
- [ ] Integrations working (meetings, discussions, tasks)
- [ ] Monitor error logs

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
