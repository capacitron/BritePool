# Specification: Task Management System

**Feature ID:** F006
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** User Authentication (F002), Committee Management (F013)
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
Implement a comprehensive task management system that enables residents, practitioners, committee leaders, and administrators to create, assign, track, and complete tasks across the community. Tasks can be personal, committee-specific, or organization-wide, supporting collaborative work and accountability.

### Key Requirements
- Task creation with title, description, priority, due date
- Task assignment to specific users or self-assignment
- Status tracking (TODO, IN_PROGRESS, COMPLETED, CANCELLED)
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Due date management with overdue indicators
- Committee-specific task workflows
- Task board view with filters and sorting
- Task detail view with status updates and comments
- Notification system for task assignments and updates
- Bulk operations and task templates

### Success Metrics
- Users can create and assign tasks within 30 seconds
- Task completion rate tracked per user and committee
- Overdue tasks clearly visible with notification system
- Committee leaders can view all committee tasks in one dashboard
- Task board provides clear visual overview of work status
- Zero orphaned tasks (all tasks have clear ownership)

---

## User Flows

### Flow 1: User Creates Personal Task

```
1. User logs in and navigates to /dashboard/tasks
2. User clicks "Create Task" button
3. Task creation modal opens with form:
   - Title (required)
   - Description (optional, rich text)
   - Priority (dropdown: LOW, MEDIUM, HIGH, URGENT - default: MEDIUM)
   - Due Date (date picker, optional)
   - Assign To (user search/select - defaults to self)
   - Committee (optional dropdown - if task is committee-related)
4. User fills form and clicks "Create Task"
5. POST /api/tasks
6. System validates:
   - Title is not empty
   - Assigned user exists
   - If committee selected, user has permission
7. Task created with status=TODO
8. Modal closes, task appears in task board
9. If assigned to another user, notification sent
```

### Flow 2: Committee Leader Creates Committee Task

```
1. Committee Leader navigates to /dashboard/committees/[slug]
2. Leader clicks "Tasks" tab
3. Leader sees committee-specific tasks
4. Leader clicks "Create Task" button
5. Task creation form opens with committee pre-selected
6. Leader fills form:
   - Title: "Review Q1 budget proposal"
   - Description: "Review attached document and provide feedback"
   - Priority: HIGH
   - Due Date: Next Friday
   - Assign To: Select committee member
   - Committee: [Current committee auto-selected, locked]
7. Leader clicks "Create Task"
8. POST /api/tasks with committeeId
9. Task created and linked to committee
10. Assigned member receives notification
11. Task appears in:
    - Committee tasks list
    - Assigned member's personal task list
    - Committee leader's task overview
```

### Flow 3: User Views Task Board

```
1. User navigates to /dashboard/tasks
2. User sees task board with columns:
   - TODO (tasks not started)
   - IN_PROGRESS (tasks being worked on)
   - COMPLETED (finished tasks)
   - CANCELLED (cancelled tasks)
3. Each column shows task cards with:
   - Title
   - Priority indicator (color-coded)
   - Due date with overdue indicator
   - Assignee avatar
   - Committee badge (if applicable)
4. User can:
   - Drag and drop tasks between columns (updates status)
   - Click task card to open detail view
   - Filter by: Priority, Committee, Assigned To, Due Date
   - Sort by: Due Date, Priority, Created Date
   - Toggle view: Board / List / Calendar
5. GET /api/tasks?status=TODO&assignedToId={userId}
6. Task cards update in real-time
```

### Flow 4: User Updates Task Status

```
1. User clicks on task card in task board
2. Task detail modal opens showing:
   - Title and description
   - Current status with status selector
   - Priority with priority selector
   - Due date with date picker
   - Assigned user
   - Committee (if applicable)
   - Created/Updated timestamps
   - Comments section
3. User changes status from TODO → IN_PROGRESS
4. User clicks "Save" or status auto-saves
5. PATCH /api/tasks/[id]
6. System updates task.status and task.updatedAt
7. If status changed to COMPLETED:
   - task.completedAt = now()
   - Completion notification sent to task creator
8. Task card moves to appropriate column in board
9. Activity log updated with status change
```

### Flow 5: User Manages Overdue Tasks

```
1. User navigates to /dashboard/tasks
2. User sees "Overdue" filter badge with count (e.g., "Overdue (3)")
3. User clicks "Overdue" filter
4. GET /api/tasks?overdue=true&assignedToId={userId}
5. Task board filters to show only overdue tasks:
   - Tasks where dueDate < now() AND status != COMPLETED
   - Red indicator on task cards
   - Sorted by most overdue first
6. User can:
   - Update status to IN_PROGRESS or COMPLETED
   - Extend due date
   - Add comment explaining delay
   - Reassign task if unable to complete
7. User selects task and extends due date
8. PATCH /api/tasks/[id] with new dueDate
9. Task no longer shows in overdue filter
10. Task creator/committee leader notified of date change
```

### Flow 6: Committee Leader Views All Committee Tasks

```
1. Committee Leader navigates to /dashboard/committees/[slug]
2. Leader clicks "Tasks" tab
3. GET /api/tasks?committeeId={committeeId}
4. Leader sees committee task dashboard:
   - Summary statistics:
     - Total tasks: 24
     - In Progress: 8
     - Completed this month: 15
     - Overdue: 2
   - Task board filtered to committee tasks only
   - All committee members' tasks visible
   - Filter by assigned member
   - Filter by priority
5. Leader can:
   - Create new committee task
   - Reassign tasks between members
   - Mark tasks as completed on behalf of members
   - Cancel tasks that are no longer relevant
   - Export task list to CSV
6. Leader clicks on member filter dropdown
7. Selects specific member
8. Board updates to show only that member's tasks
9. Leader can assess workload distribution
```

### Flow 7: User Receives Task Assignment Notification

```
1. Committee Leader assigns task to user
2. Task created with assignedToId = user.id
3. System triggers notification:
   - In-app notification appears in user's notification center
   - Email notification sent (if enabled in user preferences)
4. User logs in and sees notification badge
5. User clicks notification
6. Redirected to task detail view: /dashboard/tasks/[taskId]
7. User sees task details and can:
   - Accept task (change status to IN_PROGRESS)
   - Add comment with questions
   - Update due date if unrealistic
   - Reassign if inappropriate assignment
```

### Flow 8: User Searches and Filters Tasks

```
1. User navigates to /dashboard/tasks
2. User sees search bar and filter panel
3. User enters search term: "budget"
4. GET /api/tasks?search=budget&assignedToId={userId}
5. Task board filters to show matching tasks:
   - Title contains "budget"
   - Description contains "budget"
6. User applies additional filters:
   - Priority: HIGH
   - Committee: Wealth Board
   - Status: TODO, IN_PROGRESS
7. GET /api/tasks?search=budget&priority=HIGH&committeeId={id}&status=TODO,IN_PROGRESS
8. Task board updates with refined results
9. User sees "Filters Active (3)" indicator
10. User can clear all filters with one click
11. User can save filter preset as "My High Priority Wealth Tasks"
```

---

## Database Schema

### Existing Model (from Prisma schema)

The Task model already exists in the schema:

```prisma
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
  @@index([committeeId])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### New Model: TaskComment (for task discussions)

```prisma
model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  content   String   // Comment text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([taskId])
  @@index([authorId])
}
```

### New Model: TaskActivity (for audit trail)

```prisma
model TaskActivity {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  action    TaskActivityAction

  // Store changed data as JSON
  changes   Json?    // { field: "status", from: "TODO", to: "IN_PROGRESS" }

  createdAt DateTime @default(now())

  @@index([taskId])
  @@index([createdAt])
}

enum TaskActivityAction {
  CREATED
  UPDATED
  STATUS_CHANGED
  ASSIGNED
  REASSIGNED
  COMPLETED
  CANCELLED
  DUE_DATE_CHANGED
  PRIORITY_CHANGED
  COMMENTED
}
```

### Update Existing Models

Add relations to existing models:

```prisma
model Task {
  // ... existing fields

  comments  TaskComment[]
  activities TaskActivity[]
}

model User {
  // ... existing relations

  taskComments TaskComment[]
  taskActivities TaskActivity[]
}
```

### Database Migration

Run Prisma migrations:
```bash
npx prisma db push
```

---

## API Endpoints

### 1. GET /api/tasks

**Purpose:** List tasks with filtering, sorting, and pagination

**Authentication:** Required (any authenticated user)

**Query Parameters:**
- `status` (optional): Filter by status (TODO, IN_PROGRESS, COMPLETED, CANCELLED) - comma-separated
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT) - comma-separated
- `assignedToId` (optional): Filter by assigned user ID
- `committeeId` (optional): Filter by committee ID
- `overdue` (optional, boolean): Show only overdue tasks
- `search` (optional): Search in title and description
- `sortBy` (optional): Sort field (dueDate, priority, createdAt, updatedAt)
- `sortOrder` (optional): asc or desc
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_clx123...",
      "title": "Review Q1 budget proposal",
      "description": "Review attached document and provide feedback",
      "status": "TODO",
      "priority": "HIGH",
      "assignedToId": "user_456...",
      "assignedTo": {
        "id": "user_456...",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "committeeId": "committee_789...",
      "committee": {
        "id": "committee_789...",
        "name": "Wealth Board",
        "slug": "wealth"
      },
      "dueDate": "2025-12-24T23:59:59Z",
      "completedAt": null,
      "createdAt": "2025-12-17T10:00:00Z",
      "updatedAt": "2025-12-17T10:00:00Z",
      "isOverdue": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 24,
    "totalPages": 1
  },
  "stats": {
    "todo": 8,
    "inProgress": 5,
    "completed": 10,
    "overdue": 1
  }
}
```

**Error Cases:**
- User not authenticated → 401
- Invalid query parameters → 400

---

### 2. POST /api/tasks

**Purpose:** Create a new task

**Authentication:** Required (any authenticated user)

**Request Body:**
```json
{
  "title": "Review Q1 budget proposal",
  "description": "Review attached document and provide feedback by end of week",
  "priority": "HIGH",
  "assignedToId": "user_456...",
  "committeeId": "committee_789...",
  "dueDate": "2025-12-24T23:59:59Z"
}
```

**Validation:**
- Title is required and max 255 characters
- Priority must be valid enum value
- AssignedToId must reference existing user
- CommitteeId must reference existing committee (if provided)
- If committeeId provided, user must be committee member or leader
- DueDate must be future date (if provided)

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "task_clx123...",
    "title": "Review Q1 budget proposal",
    "status": "TODO",
    "priority": "HIGH",
    "assignedToId": "user_456...",
    "committeeId": "committee_789...",
    "dueDate": "2025-12-24T23:59:59Z",
    "createdAt": "2025-12-17T10:00:00Z"
  }
}
```

**Side Effects:**
- TaskActivity record created with action=CREATED
- If assignedToId != current user, notification sent to assignee
- If committeeId provided, activity logged in committee

**Error Cases:**
- User not authenticated → 401
- Title missing or empty → 400
- Assigned user not found → 404
- Committee not found → 404
- User not authorized for committee → 403

---

### 3. GET /api/tasks/[id]

**Purpose:** Get single task details with full information

**Authentication:** Required, user must be task assignee, task creator, committee leader, or admin

**Response:**
```json
{
  "task": {
    "id": "task_clx123...",
    "title": "Review Q1 budget proposal",
    "description": "Review attached document and provide feedback by end of week",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "assignedTo": {
      "id": "user_456...",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "STEWARD"
    },
    "committee": {
      "id": "committee_789...",
      "name": "Wealth Board",
      "slug": "wealth"
    },
    "dueDate": "2025-12-24T23:59:59Z",
    "completedAt": null,
    "createdAt": "2025-12-17T10:00:00Z",
    "updatedAt": "2025-12-18T09:30:00Z",
    "isOverdue": false,
    "comments": [
      {
        "id": "comment_abc...",
        "content": "I'll have this done by tomorrow",
        "author": {
          "id": "user_456...",
          "name": "Jane Smith"
        },
        "createdAt": "2025-12-17T14:00:00Z"
      }
    ],
    "activities": [
      {
        "id": "activity_def...",
        "action": "STATUS_CHANGED",
        "user": {
          "id": "user_456...",
          "name": "Jane Smith"
        },
        "changes": {
          "field": "status",
          "from": "TODO",
          "to": "IN_PROGRESS"
        },
        "createdAt": "2025-12-18T09:30:00Z"
      }
    ]
  }
}
```

**Error Cases:**
- User not authenticated → 401
- Task not found → 404
- User not authorized to view task → 403

---

### 4. PATCH /api/tasks/[id]

**Purpose:** Update task properties

**Authentication:** Required, user must be task assignee, task creator, committee leader, or admin

**Request Body:** (all fields optional, only send what's changing)
```json
{
  "title": "Review Q1 budget proposal (Updated)",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "assignedToId": "user_789...",
  "dueDate": "2025-12-25T23:59:59Z"
}
```

**Logic:**
1. Validate user has permission to update task
2. For each changed field, create TaskActivity record
3. If status changed to COMPLETED, set completedAt timestamp
4. If assignedToId changed, send notification to new assignee
5. Update task.updatedAt timestamp

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "task_clx123...",
    "title": "Review Q1 budget proposal (Updated)",
    "status": "IN_PROGRESS",
    "updatedAt": "2025-12-18T10:00:00Z"
  }
}
```

**Error Cases:**
- User not authenticated → 401
- Task not found → 404
- User not authorized → 403
- Invalid status/priority value → 400

---

### 5. DELETE /api/tasks/[id]

**Purpose:** Delete a task (soft delete by setting status to CANCELLED)

**Authentication:** Required, user must be task creator, committee leader, or admin

**Response:**
```json
{
  "success": true,
  "message": "Task cancelled successfully"
}
```

**Logic:**
- Don't actually delete, set status to CANCELLED
- Create TaskActivity record with action=CANCELLED
- Notify assignee if different from current user

**Error Cases:**
- User not authenticated → 401
- Task not found → 404
- User not authorized → 403

---

### 6. POST /api/tasks/[id]/comments

**Purpose:** Add a comment to a task

**Authentication:** Required, user must have access to task

**Request Body:**
```json
{
  "content": "I'll have this completed by tomorrow afternoon"
}
```

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "comment_abc...",
    "taskId": "task_clx123...",
    "content": "I'll have this completed by tomorrow afternoon",
    "author": {
      "id": "user_456...",
      "name": "Jane Smith"
    },
    "createdAt": "2025-12-18T11:00:00Z"
  }
}
```

**Side Effects:**
- TaskActivity record created with action=COMMENTED
- Notification sent to task assignee (if not commenter)
- Notification sent to task creator (if not commenter)

**Error Cases:**
- User not authenticated → 401
- Task not found → 404
- Comment content empty → 400

---

### 7. GET /api/tasks/stats

**Purpose:** Get task statistics for current user or committee

**Authentication:** Required

**Query Parameters:**
- `userId` (optional): Get stats for specific user (defaults to current user)
- `committeeId` (optional): Get stats for committee

**Response:**
```json
{
  "stats": {
    "total": 24,
    "byStatus": {
      "TODO": 8,
      "IN_PROGRESS": 5,
      "COMPLETED": 10,
      "CANCELLED": 1
    },
    "byPriority": {
      "LOW": 3,
      "MEDIUM": 12,
      "HIGH": 7,
      "URGENT": 2
    },
    "overdue": 2,
    "dueSoon": 4,
    "completedThisWeek": 3,
    "completedThisMonth": 8,
    "averageCompletionTime": "3.5 days"
  }
}
```

---

## UI Components

### 1. Task Board Page

**Location:** `app/dashboard/tasks/page.tsx`

**Features:**
- Kanban board with 4 columns (TODO, IN_PROGRESS, COMPLETED, CANCELLED)
- Drag-and-drop task cards between columns
- Filter panel (status, priority, committee, assignee, due date)
- Search bar for title/description search
- "Create Task" button (top right)
- View toggle: Board / List / Calendar
- Task count badges on column headers
- Empty state when no tasks

**Component Structure:**
```tsx
<TaskBoardPage>
  <TaskBoardHeader>
    <SearchBar />
    <FilterPanel />
    <ViewToggle />
    <CreateTaskButton />
  </TaskBoardHeader>

  <TaskBoardContent>
    <TaskColumn status="TODO">
      {tasks.filter(t => t.status === 'TODO').map(task => (
        <TaskCard task={task} />
      ))}
    </TaskColumn>

    <TaskColumn status="IN_PROGRESS">
      {/* ... */}
    </TaskColumn>

    <TaskColumn status="COMPLETED">
      {/* ... */}
    </TaskColumn>

    <TaskColumn status="CANCELLED">
      {/* ... */}
    </TaskColumn>
  </TaskBoardContent>
</TaskBoardPage>
```

---

### 2. Task Card Component

**Location:** `app/components/tasks/TaskCard.tsx`

**Features:**
- Title (truncated to 2 lines)
- Priority badge (color-coded)
- Due date with overdue indicator
- Assignee avatar
- Committee badge (if applicable)
- Click to open task detail modal
- Drag handle for reordering

**Visual Design:**
```
┌─────────────────────────────────┐
│ [URGENT] Review Q1 Budget       │
│                                 │
│ Due: Dec 24 ⚠️ OVERDUE         │
│ [Wealth Board]                  │
│                                 │
│ [Avatar] Jane Smith             │
└─────────────────────────────────┘
```

**Component Props:**
```tsx
interface TaskCardProps {
  task: Task & {
    assignedTo?: User;
    committee?: Committee;
  };
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
  onClick?: () => void;
}
```

---

### 3. Task Detail Modal

**Location:** `app/components/tasks/TaskDetailModal.tsx`

**Features:**
- Full task information display
- Editable fields (title, description, status, priority, due date, assignee)
- Comments section with add comment form
- Activity timeline showing all changes
- Action buttons (Save, Delete, Close)
- Permission-based field editing

**Component Structure:**
```tsx
<TaskDetailModal task={task} isOpen={isOpen} onClose={onClose}>
  <TaskDetailHeader>
    <TitleInput value={task.title} onChange={handleTitleChange} />
    <StatusSelect value={task.status} onChange={handleStatusChange} />
    <PrioritySelect value={task.priority} onChange={handlePriorityChange} />
  </TaskDetailHeader>

  <TaskDetailBody>
    <DescriptionEditor value={task.description} onChange={handleDescriptionChange} />

    <TaskMetadata>
      <DueDatePicker value={task.dueDate} onChange={handleDueDateChange} />
      <AssigneeSelect value={task.assignedToId} onChange={handleAssigneeChange} />
      <CommitteeSelect value={task.committeeId} onChange={handleCommitteeChange} />
    </TaskMetadata>

    <TaskComments comments={task.comments}>
      <CommentForm onSubmit={handleAddComment} />
    </TaskComments>

    <TaskActivityTimeline activities={task.activities} />
  </TaskDetailBody>

  <TaskDetailFooter>
    <DeleteButton onClick={handleDelete} />
    <CloseButton onClick={onClose} />
    <SaveButton onClick={handleSave} />
  </TaskDetailFooter>
</TaskDetailModal>
```

---

### 4. Create Task Modal

**Location:** `app/components/tasks/CreateTaskModal.tsx`

**Features:**
- Task creation form
- Title input (required)
- Description rich text editor
- Priority dropdown (default: MEDIUM)
- Due date picker
- Assignee search/select (default: current user)
- Committee dropdown (optional, filtered by user's committees)
- Submit and cancel buttons
- Form validation

---

### 5. Task List View

**Location:** `app/components/tasks/TaskListView.tsx`

**Features:**
- Table/list display of tasks (alternative to board view)
- Columns: Title, Status, Priority, Assignee, Committee, Due Date
- Sortable columns
- Row click to open task detail
- Bulk selection for batch operations
- Compact view for large task lists

---

### 6. Task Filter Panel

**Location:** `app/components/tasks/TaskFilterPanel.tsx`

**Features:**
- Status checkboxes (multi-select)
- Priority checkboxes (multi-select)
- Committee dropdown (multi-select)
- Assignee search/select (multi-select)
- Due date range picker
- "Overdue only" toggle
- "Clear all filters" button
- "Save filter preset" button
- Active filter count indicator

---

### 7. Task Statistics Widget

**Location:** `app/components/tasks/TaskStatsWidget.tsx`

**Features:**
- Display on dashboard or committee page
- Summary metrics (total, by status, overdue)
- Completion rate chart
- Trend indicators (completed this week/month)
- Click to filter task board

**Visual Design:**
```
┌─────────────────────────────────┐
│ My Tasks                        │
├─────────────────────────────────┤
│ TODO: 8        OVERDUE: 2 ⚠️    │
│ IN PROGRESS: 5                  │
│ COMPLETED: 10 ✓                 │
│                                 │
│ Completed this week: 3          │
│ [View All Tasks →]              │
└─────────────────────────────────┘
```

---

## Implementation Details

### Phase 1: Database & API (Days 1-3)

1. **Day 1: Database Schema**
   - Add TaskComment model to Prisma schema
   - Add TaskActivity model to Prisma schema
   - Update Task model with relations
   - Run database migrations
   - Test schema in Prisma Studio

2. **Day 2: Core API Endpoints**
   - Implement GET /api/tasks with filtering
   - Implement POST /api/tasks
   - Implement GET /api/tasks/[id]
   - Implement PATCH /api/tasks/[id]
   - Add permission checks and validation
   - Test API endpoints with Postman/Insomnia

3. **Day 3: Additional API Endpoints**
   - Implement DELETE /api/tasks/[id]
   - Implement POST /api/tasks/[id]/comments
   - Implement GET /api/tasks/stats
   - Add activity logging for all task changes
   - Test complete API workflow

### Phase 2: Task Board UI (Days 4-5)

1. **Day 4: Task Board Layout**
   - Create TaskBoardPage component
   - Implement 4-column Kanban board layout
   - Create TaskCard component with drag-and-drop
   - Add search bar and filter panel
   - Style with biophilic design system
   - Test responsive design

2. **Day 5: Task Detail & Create Modals**
   - Create TaskDetailModal component
   - Implement all editable fields
   - Add comments section
   - Create CreateTaskModal component
   - Add form validation
   - Test modal interactions

### Phase 3: Task Management Features (Days 6-7)

1. **Day 6: Filtering & Views**
   - Implement task filter panel with all filters
   - Add task list view (alternative to board)
   - Add task calendar view
   - Implement view toggle
   - Add filter presets functionality
   - Test all view modes

2. **Day 7: Notifications & Polish**
   - Implement notification system for task assignments
   - Add overdue task indicators and notifications
   - Create task statistics widget
   - Implement bulk operations
   - Add task export functionality
   - Final UI polish and bug fixes
   - Complete integration testing

---

## Testing Requirements

### Unit Tests

**API Endpoint Tests:**
```typescript
// Test task creation
test('POST /api/tasks creates task with valid data', async () => {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${validToken}` },
    body: JSON.stringify({
      title: 'Test Task',
      priority: 'HIGH',
      assignedToId: userId
    })
  });

  expect(res.status).toBe(201);
  const data = await res.json();
  expect(data.task.title).toBe('Test Task');
  expect(data.task.status).toBe('TODO');
});

// Test task filtering
test('GET /api/tasks filters by status', async () => {
  const res = await fetch('/api/tasks?status=TODO,IN_PROGRESS');
  const data = await res.json();

  data.tasks.forEach(task => {
    expect(['TODO', 'IN_PROGRESS']).toContain(task.status);
  });
});

// Test permission checks
test('User cannot update task they do not own', async () => {
  const res = await fetch('/api/tasks/someTaskId', {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${unauthorizedToken}` },
    body: JSON.stringify({ status: 'COMPLETED' })
  });

  expect(res.status).toBe(403);
});
```

**Component Tests:**
```typescript
// Test TaskCard rendering
test('TaskCard displays task information correctly', () => {
  render(<TaskCard task={mockTask} />);

  expect(screen.getByText('Test Task')).toBeInTheDocument();
  expect(screen.getByText('HIGH')).toBeInTheDocument();
  expect(screen.getByText('Dec 24')).toBeInTheDocument();
});

// Test drag and drop functionality
test('TaskCard can be dragged between columns', () => {
  const { container } = render(<TaskBoard tasks={mockTasks} />);

  const taskCard = screen.getByText('Test Task');
  const targetColumn = screen.getByTestId('in-progress-column');

  fireEvent.dragStart(taskCard);
  fireEvent.drop(targetColumn);

  // Verify task moved to new column
  expect(targetColumn).toContainElement(taskCard);
});
```

### Integration Tests

**Complete Task Workflow:**
1. User creates task
2. Task appears in TODO column
3. User drags task to IN_PROGRESS
4. Status updates via API
5. User adds comment
6. Comment appears in task detail
7. User marks task as COMPLETED
8. Task moves to COMPLETED column
9. Completion notification sent

**Committee Task Workflow:**
1. Committee leader creates committee task
2. Task assigned to committee member
3. Member receives notification
4. Member updates task status
5. Leader sees update in committee task list

### Manual Testing Checklist

- [ ] User can create personal task
- [ ] User can assign task to another user
- [ ] Task assignee receives notification
- [ ] User can update task status via drag-and-drop
- [ ] User can update task details in modal
- [ ] User can add comments to task
- [ ] Comments appear in activity timeline
- [ ] Overdue tasks show red indicator
- [ ] Overdue filter works correctly
- [ ] Committee tasks appear in committee view
- [ ] Committee leader can see all committee tasks
- [ ] Task board is responsive on mobile
- [ ] Task list view works correctly
- [ ] Task calendar view works correctly
- [ ] Filter panel filters correctly
- [ ] Search finds tasks by title/description
- [ ] Task statistics are accurate
- [ ] Bulk operations work
- [ ] Task export works
- [ ] Permissions enforced correctly

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated with new models
- [ ] Database migrations tested in development
- [ ] All API endpoints implemented and tested
- [ ] All UI components implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Code review completed
- [ ] Performance testing completed
- [ ] Security review completed

### Deployment Steps

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy to Hosting Platform**
   - Deploy Next.js application
   - Ensure environment variables configured
   - Verify database connection

4. **Smoke Tests**
   - Create test task
   - Update task status
   - Add comment
   - Delete task
   - Test notifications

### Post-Deployment

- [ ] All endpoints responding correctly
- [ ] Task board loads without errors
- [ ] Task creation works
- [ ] Task assignment notifications sent
- [ ] Overdue detection working
- [ ] Committee tasks integrated correctly
- [ ] Monitor error logs for first 24 hours
- [ ] Gather user feedback
- [ ] Create user documentation/guide

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Task Templates**
   - Pre-defined task templates for common workflows
   - Committee-specific templates
   - One-click task creation from template

2. **Recurring Tasks**
   - Create tasks that repeat on schedule
   - Weekly committee meeting preparation tasks
   - Monthly reporting tasks

3. **Task Dependencies**
   - Link tasks that depend on each other
   - Visual dependency graph
   - Blocker indicators

4. **Time Tracking**
   - Track time spent on tasks
   - Integrate with Sacred Ledger participation hours
   - Automatic equity calculation

5. **Advanced Notifications**
   - Slack/Discord integration
   - SMS notifications for urgent tasks
   - Daily/weekly task digest emails
   - Customizable notification preferences

6. **Task Automation**
   - Auto-assign tasks based on committee role
   - Auto-create tasks from event registrations
   - Auto-escalate overdue tasks

7. **Subtasks**
   - Break large tasks into smaller subtasks
   - Track subtask completion
   - Parent task auto-completes when all subtasks done

8. **Task Attachments**
   - Upload files to tasks
   - Link documents from document library
   - Image attachments for maintenance requests

9. **Advanced Analytics**
   - Task completion rate by user
   - Average time to completion
   - Workload distribution across committee
   - Burndown charts for sprint-style work

10. **Mobile App**
    - Native mobile app for task management
    - Push notifications
    - Offline mode

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
