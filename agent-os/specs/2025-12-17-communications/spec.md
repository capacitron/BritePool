# Specification: Communications System - Forums & Messaging

**Feature ID:** F004
**Priority:** High
**Effort:** Large (2 weeks / 14 days)
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
Implement a comprehensive communications platform that enables community-wide discussions through public forums, private committee messaging channels, admin broadcast announcements, and direct messaging capabilities. The system supports threaded discussions with rich text formatting, real-time updates, and powerful search functionality.

### Key Requirements
- Public discussion forums organized by categories
- Committee-specific private messaging channels
- Admin broadcast messaging with role-based targeting
- Threaded discussions with nested replies
- Rich text formatting (markdown with extended syntax)
- Message and post search functionality
- Real-time updates using WebSocket or Server-Sent Events
- File attachments for posts and messages
- Notification system for mentions and replies
- Moderation tools for content management

### Success Metrics
- All forum categories created and accessible
- Committee members can access their private channels
- Real-time message delivery latency < 500ms
- Search returns relevant results in < 2 seconds
- 100% of messages persisted and retrievable
- Moderation actions logged with full audit trail
- Mobile-responsive interface with full feature parity

---

## User Flows

### Flow 1: User Creates Public Forum Post

```
1. User logs in and navigates to /dashboard/forums
2. User sees list of forum categories:
   - General Discussion
   - Governance & Policy
   - Wealth & Finance
   - Education & Learning
   - Health & Wellness
   - Operations & Logistics
   - Announcements (read-only for non-admins)
3. User clicks on "General Discussion" category
4. User sees list of existing threads (posts with title)
5. User clicks "New Topic" button
6. User sees post creation form:
   - Title (required, max 200 chars)
   - Content (rich text editor with markdown support)
   - File attachments (optional, up to 5 files, 10MB each)
   - Tags (optional, comma-separated)
7. User writes content using rich text editor:
   - Bold, italic, underline formatting
   - Bullet and numbered lists
   - Code blocks with syntax highlighting
   - Links and images
   - @mentions for notifying other users
8. User clicks "Post Topic" button
9. POST /api/forums/posts
10. System validates:
    - User has accepted covenant
    - Title and content not empty
    - Attachments within size limits
    - Content scanned for prohibited content
11. ForumPost created with isThread=true
12. User redirected to /dashboard/forums/posts/[postId]
13. Post appears in category listing
14. Mentioned users receive notifications
```

### Flow 2: User Replies to Forum Thread

```
1. User navigates to existing forum thread
2. User sees original post at top
3. User sees threaded replies below
4. User clicks "Reply" button on specific post
5. Reply editor opens inline or in modal:
   - Rich text editor
   - File attachments
   - Preview mode toggle
6. User writes reply with @mention of another user
7. User clicks "Post Reply" button
8. POST /api/forums/posts (with parentId)
9. ForumPost created as reply (parentId set)
10. Reply appears in thread immediately (real-time update)
11. Parent post author receives notification
12. Mentioned users receive notifications
13. Reply count increments on parent post
```

### Flow 3: Committee Member Accesses Private Channel

```
1. Committee Member logs in
2. Member navigates to /dashboard/committees/[slug]
3. Member clicks "Messages" tab
4. System verifies user is committee member
5. Member sees committee-specific MessageThread
6. Thread shows all messages in chronological order
7. Member sees real-time indicator of who's online
8. Member scrolls to bottom to see message input
9. Member types message in input field
10. Member can:
    - Format text with markdown shortcuts
    - Attach files (drag and drop or click)
    - @mention committee members
    - React to messages with emojis
11. Member presses Enter or clicks "Send"
12. POST /api/messages
13. Message created with threadId (committee-specific)
14. Message broadcasts to all committee members via WebSocket
15. All online members see message appear instantly
16. Offline members see message on next login
17. Notification sent to offline members (optional)
```

### Flow 4: Admin Creates Broadcast Announcement

```
1. Admin logs in with WEB_STEWARD or BOARD_CHAIR role
2. Admin navigates to /dashboard/admin/announcements
3. Admin clicks "Create Announcement" button
4. Admin sees announcement creation form:
   - Title (required)
   - Content (rich text editor)
   - Priority (dropdown: URGENT, IMPORTANT, INFO)
   - Target Roles (multi-select: All, Stewards, Partners, etc.)
   - Pin to top (checkbox)
   - Expiration date (optional)
5. Admin writes announcement content
6. Admin selects priority: URGENT
7. Admin selects target roles: All Members
8. Admin checks "Pin to top" checkbox
9. Admin clicks "Publish Announcement"
10. POST /api/announcements
11. Announcement created and published
12. System creates MessageThread with type=BROADCAST
13. Message sent to all targeted users
14. Announcement appears on dashboard for all users
15. Pinned announcements show at top of forums
16. Email notifications sent based on priority (URGENT sends emails)
17. Admin sees confirmation: "Announcement published to 247 users"
```

### Flow 5: User Searches Messages and Forum Posts

```
1. User navigates to /dashboard/forums or /dashboard/messages
2. User clicks search icon or uses keyboard shortcut (Ctrl+K)
3. Search modal opens with focus on input field
4. User types search query: "budget allocation"
5. As user types, system shows:
   - Recent searches (if any)
   - Search suggestions
6. User presses Enter or clicks "Search"
7. GET /api/search?q=budget+allocation&type=all
8. System searches across:
   - Forum post titles and content
   - Message content
   - Announcement content
   - User names (for @mentions)
9. Search results display:
   - Type (Forum Post, Message, Announcement)
   - Title/Preview
   - Author and timestamp
   - Relevance score
   - Highlight matching keywords
10. Results filtered by user permissions:
    - Only shows forum posts user can access
    - Only shows messages from user's threads
11. User clicks on result
12. User redirected to specific post or message
13. Search term highlighted in content
```

### Flow 6: Moderator Flags and Removes Inappropriate Content

```
1. User reports a forum post as inappropriate
2. User clicks "Report" button on post
3. Report modal opens:
   - Reason (dropdown: Spam, Harassment, Off-topic, etc.)
   - Additional details (optional text)
4. User submits report
5. POST /api/forums/posts/[id]/report
6. Report logged in database
7. Moderator receives notification
8. Moderator navigates to /dashboard/admin/moderation
9. Moderator sees list of reported posts
10. Moderator clicks on reported post
11. Moderator sees:
    - Original post content
    - Reporter information
    - Report reason and details
    - Post history (edits)
    - Author's posting history
12. Moderator decides to remove post
13. Moderator clicks "Remove Post" button
14. Confirmation modal: "This will hide the post from all users"
15. Moderator confirms
16. POST /api/forums/posts/[id]/moderate
17. Post marked as removed (soft delete)
18. Post hidden from public view
19. Author receives notification: "Your post was removed"
20. Moderation action logged with timestamp and moderator ID
21. Post appears in moderation log for audit trail
```

### Flow 7: Real-Time Message Updates in Committee Channel

```
1. User A is viewing committee channel (WebSocket connected)
2. User B (also in channel) sends a message
3. User B's client sends message via WebSocket:
   - Event: "message:send"
   - Payload: { threadId, content, attachments }
4. Server receives WebSocket event
5. Server validates:
   - User B is authenticated
   - User B is member of committee
   - Content not empty
6. Server saves message to database
7. Server broadcasts to all connected clients in thread:
   - Event: "message:new"
   - Payload: { message object with author details }
8. User A's client receives "message:new" event
9. User A sees message appear at bottom of chat
10. User A sees typing indicator disappear for User B
11. User A's message list scrolls to bottom (if near bottom)
12. User A sees notification badge if tab not in focus
13. Both users see message with timestamp and read status
```

---

## Database Schema

### Existing Models (from Prisma schema)

The following models already exist and will be extended:

```prisma
model ForumPost {
  id          String   @id @default(cuid())
  title       String?
  content     String
  authorId    String
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  parentId    String?
  parent      ForumPost? @relation("Replies", fields: [parentId], references: [id])
  replies     ForumPost[] @relation("Replies")

  categoryId  String?
  category    ForumCategory? @relation(fields: [categoryId], references: [id])

  isPinned    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([authorId])
  @@index([categoryId])
  @@index([createdAt])
}

model ForumCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?

  posts       ForumPost[]

  createdAt   DateTime @default(now())
}

model Announcement {
  id          String   @id @default(cuid())
  title       String
  content     String
  priority    AnnouncementPriority @default(INFO)

  targetRoles UserRole[]

  isPinned    Boolean  @default(false)
  publishedAt DateTime @default(now())
  expiresAt   DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([publishedAt])
  @@index([isPinned])
}
```

### New Models: Messaging System

```prisma
model MessageThread {
  id          String   @id @default(cuid())
  name        String?  // Optional name for group threads
  type        ThreadType @default(DIRECT)

  // For committee threads
  committeeId String?  @unique
  committee   Committee? @relation(fields: [committeeId], references: [id], onDelete: Cascade)

  // For broadcast threads (announcements)
  announcementId String? @unique
  announcement   Announcement? @relation(fields: [announcementId], references: [id])

  messages    Message[]
  participants ThreadParticipant[]

  lastMessageAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
  @@index([committeeId])
  @@index([lastMessageAt])
}

model Message {
  id          String   @id @default(cuid())
  content     String
  threadId    String
  thread      MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  authorId    String
  author      User     @relation("MessagesSent", fields: [authorId], references: [id], onDelete: Cascade)

  // For replies/threading
  replyToId   String?
  replyTo     Message? @relation("MessageReplies", fields: [replyToId], references: [id])
  replies     Message[] @relation("MessageReplies")

  // Attachments stored as JSON array
  attachments Json?    // [{ name: "file.pdf", url: "s3://...", size: 12345, mimeType: "application/pdf" }]

  // Mentions
  mentions    String[] // Array of user IDs mentioned in message

  // Message status
  isEdited    Boolean  @default(false)
  editedAt    DateTime?
  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?

  // Read receipts
  readBy      MessageRead[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([threadId])
  @@index([authorId])
  @@index([createdAt])
}

model ThreadParticipant {
  id           String   @id @default(cuid())
  threadId     String
  thread       MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  userId       String
  user         User     @relation("ThreadParticipations", fields: [userId], references: [id], onDelete: Cascade)

  role         ParticipantRole @default(MEMBER)

  // Last read tracking
  lastReadAt   DateTime?

  // Notifications
  isMuted      Boolean  @default(false)

  joinedAt     DateTime @default(now())

  @@unique([threadId, userId])
  @@index([threadId])
  @@index([userId])
}

model MessageRead {
  id          String   @id @default(cuid())
  messageId   String
  message     Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  userId      String
  user        User     @relation("MessagesRead", fields: [userId], references: [id], onDelete: Cascade)

  readAt      DateTime @default(now())

  @@unique([messageId, userId])
  @@index([messageId])
  @@index([userId])
}

enum ThreadType {
  DIRECT       // One-on-one messaging
  GROUP        // Group chat (future use)
  COMMITTEE    // Committee-specific channel
  BROADCAST    // Admin announcements (one-way)
}

enum ParticipantRole {
  ADMIN        // Can add/remove participants, modify settings
  MEMBER       // Regular participant
}
```

### Updates to Existing Models

Add the following relations to existing models:

```prisma
model User {
  // ... existing fields

  messagesSent      Message[] @relation("MessagesSent")
  messagesRead      MessageRead[] @relation("MessagesRead")
  threadParticipations ThreadParticipant[] @relation("ThreadParticipations")
}

model Committee {
  // ... existing fields

  messageThread  MessageThread?
}

model Announcement {
  // ... existing fields

  messageThread  MessageThread?
}
```

### Extended ForumPost Model

Add the following fields to ForumPost:

```prisma
model ForumPost {
  // ... existing fields

  // Extended fields
  attachments Json?     // [{ name: "file.pdf", url: "s3://...", size: 12345 }]
  mentions    String[]  // Array of user IDs mentioned in post
  tags        String[]  // Array of tags for categorization

  isEdited    Boolean   @default(false)
  editedAt    DateTime?

  isRemoved   Boolean   @default(false)
  removedAt   DateTime?
  removedById String?
  removedBy   User?     @relation("PostsRemoved", fields: [removedById], references: [id])

  viewCount   Int       @default(0)
  replyCount  Int       @default(0)

  reports     PostReport[]

  @@index([isRemoved])
  @@index([tags])
}

model PostReport {
  id          String   @id @default(cuid())
  postId      String
  post        ForumPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  reporterId  String
  reporter    User     @relation("ReportsSubmitted", fields: [reporterId], references: [id])

  reason      ReportReason
  details     String?
  status      ReportStatus @default(PENDING)

  resolvedById String?
  resolvedBy   User?    @relation("ReportsResolved", fields: [resolvedById], references: [id])
  resolvedAt   DateTime?
  resolution   String?

  createdAt   DateTime @default(now())

  @@index([postId])
  @@index([status])
  @@index([reporterId])
}

enum ReportReason {
  SPAM
  HARASSMENT
  INAPPROPRIATE_CONTENT
  OFF_TOPIC
  MISINFORMATION
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  DISMISSED
}
```

### Database Migration

Run Prisma migrations:
```bash
npx prisma db push
```

### Seed Data: Initialize Forum Categories and Committee Threads

```typescript
// prisma/seed.ts
async function seedForumCategories() {
  const categories = [
    {
      name: 'General Discussion',
      slug: 'general',
      description: 'Community-wide discussions on any topic relevant to BRITE POOL'
    },
    {
      name: 'Governance & Policy',
      slug: 'governance',
      description: 'Discussions about community governance, policies, and decision-making'
    },
    {
      name: 'Wealth & Finance',
      slug: 'wealth',
      description: 'Financial matters, fundraising, investments, and resource allocation'
    },
    {
      name: 'Education & Learning',
      slug: 'education',
      description: 'Course discussions, learning resources, and educational initiatives'
    },
    {
      name: 'Health & Wellness',
      slug: 'health',
      description: 'Health programs, wellness practices, and healing modalities'
    },
    {
      name: 'Operations & Logistics',
      slug: 'operations',
      description: 'Facility operations, maintenance, logistics, and infrastructure'
    },
    {
      name: 'Announcements',
      slug: 'announcements',
      description: 'Official announcements from administrators and board members'
    }
  ];

  for (const category of categories) {
    await prisma.forumCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    });
  }
}

async function seedCommitteeThreads() {
  const committees = await prisma.committee.findMany();

  for (const committee of committees) {
    const existingThread = await prisma.messageThread.findFirst({
      where: { committeeId: committee.id }
    });

    if (!existingThread) {
      const thread = await prisma.messageThread.create({
        data: {
          name: `${committee.name} Channel`,
          type: 'COMMITTEE',
          committeeId: committee.id
        }
      });

      // Add all committee members as thread participants
      const members = await prisma.committeeMember.findMany({
        where: { committeeId: committee.id }
      });

      for (const member of members) {
        await prisma.threadParticipant.create({
          data: {
            threadId: thread.id,
            userId: member.userId,
            role: member.role === 'LEADER' ? 'ADMIN' : 'MEMBER'
          }
        });
      }
    }
  }
}
```

---

## API Endpoints

### Forum Posts API

#### 1. GET /api/forums/categories

**Purpose:** List all forum categories

**Authentication:** Required (any authenticated user)

**Query Parameters:**
- `includePostCount` (optional, boolean): Include post count per category

**Response:**
```json
{
  "categories": [
    {
      "id": "clx123...",
      "name": "General Discussion",
      "slug": "general",
      "description": "Community-wide discussions...",
      "postCount": 42,
      "latestPost": {
        "id": "clx456...",
        "title": "Welcome to BRITE POOL!",
        "author": { "name": "John Doe" },
        "createdAt": "2025-12-17T10:00:00Z"
      }
    }
  ]
}
```

---

#### 2. GET /api/forums/categories/[slug]/posts

**Purpose:** Get all posts in a category (top-level threads only)

**Authentication:** Required

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `sortBy` (optional: recent, popular, oldest)

**Response:**
```json
{
  "posts": [
    {
      "id": "clx789...",
      "title": "Budget Proposal Discussion",
      "content": "I'd like to propose...",
      "author": {
        "id": "user_123",
        "name": "Jane Smith",
        "role": "STEWARD"
      },
      "categoryId": "clx123...",
      "replyCount": 15,
      "viewCount": 87,
      "isPinned": false,
      "tags": ["budget", "governance"],
      "createdAt": "2025-12-17T12:00:00Z",
      "updatedAt": "2025-12-17T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

#### 3. POST /api/forums/posts

**Purpose:** Create a new forum post or reply

**Authentication:** Required

**Request Body:**
```json
{
  "title": "New Discussion Topic",
  "content": "This is the post content with **markdown** formatting",
  "categoryId": "clx123...",
  "parentId": null,
  "tags": ["discussion", "important"],
  "attachments": [
    {
      "name": "document.pdf",
      "url": "s3://bucket/path/file.pdf",
      "size": 123456,
      "mimeType": "application/pdf"
    }
  ]
}
```

**Validation:**
- If `parentId` is null, `title` is required
- `content` must not be empty
- User must have accepted covenant
- Attachments must be pre-uploaded (via separate upload endpoint)

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "clx999...",
    "title": "New Discussion Topic",
    "content": "This is the post content...",
    "authorId": "user_123",
    "categoryId": "clx123...",
    "createdAt": "2025-12-17T15:00:00Z"
  }
}
```

---

#### 4. GET /api/forums/posts/[id]

**Purpose:** Get a single post with all replies (threaded)

**Authentication:** Required

**Response:**
```json
{
  "post": {
    "id": "clx789...",
    "title": "Budget Proposal Discussion",
    "content": "I'd like to propose...",
    "author": {
      "id": "user_123",
      "name": "Jane Smith",
      "role": "STEWARD"
    },
    "categoryId": "clx123...",
    "category": {
      "name": "Governance & Policy",
      "slug": "governance"
    },
    "attachments": [],
    "mentions": ["user_456", "user_789"],
    "tags": ["budget", "governance"],
    "isPinned": false,
    "isEdited": false,
    "viewCount": 88,
    "replyCount": 15,
    "replies": [
      {
        "id": "clx888...",
        "content": "Great idea! I support this proposal.",
        "author": {
          "id": "user_456",
          "name": "Bob Johnson"
        },
        "parentId": "clx789...",
        "createdAt": "2025-12-17T13:00:00Z",
        "replies": [
          {
            "id": "clx999...",
            "content": "I agree with Bob",
            "author": { "id": "user_789", "name": "Alice Williams" },
            "parentId": "clx888...",
            "createdAt": "2025-12-17T13:30:00Z",
            "replies": []
          }
        ]
      }
    ],
    "createdAt": "2025-12-17T12:00:00Z",
    "updatedAt": "2025-12-17T14:30:00Z"
  }
}
```

---

#### 5. PATCH /api/forums/posts/[id]

**Purpose:** Edit an existing post

**Authentication:** Required (must be post author or moderator)

**Request Body:**
```json
{
  "content": "Updated content with corrections",
  "tags": ["budget", "governance", "updated"]
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "clx789...",
    "content": "Updated content with corrections",
    "isEdited": true,
    "editedAt": "2025-12-17T15:30:00Z",
    "updatedAt": "2025-12-17T15:30:00Z"
  }
}
```

---

#### 6. DELETE /api/forums/posts/[id]

**Purpose:** Delete a post (soft delete)

**Authentication:** Required (must be post author or moderator)

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

#### 7. POST /api/forums/posts/[id]/report

**Purpose:** Report a post for moderation

**Authentication:** Required

**Request Body:**
```json
{
  "reason": "SPAM",
  "details": "This post contains promotional content"
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "report_123...",
    "status": "PENDING"
  }
}
```

---

### Messaging API

#### 8. GET /api/messages/threads

**Purpose:** Get all message threads for current user

**Authentication:** Required

**Query Parameters:**
- `type` (optional): Filter by thread type (DIRECT, COMMITTEE, BROADCAST)

**Response:**
```json
{
  "threads": [
    {
      "id": "thread_123...",
      "name": "Governance Board Channel",
      "type": "COMMITTEE",
      "committeeId": "committee_456...",
      "lastMessage": {
        "id": "msg_789...",
        "content": "Meeting scheduled for tomorrow",
        "author": { "name": "John Doe" },
        "createdAt": "2025-12-17T14:00:00Z"
      },
      "lastMessageAt": "2025-12-17T14:00:00Z",
      "unreadCount": 3,
      "participants": [
        {
          "userId": "user_123",
          "user": { "name": "Jane Smith" },
          "role": "ADMIN"
        }
      ]
    }
  ]
}
```

---

#### 9. GET /api/messages/threads/[id]

**Purpose:** Get all messages in a thread

**Authentication:** Required (must be thread participant)

**Query Parameters:**
- `limit` (optional, default: 50)
- `before` (optional): Cursor for pagination (message ID)
- `after` (optional): Cursor for pagination (message ID)

**Response:**
```json
{
  "thread": {
    "id": "thread_123...",
    "name": "Governance Board Channel",
    "type": "COMMITTEE",
    "participants": [...]
  },
  "messages": [
    {
      "id": "msg_789...",
      "content": "Meeting scheduled for tomorrow at 3pm",
      "threadId": "thread_123...",
      "author": {
        "id": "user_123",
        "name": "John Doe",
        "role": "COMMITTEE_LEADER"
      },
      "replyToId": null,
      "attachments": [],
      "mentions": ["user_456"],
      "isEdited": false,
      "isDeleted": false,
      "readBy": [
        {
          "userId": "user_456",
          "readAt": "2025-12-17T14:05:00Z"
        }
      ],
      "createdAt": "2025-12-17T14:00:00Z"
    }
  ],
  "hasMore": false,
  "cursor": null
}
```

---

#### 10. POST /api/messages

**Purpose:** Send a new message in a thread

**Authentication:** Required (must be thread participant)

**Request Body:**
```json
{
  "threadId": "thread_123...",
  "content": "This is a new message with @user_456 mentioned",
  "replyToId": "msg_789...",
  "attachments": [
    {
      "name": "agenda.pdf",
      "url": "s3://bucket/path/file.pdf",
      "size": 98765,
      "mimeType": "application/pdf"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg_999...",
    "content": "This is a new message with @user_456 mentioned",
    "threadId": "thread_123...",
    "authorId": "user_123",
    "mentions": ["user_456"],
    "createdAt": "2025-12-17T15:00:00Z"
  }
}
```

**Side Effects:**
- Message broadcast via WebSocket to all connected participants
- Mentioned users receive notifications
- Thread's `lastMessageAt` updated

---

#### 11. PATCH /api/messages/[id]

**Purpose:** Edit a message

**Authentication:** Required (must be message author)

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg_999...",
    "content": "Updated message content",
    "isEdited": true,
    "editedAt": "2025-12-17T15:05:00Z"
  }
}
```

---

#### 12. DELETE /api/messages/[id]

**Purpose:** Delete a message (soft delete)

**Authentication:** Required (must be message author or thread admin)

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

#### 13. POST /api/messages/[id]/read

**Purpose:** Mark a message as read

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "readAt": "2025-12-17T15:10:00Z"
}
```

---

### Announcements API

#### 14. GET /api/announcements

**Purpose:** Get announcements for current user

**Authentication:** Required

**Query Parameters:**
- `onlyPinned` (optional, boolean)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "announcements": [
    {
      "id": "ann_123...",
      "title": "Important: System Maintenance Scheduled",
      "content": "The platform will be down for maintenance...",
      "priority": "URGENT",
      "targetRoles": ["WEB_STEWARD", "BOARD_CHAIR", "STEWARD"],
      "isPinned": true,
      "publishedAt": "2025-12-17T08:00:00Z",
      "expiresAt": "2025-12-20T00:00:00Z"
    }
  ]
}
```

---

#### 15. POST /api/announcements (Admin Only)

**Purpose:** Create a new announcement

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "title": "Community Meeting This Friday",
  "content": "Join us for the monthly community meeting...",
  "priority": "IMPORTANT",
  "targetRoles": ["STEWARD", "PARTNER", "RESIDENT"],
  "isPinned": true,
  "expiresAt": "2025-12-22T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "announcement": {
    "id": "ann_456...",
    "title": "Community Meeting This Friday",
    "publishedAt": "2025-12-17T16:00:00Z"
  },
  "recipientCount": 187
}
```

**Side Effects:**
- MessageThread created with type=BROADCAST
- Message sent to all users with matching roles
- Email notifications sent for URGENT priority

---

### Search API

#### 16. GET /api/search

**Purpose:** Search across forums, messages, and announcements

**Authentication:** Required

**Query Parameters:**
- `q` (required): Search query string
- `type` (optional): Filter by content type (posts, messages, announcements, all)
- `categoryId` (optional): Filter posts by category
- `threadId` (optional): Filter messages by thread
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "results": [
    {
      "type": "FORUM_POST",
      "id": "clx789...",
      "title": "Budget Proposal Discussion",
      "content": "...budget allocation for sanctuary...",
      "excerpt": "...budget allocation for sanctuary improvements...",
      "author": { "name": "Jane Smith" },
      "category": "Governance & Policy",
      "relevanceScore": 0.92,
      "createdAt": "2025-12-17T12:00:00Z",
      "url": "/dashboard/forums/posts/clx789"
    },
    {
      "type": "MESSAGE",
      "id": "msg_999...",
      "content": "...regarding the budget meeting tomorrow...",
      "excerpt": "...regarding the budget meeting tomorrow...",
      "author": { "name": "John Doe" },
      "thread": "Governance Board Channel",
      "relevanceScore": 0.88,
      "createdAt": "2025-12-17T14:00:00Z",
      "url": "/dashboard/messages/thread_123#msg_999"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 20,
    "offset": 0
  }
}
```

**Search Algorithm:**
- Full-text search using PostgreSQL `tsvector` and `tsquery`
- Results filtered by user permissions
- Relevance scoring based on:
  - Exact match vs. partial match
  - Match in title vs. content
  - Recency of content
  - User's role and relationship to content

---

### File Upload API

#### 17. POST /api/upload

**Purpose:** Upload file attachment for posts or messages

**Authentication:** Required

**Request Body:** `multipart/form-data`
- `file`: File to upload
- `type`: "forum" or "message"

**Validation:**
- Max file size: 10MB
- Allowed types: images (jpg, png, gif), documents (pdf, docx), archives (zip)

**Response:**
```json
{
  "success": true,
  "file": {
    "name": "document.pdf",
    "url": "s3://bucket/uploads/clx123.../document.pdf",
    "size": 123456,
    "mimeType": "application/pdf"
  }
}
```

---

## UI Components

### 1. Forum List Page

**Location:** `app/dashboard/forums/page.tsx`

**Features:**
- Grid/list view of forum categories
- Category cards showing:
  - Name and description
  - Post count
  - Latest post preview
  - Icon representing category
- Search bar at top
- "New Topic" button (floating action button)
- Filter by category tags
- Pinned announcements section at top

**Component Structure:**
```tsx
export default function ForumsPage() {
  const { data: categories } = useQuery('forumCategories', fetchCategories);
  const { data: pinned } = useQuery('pinnedAnnouncements', fetchPinned);

  return (
    <div className="container mx-auto py-8">
      {pinned && <PinnedAnnouncementsBar announcements={pinned} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif">Community Forums</h1>
        <SearchButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <ForumCategoryCard key={category.id} category={category} />
        ))}
      </div>

      <FloatingActionButton onClick={() => router.push('/dashboard/forums/new')} />
    </div>
  );
}
```

---

### 2. Forum Thread List

**Location:** `app/dashboard/forums/categories/[slug]/page.tsx`

**Features:**
- Breadcrumb navigation (Forums > Category Name)
- Category header with description
- List of thread posts (table or card view)
- Each post shows:
  - Title
  - Author name and avatar
  - Reply count
  - View count
  - Last activity timestamp
  - Tags
  - Pin indicator
- Sort options (Recent, Popular, Oldest)
- Pagination
- "New Topic" button

**Component Structure:**
```tsx
export default function ForumCategoryPage({ params }) {
  const { slug } = params;
  const { data: posts, isLoading } = useQuery(
    ['forumPosts', slug],
    () => fetchPosts(slug)
  );

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={[
        { label: 'Forums', href: '/dashboard/forums' },
        { label: category.name }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-serif mb-2">{category.name}</h1>
        <p className="text-gray-600">{category.description}</p>
      </div>

      <div className="flex justify-between mb-4">
        <SortDropdown value={sortBy} onChange={setSortBy} />
        <Button onClick={() => router.push('/dashboard/forums/new')}>
          New Topic
        </Button>
      </div>

      <ForumThreadList posts={posts} />
      <Pagination {...paginationProps} />
    </div>
  );
}
```

---

### 3. Forum Post Detail (Thread View)

**Location:** `app/dashboard/forums/posts/[id]/page.tsx`

**Features:**
- Breadcrumb navigation
- Original post at top (larger, emphasized)
- Post metadata (author, timestamp, edit indicator)
- Post content with rich text rendering
- Attachments display
- Tags
- Action buttons (Reply, Edit, Delete, Report)
- Threaded replies below
  - Indented display for nested replies
  - Collapse/expand threads
  - "Load more replies" for deep threads
- Reply editor at bottom or inline
- Real-time updates for new replies

**Component Structure:**
```tsx
export default function ForumPostPage({ params }) {
  const { id } = params;
  const { data: post } = useQuery(['forumPost', id], () => fetchPost(id));
  const queryClient = useQueryClient();

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = subscribeToPost(id);
    channel.on('reply:new', (reply) => {
      queryClient.setQueryData(['forumPost', id], (old) => ({
        ...old,
        replies: [...old.replies, reply]
      }));
    });
    return () => channel.unsubscribe();
  }, [id]);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Breadcrumb items={breadcrumbItems} />

      <ForumPostCard post={post} isMainPost={true} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          {post.replyCount} Replies
        </h2>
        <ThreadedReplies replies={post.replies} />
      </div>

      <ReplyEditor postId={id} />
    </div>
  );
}
```

---

### 4. Rich Text Editor Component

**Location:** `app/components/forums/RichTextEditor.tsx`

**Features:**
- Markdown-based editor with WYSIWYG preview
- Toolbar with formatting buttons:
  - Bold, italic, underline
  - Headers (H1, H2, H3)
  - Lists (bullet, numbered)
  - Links and images
  - Code blocks
  - Blockquotes
- @mention autocomplete
- Emoji picker
- File attachment drag-and-drop
- Preview mode toggle
- Character/word count
- Auto-save drafts (localStorage)

**Component Structure:**
```tsx
export function RichTextEditor({ value, onChange, placeholder }) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleMention = (query: string) => {
    // Autocomplete logic for @mentions
    return searchUsers(query);
  };

  const handleAttachment = async (file: File) => {
    const uploaded = await uploadFile(file);
    insertAtCursor(`[${file.name}](${uploaded.url})`);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Toolbar
        onFormat={handleFormat}
        onToggleMode={() => setMode(m => m === 'edit' ? 'preview' : 'edit')}
      />

      {mode === 'edit' ? (
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 min-h-[200px] resize-y"
        />
      ) : (
        <div className="p-4 prose max-w-none">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      )}

      <div className="border-t p-2 flex justify-between items-center">
        <AttachmentButton onAttach={handleAttachment} />
        <CharacterCount count={value.length} max={10000} />
      </div>
    </div>
  );
}
```

---

### 5. Messages Page (Committee Channels)

**Location:** `app/dashboard/messages/page.tsx`

**Features:**
- Two-panel layout (list + chat view)
- Left panel: Thread list
  - Committee threads
  - Direct messages (future)
  - Search threads
  - Unread badges
- Right panel: Active thread
  - Thread header (name, participants)
  - Message list (scrollable)
  - Message input at bottom
  - Real-time updates
- Mobile responsive (single panel with navigation)

**Component Structure:**
```tsx
export default function MessagesPage() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { data: threads } = useQuery('messageThreads', fetchThreads);

  return (
    <div className="h-screen flex">
      <ThreadList
        threads={threads}
        activeId={activeThreadId}
        onSelect={setActiveThreadId}
      />

      {activeThreadId ? (
        <MessagePanel threadId={activeThreadId} />
      ) : (
        <EmptyState message="Select a conversation to start messaging" />
      )}
    </div>
  );
}
```

---

### 6. Message Panel Component

**Location:** `app/components/messages/MessagePanel.tsx`

**Features:**
- Thread header with participants and settings
- Message list with infinite scroll (load older)
- Message bubbles with:
  - Author avatar and name
  - Message content (markdown rendered)
  - Attachments
  - Timestamp
  - Read receipts
  - Edit/delete actions (for author)
- Typing indicators
- Message input with:
  - Text input
  - Emoji picker
  - File attachment
  - Send button
  - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
- Real-time message updates via WebSocket

**Component Structure:**
```tsx
export function MessagePanel({ threadId }) {
  const { data: thread } = useQuery(['thread', threadId], () => fetchThread(threadId));
  const { data: messages } = useInfiniteQuery(
    ['messages', threadId],
    ({ pageParam }) => fetchMessages(threadId, pageParam),
    { getNextPageParam: (lastPage) => lastPage.cursor }
  );

  const { sendMessage, isConnected } = useWebSocket(threadId);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage({ content: newMessage, threadId });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <ThreadHeader thread={thread} />

      <MessageList
        messages={messages?.pages.flatMap(p => p.messages) || []}
        onLoadMore={() => fetchNextPage()}
      />

      <MessageInput
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSend}
        isConnected={isConnected}
      />
    </div>
  );
}
```

---

### 7. Search Modal Component

**Location:** `app/components/search/SearchModal.tsx`

**Features:**
- Global search modal (triggered by Ctrl+K)
- Search input with autocomplete
- Filter tabs (All, Forums, Messages, Announcements)
- Search results list with:
  - Result type indicator
  - Title/preview
  - Author and timestamp
  - Relevance highlighting
- Keyboard navigation
- Recent searches
- Empty state with suggestions

**Component Structure:**
```tsx
export function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'posts' | 'messages'>('all');
  const { data: results, isLoading } = useQuery(
    ['search', query, type],
    () => search(query, type),
    { enabled: query.length >= 3 }
  );

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-start justify-center pt-20">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search forums, messages, and announcements..."
          />

          <FilterTabs value={type} onChange={setType} />

          <SearchResults
            results={results}
            isLoading={isLoading}
            query={query}
            onSelect={(result) => {
              router.push(result.url);
              onClose();
            }}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
```

---

### 8. Admin Moderation Dashboard

**Location:** `app/dashboard/admin/moderation/page.tsx`

**Features:**
- List of reported posts
- Filter by status (Pending, Reviewed, Resolved)
- Each report shows:
  - Post preview
  - Reporter information
  - Report reason and details
  - Timestamp
- Actions (View Post, Approve, Remove, Dismiss)
- Moderation log/history
- Statistics (total reports, resolution time, etc.)

**Component Structure:**
```tsx
export default function ModerationPage() {
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const { data: reports } = useQuery(
    ['reports', status],
    () => fetchReports(status)
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-serif mb-6">Content Moderation</h1>

      <Tabs value={status} onChange={setStatus}>
        <Tab value="PENDING">Pending ({reports.pending})</Tab>
        <Tab value="REVIEWED">Reviewed ({reports.reviewed})</Tab>
        <Tab value="RESOLVED">Resolved ({reports.resolved})</Tab>
      </Tabs>

      <ReportList
        reports={reports.items}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
```

---

## Implementation Details

### Phase 1: Database & Core API (Days 1-4)

1. **Database Schema** (Day 1)
   - Add new models (MessageThread, Message, ThreadParticipant, MessageRead, PostReport)
   - Extend existing models (ForumPost, User)
   - Run Prisma migrations
   - Create seed scripts for forum categories and committee threads

2. **Forum API Endpoints** (Days 2-3)
   - Implement CRUD operations for forum posts
   - Add reply/threading logic
   - Implement post reporting
   - Add file upload handling
   - Create permission checks and validation

3. **Messaging API Endpoints** (Day 4)
   - Implement thread and message CRUD
   - Add read receipt tracking
   - Create committee thread initialization
   - Add participant management

### Phase 2: Real-Time Communications (Days 5-6)

1. **WebSocket Server Setup** (Day 5)
   - Set up Socket.IO or native WebSocket server
   - Implement authentication middleware
   - Create room/channel management
   - Add connection handling and reconnection logic

2. **Real-Time Message Broadcasting** (Day 6)
   - Implement message send/receive via WebSocket
   - Add typing indicators
   - Add online/offline presence
   - Handle message delivery and read receipts

### Phase 3: Forum UI Components (Days 7-9)

1. **Forum List and Category Pages** (Day 7)
   - Create forum list page with categories
   - Implement category detail page
   - Add pinned announcements bar
   - Style with biophilic design system

2. **Thread View and Posting** (Day 8)
   - Create thread detail page with replies
   - Implement threaded reply display
   - Add rich text editor component
   - Add file attachment UI

3. **Post Actions and Moderation** (Day 9)
   - Add edit/delete functionality
   - Implement report modal
   - Create moderation dashboard
   - Add admin actions (remove, pin, etc.)

### Phase 4: Messaging UI (Days 10-12)

1. **Message List and Thread Selection** (Day 10)
   - Create two-panel layout
   - Implement thread list with search
   - Add unread badges and notifications
   - Make responsive for mobile

2. **Message Panel and Input** (Day 11)
   - Create message list component
   - Implement infinite scroll for history
   - Add message input with formatting
   - Add file attachment UI

3. **Real-Time Integration** (Day 12)
   - Connect WebSocket to UI
   - Add real-time message updates
   - Implement typing indicators
   - Add presence indicators

### Phase 5: Search and Polish (Days 13-14)

1. **Search Implementation** (Day 13)
   - Set up full-text search in PostgreSQL
   - Implement search API with filtering
   - Create search modal UI
   - Add keyboard shortcuts

2. **Testing and Polish** (Day 14)
   - End-to-end testing of all flows
   - Performance optimization
   - UI/UX polish and accessibility
   - Documentation and deployment prep

---

## Testing Requirements

### Unit Tests

```typescript
// Test forum post creation
describe('POST /api/forums/posts', () => {
  it('creates a new forum post', async () => {
    const res = await request(app)
      .post('/api/forums/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test Post',
        content: 'Test content',
        categoryId: testCategoryId
      });

    expect(res.status).toBe(201);
    expect(res.body.post.title).toBe('Test Post');
  });

  it('rejects post without title', async () => {
    const res = await request(app)
      .post('/api/forums/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'Test content',
        categoryId: testCategoryId
      });

    expect(res.status).toBe(400);
  });

  it('creates reply with parentId', async () => {
    const res = await request(app)
      .post('/api/forums/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'Reply content',
        parentId: testPostId
      });

    expect(res.status).toBe(201);
    expect(res.body.post.parentId).toBe(testPostId);
  });
});

// Test messaging system
describe('POST /api/messages', () => {
  it('sends message to committee thread', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${committeeLeaderToken}`)
      .send({
        threadId: committeeThreadId,
        content: 'Test message'
      });

    expect(res.status).toBe(201);
    expect(res.body.message.threadId).toBe(committeeThreadId);
  });

  it('rejects message from non-participant', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send({
        threadId: committeeThreadId,
        content: 'Test message'
      });

    expect(res.status).toBe(403);
  });
});

// Test search functionality
describe('GET /api/search', () => {
  it('returns relevant forum posts', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'budget allocation', type: 'posts' })
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0].type).toBe('FORUM_POST');
  });

  it('filters results by permissions', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'committee meeting', type: 'messages' })
      .set('Authorization', `Bearer ${nonMemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });
});
```

### Integration Tests

1. **Complete Forum Flow**
   - User creates forum post
   - Other users reply to post
   - Thread displays with nested replies
   - User edits their post
   - User reports inappropriate post
   - Moderator reviews and removes post

2. **Committee Messaging Flow**
   - Committee leader accesses committee channel
   - Leader sends message
   - All committee members receive message in real-time
   - Member replies to message
   - Member uploads attachment
   - Message search finds content

3. **Admin Broadcast Flow**
   - Admin creates urgent announcement
   - Announcement published to all users
   - Users see pinned announcement
   - Email notifications sent
   - Announcement expires automatically

4. **Real-Time Updates**
   - Multiple users connected to same thread
   - User A sends message
   - User B receives message instantly
   - Typing indicators work correctly
   - Read receipts update properly

### Manual Testing Checklist

- [ ] User can create forum post in all categories
- [ ] Replies display in threaded format
- [ ] Rich text editor formats content correctly
- [ ] File attachments upload and display
- [ ] @mentions send notifications
- [ ] Search returns relevant results
- [ ] Search filters by user permissions
- [ ] Committee members can access their channel
- [ ] Non-members cannot access committee channels
- [ ] Messages deliver in real-time
- [ ] Typing indicators appear correctly
- [ ] Read receipts update properly
- [ ] Admin can create announcements
- [ ] Announcements target correct roles
- [ ] Urgent announcements send emails
- [ ] User can report posts
- [ ] Moderator can review reports
- [ ] Moderator can remove posts
- [ ] Removed posts hidden from view
- [ ] Mobile responsive layout works
- [ ] Keyboard shortcuts functional
- [ ] Accessibility standards met

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated with all models
- [ ] Database migrations tested in staging
- [ ] Seed scripts created for forum categories
- [ ] All API endpoints implemented and tested
- [ ] WebSocket server configured
- [ ] File upload storage configured (S3 or equivalent)
- [ ] Email service configured for notifications
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Performance testing completed
- [ ] Security audit completed

### Deployment Steps

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Forum Categories**
   ```bash
   npx prisma db seed
   ```

3. **Initialize Committee Threads**
   - Run script to create MessageThread for each committee
   - Add committee members as thread participants

4. **Configure WebSocket Server**
   - Set up WebSocket server on hosting platform
   - Configure SSL/TLS for secure connections
   - Set up load balancing if needed

5. **Configure File Storage**
   - Set up S3 bucket or equivalent
   - Configure CORS policies
   - Set up CDN for file delivery

6. **Deploy Application**
   - Build production bundle
   - Deploy to hosting platform
   - Configure environment variables
   - Start WebSocket server

7. **Smoke Tests**
   - Verify forum pages load
   - Test post creation
   - Test real-time messaging
   - Test file uploads
   - Test search functionality

### Post-Deployment

- [ ] All forum categories visible
- [ ] Committee threads accessible
- [ ] Real-time messaging working
- [ ] File uploads successful
- [ ] Search returns results
- [ ] Notifications sending
- [ ] Email notifications working (for urgent announcements)
- [ ] WebSocket connections stable
- [ ] No errors in logs
- [ ] Performance metrics within acceptable range
- [ ] Mobile experience verified
- [ ] Accessibility tested with screen readers

### Monitoring

Set up monitoring for:
- WebSocket connection count and stability
- Message delivery latency
- Search query performance
- File upload success rate
- Database query performance
- Error rates and types
- User engagement metrics (posts, messages, active users)

---

## Future Enhancements

1. **Direct Messaging**
   - One-on-one private messaging between users
   - Group chats (non-committee)
   - Message reactions beyond read receipts

2. **Advanced Moderation**
   - Automated spam detection
   - Content filtering for prohibited words
   - User reputation system
   - Time-limited bans

3. **Enhanced Search**
   - Faceted search with multiple filters
   - Saved searches
   - Search within specific time ranges
   - Tag-based search

4. **Rich Media**
   - GIF support via GIPHY integration
   - Voice messages
   - Video messages
   - Screen recording attachments

5. **Notifications**
   - Push notifications (web and mobile)
   - Digest emails for inactive users
   - Custom notification preferences per category/thread

6. **Integrations**
   - Calendar event creation from messages
   - Task creation from forum posts
   - Integration with video conferencing for committee meetings

7. **Analytics**
   - Forum engagement metrics
   - Most active discussions
   - User participation statistics
   - Committee communication patterns

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
