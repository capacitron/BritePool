# Specification: Lightweight LMS - Course Platform

**Feature ID:** F008
**Priority:** High
**Effort:** Large (2 weeks / 14 days)
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
Implement a lightweight Learning Management System (LMS) that enables committee leaders and administrators to create, publish, and manage educational courses for BRITE POOL stewards. The system supports video lessons, PDF downloads, text content, and quizzes/assessments with progress tracking and completion certificates. This is separate from the equity/Sacred Ledger system and focuses purely on educational content delivery and skill development.

### Key Requirements
- Two-level hierarchical structure: Course → Lessons
- Support for multiple lesson types: Video, PDF, Text, Quiz
- Committee leaders (COMMITTEE_LEADER) and admins can author courses
- Approval workflow for course publishing (DRAFT → REVIEW → PUBLISHED)
- Progress tracking per user per course
- Completion certificates with PDF generation
- Video player integration with progress saving
- PDF viewer integration (in-browser viewing)
- Quiz system with multiple-choice questions and scoring
- Course catalog with search, filtering, and categorization
- Separate from Sacred Ledger equity system (no direct equity rewards)

### Success Metrics
- Course authors can create and publish courses without developer intervention
- All course content types (video, PDF, text, quiz) render correctly
- Progress is tracked automatically for all enrolled users
- Certificates generate successfully upon 100% course completion
- Video lessons support progress resumption (start where you left off)
- Quiz results are stored and can be reviewed by users
- Course catalog loads in under 2 seconds with lazy loading
- Mobile-responsive design for all course components

---

## User Flows

### Flow 1: Committee Leader Creates New Course

```
1. Committee Leader logs in (role: COMMITTEE_LEADER or higher)
2. Leader navigates to /dashboard/courses
3. Leader clicks "Create New Course" button
4. System checks user has COMMITTEE_LEADER, BOARD_CHAIR, or WEB_STEWARD role
5. Leader sees course creation form:
   - Course Title (required)
   - Course Description (rich text, markdown supported)
   - Course Thumbnail (image upload, integrated with Media Gallery)
   - Course Category (dropdown: Leadership, Technical Skills, Health & Wellness,
     Sustainability, Community Building, Financial Literacy, etc.)
   - Estimated Duration (in hours)
   - Prerequisites (optional, select from existing courses)
6. Leader submits form → POST /api/courses
7. Course created with status: DRAFT
8. System generates unique slug from title
9. System redirects to /dashboard/courses/[slug]/edit
10. Leader can now add lessons to the course
```

### Flow 2: Course Author Adds Lessons to Course

```
1. Course author navigates to /dashboard/courses/[slug]/edit
2. Author sees "Lessons" tab with current lesson list (drag-and-drop reorder)
3. Author clicks "Add Lesson" button
4. Modal opens with lesson form:
   - Lesson Title (required)
   - Lesson Description (optional, markdown)
   - Lesson Type (dropdown: VIDEO, PDF, TEXT, QUIZ)
   - Content fields (conditional based on type):

     IF type === VIDEO:
       - Video URL (supports YouTube, Vimeo, or direct MP4 upload to Media Gallery)
       - Video Duration (auto-detected or manual entry in minutes)
       - Thumbnail (auto-generated or custom upload)

     IF type === PDF:
       - PDF File Upload (max 50MB, integrated with Media Gallery)
       - Allow Download (checkbox, default: true)

     IF type === TEXT:
       - Rich Text Editor (markdown with live preview)
       - Estimated Reading Time (auto-calculated or manual)

     IF type === QUIZ:
       - Quiz Builder Interface (see Flow 3)

   - Order Position (auto-incremented, manual override available)

5. Author submits lesson → POST /api/courses/[id]/lessons
6. Lesson created and appears in lesson list
7. Author can add more lessons, reorder via drag-and-drop, or edit existing
8. Author clicks "Preview Course" to see learner view
```

### Flow 3: Course Author Creates Quiz Lesson

```
1. Author selects Lesson Type: QUIZ in lesson form
2. Quiz Builder interface loads:
   - Quiz Title (defaults to lesson title)
   - Quiz Instructions (markdown)
   - Passing Score (percentage, default: 70%)
   - Allow Retakes (checkbox, default: true)
   - Max Attempts (number, 0 = unlimited)

3. Author adds questions:
   - Click "Add Question" button
   - Question Type: MULTIPLE_CHOICE (Phase 1), TRUE_FALSE (Phase 1)
     (Future: MULTIPLE_SELECT, SHORT_ANSWER, ESSAY)
   - Question Text (markdown supported)
   - Question Image (optional, from Media Gallery)
   - Answer Options (minimum 2, maximum 6):
     - Option Text
     - Is Correct (radio button for MULTIPLE_CHOICE)
   - Explanation (optional, shown after answering)
   - Points (default: 1 point per question)

4. Author can reorder questions via drag-and-drop
5. Author clicks "Save Quiz"
6. Quiz data stored in Lesson.content as JSON:
   {
     "instructions": "...",
     "passingScore": 70,
     "allowRetakes": true,
     "maxAttempts": 0,
     "questions": [
       {
         "id": "q1",
         "type": "MULTIPLE_CHOICE",
         "text": "What is the primary purpose of...",
         "image": "https://...",
         "options": [
           { "id": "a", "text": "Option A", "isCorrect": false },
           { "id": "b", "text": "Option B", "isCorrect": true }
         ],
         "explanation": "The correct answer is B because...",
         "points": 1
       }
     ]
   }
```

### Flow 4: Course Author Submits Course for Review

```
1. Author navigates to /dashboard/courses/[slug]/edit
2. Author reviews course completeness:
   - Course has title, description, thumbnail
   - Course has at least 1 lesson
   - All lessons have required content
3. Author clicks "Submit for Review" button
4. System validates course:
   - All lessons have content (no empty lessons)
   - Video URLs are accessible
   - PDF files are uploaded
   - Quiz questions have at least 2 options and 1 correct answer
5. If validation passes:
   - Course status changes: DRAFT → REVIEW
   - POST /api/courses/[id]/status { status: "REVIEW" }
   - Email notification sent to admins/reviewers (WEB_STEWARD, BOARD_CHAIR)
6. If validation fails:
   - Error messages displayed for each issue
   - Author must fix issues before resubmitting
```

### Flow 5: Admin Reviews and Publishes Course

```
1. Admin logs in (role: WEB_STEWARD or BOARD_CHAIR)
2. Admin navigates to /dashboard/admin/courses
3. Admin sees list of courses with status filter (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
4. Admin filters to status: REVIEW
5. Admin clicks on course to review
6. Admin sees full course preview (learner view)
7. Admin can:
   - Test all lessons (videos, PDFs, text, quizzes)
   - Leave feedback/comments for author
   - Request changes (status: REVIEW → DRAFT with comments)
   - Publish course (status: REVIEW → PUBLISHED)
   - Reject course (status: REVIEW → ARCHIVED)

8. If admin clicks "Publish Course":
   - Confirmation modal: "Are you sure? This will make the course visible to all users."
   - Admin confirms
   - POST /api/courses/[id]/publish
   - Course status changes: REVIEW → PUBLISHED
   - isPublished flag set to true
   - publishedAt timestamp recorded
   - Email notification sent to course author
   - Course appears in public course catalog

9. If admin requests changes:
   - Admin enters feedback in modal
   - POST /api/courses/[id]/feedback
   - Course status: REVIEW → DRAFT
   - Email sent to author with feedback
```

### Flow 6: User Enrolls in Course and Starts Learning

```
1. User logs in (any authenticated user)
2. User navigates to /courses (public course catalog)
3. User sees grid of published courses:
   - Course thumbnail
   - Course title
   - Course description (truncated)
   - Course category
   - Estimated duration
   - Lesson count
   - Enrollment status: "Start Course" or "Continue" or "Completed"
4. User can filter courses by:
   - Category
   - Duration range
   - Search by title/description
5. User clicks on course card → /courses/[slug]
6. User sees course detail page:
   - Full description
   - Course outline (list of lessons)
   - Prerequisites (if any)
   - Instructor/Author name
   - Estimated duration
   - "Start Course" or "Continue" button
7. User clicks "Start Course"
8. System checks if user has CourseProgress record:
   - If not, create new CourseProgress record:
     POST /api/courses/[id]/enroll
     { userId, courseId, progress: 0, completedLessons: [], startedAt: now() }
   - If exists, fetch existing progress
9. System redirects to first incomplete lesson: /courses/[slug]/lessons/[lessonOrder]
```

### Flow 7: User Completes Video Lesson

```
1. User navigates to /courses/[slug]/lessons/1 (video lesson)
2. Page loads with:
   - Course header (breadcrumb: Course Title > Lesson Title)
   - Video player (React Player or custom HTML5 player)
   - Lesson title and description
   - "Mark as Complete" button (disabled until video progress > 90%)
   - "Next Lesson" button
   - Lesson navigation sidebar (all lessons with completion checkmarks)

3. Video player features:
   - Standard controls (play/pause, volume, fullscreen, playback speed)
   - Progress bar with chapters (if defined)
   - Auto-save progress every 10 seconds:
     PATCH /api/courses/[courseId]/lessons/[lessonId]/progress
     { userId, lessonId, videoProgress: 45.2 } // seconds watched
   - Resume from last position on page load

4. When video reaches 90% watched:
   - "Mark as Complete" button becomes enabled
   - Toast notification: "You can now mark this lesson as complete"

5. User clicks "Mark as Complete":
   - POST /api/courses/[courseId]/progress
     { userId, courseId, lessonId, action: "complete" }
   - System updates CourseProgress:
     - completedLessons array: add lessonId
     - progress percentage: (completedLessons.length / totalLessons) * 100
   - Green checkmark appears next to lesson in sidebar
   - "Next Lesson" button highlighted

6. User clicks "Next Lesson":
   - System navigates to next lesson in sequence
   - If last lesson completed, show course completion flow (Flow 9)
```

### Flow 8: User Completes Quiz Lesson

```
1. User navigates to /courses/[slug]/lessons/[order] (quiz lesson)
2. Page loads with:
   - Quiz instructions
   - Passing score requirement
   - Attempts remaining (if max attempts set)
   - "Start Quiz" button

3. User clicks "Start Quiz":
   - System creates QuizAttempt record:
     POST /api/courses/[courseId]/lessons/[lessonId]/quiz/start
     { userId, lessonId, startedAt: now(), status: "IN_PROGRESS" }
   - Quiz questions load one at a time (or all at once, configurable)

4. For each question:
   - Question text displayed
   - Answer options shown (radio buttons for MULTIPLE_CHOICE)
   - User selects answer
   - User clicks "Next Question" (or "Submit" for last question)
   - Answer recorded but not validated yet

5. When all questions answered:
   - User clicks "Submit Quiz"
   - Confirmation modal: "Are you sure? You cannot change answers after submission."
   - User confirms

6. Quiz submission:
   - POST /api/courses/[courseId]/lessons/[lessonId]/quiz/submit
     { userId, attemptId, answers: [{ questionId: "q1", answerId: "b" }] }
   - System validates answers against correct answers
   - System calculates score:
     - totalPoints = sum of all question points
     - earnedPoints = sum of correct answer points
     - percentageScore = (earnedPoints / totalPoints) * 100
   - System updates QuizAttempt record:
     - status: "COMPLETED"
     - score: percentageScore
     - passed: (score >= passingScore)
     - completedAt: now()

7. Quiz results page loads:
   - Overall score (percentage and points)
   - Pass/Fail indicator
   - Question-by-question breakdown:
     - Question text
     - User's answer (highlighted green if correct, red if wrong)
     - Correct answer (if user got it wrong)
     - Explanation (if provided)
   - If passed:
     - "Mark as Complete" button enabled
     - Congratulations message
   - If failed:
     - Retry button (if retakes allowed and attempts remaining)
     - Encouragement message

8. If passed, user clicks "Mark as Complete":
   - Lesson marked complete (same as Flow 7, step 5)
   - Progress updated

9. If failed and retakes allowed:
   - User clicks "Retry Quiz"
   - New QuizAttempt created
   - User can retake quiz
```

### Flow 9: User Completes Course and Receives Certificate

```
1. User completes final lesson in course
2. System detects all lessons completed:
   - completedLessons.length === totalLessons.length
3. System updates CourseProgress:
   - isCompleted: true
   - completedAt: now()
   - progress: 100

4. Course completion modal appears:
   - Congratulations message
   - Course completion summary:
     - Course title
     - Completion date
     - Total lessons completed
     - Total quizzes passed
     - Total time spent (if tracked)
   - "Download Certificate" button
   - "View Certificate" button
   - "Continue to Course Catalog" button

5. User clicks "Download Certificate":
   - GET /api/courses/[courseId]/certificate/[userId]
   - System generates PDF certificate:
     - Certificate template with BRITE POOL branding
     - User's name
     - Course title
     - Completion date
     - Unique certificate ID (for verification)
     - Digital signature (optional, using crypto hash)
   - PDF generated using library (react-pdf, jsPDF, or server-side PDFKit)
   - Certificate downloads to user's device

6. User clicks "View Certificate":
   - Certificate displayed in modal or new page
   - Options to print, share, or download

7. Certificate stored in database:
   - Model: CourseCertificate
   - Fields: userId, courseId, certificateId (unique), issuedAt, pdfUrl (stored in cloud storage)

8. User can view all certificates in /dashboard/my-certificates
```

### Flow 10: User Views PDF Lesson

```
1. User navigates to /courses/[slug]/lessons/[order] (PDF lesson)
2. Page loads with:
   - PDF viewer component (using react-pdf or PDF.js)
   - Lesson title and description
   - "Download PDF" button (if allowed by course author)
   - "Mark as Complete" button
   - Page navigation (Previous/Next page)
   - Zoom controls
   - Thumbnail navigation sidebar

3. PDF viewer features:
   - In-browser rendering (no download required)
   - Zoom in/out
   - Fit to page/width
   - Page thumbnails
   - Search within PDF (optional)
   - Print option

4. User views PDF content
5. User clicks "Mark as Complete":
   - Same as Flow 7, step 5
   - Progress updated

6. If "Download PDF" is enabled:
   - User clicks button
   - PDF downloads from Media Gallery URL
```

### Flow 11: Admin Views Course Analytics

```
1. Admin navigates to /dashboard/admin/courses/analytics
2. Admin sees course analytics dashboard:
   - Total courses (by status)
   - Total enrollments
   - Total completions
   - Average completion rate (%)
   - Most popular courses (by enrollments)
   - Courses with lowest completion rates
   - Recent course activity

3. Admin can click on any course to see detailed analytics:
   - Course title and metadata
   - Total enrollments
   - Active learners (started but not completed)
   - Completions
   - Completion rate (%)
   - Average time to completion
   - Lesson-by-lesson completion rates
   - Quiz performance (average scores, pass rates)
   - Enrollment trend chart (over time)

4. Admin can export analytics data to CSV
```

---

## Database Schema

### Existing Models (from Prisma schema)

The following models already exist and will be utilized:

```prisma
model Course {
  id          String   @id @default(cuid())
  title       String
  description String?
  slug        String   @unique
  thumbnail   String?

  createdById String
  createdBy   User     @relation("CoursesCreated", fields: [createdById], references: [id])

  status      CourseStatus @default(DRAFT)
  isPublished Boolean  @default(false)

  lessons     Lesson[]
  progress    CourseProgress[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([isPublished])
}

model Lesson {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  title       String
  description String?
  order       Int      @default(0)
  type        LessonType

  videoUrl    String?
  pdfUrl      String?
  content     String?  // Markdown content for TEXT lessons, JSON for QUIZ lessons

  duration    Int?     // Duration in minutes

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([courseId])
  @@index([order])
}

model CourseProgress {
  id           String   @id @default(cuid())
  userId       String
  courseId     String

  user         User     @relation("CourseProgress", fields: [userId], references: [id], onDelete: Cascade)
  course       Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  completedLessons String[] // Array of lesson IDs
  progress     Float    @default(0) // 0-100 percentage
  isCompleted  Boolean  @default(false)

  startedAt    DateTime @default(now())
  completedAt  DateTime?

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

enum CourseStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED
}

enum LessonType {
  VIDEO
  PDF
  TEXT
  QUIZ
}
```

### New Models Required

Add the following models to the Prisma schema:

```prisma
// Course categories for organization
model CourseCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String?  // Icon name for UI display

  courses     Course[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
}

// Quiz attempts for tracking quiz performance
model QuizAttempt {
  id          String   @id @default(cuid())
  userId      String
  lessonId    String

  user        User     @relation("QuizAttempts", fields: [userId], references: [id], onDelete: Cascade)

  // Quiz data
  answers     Json     // [{ questionId: "q1", answerId: "b" }]
  score       Float    // Percentage score (0-100)
  passed      Boolean  @default(false)

  // Metadata
  status      QuizAttemptStatus @default(IN_PROGRESS)
  attemptNumber Int    // 1, 2, 3, etc.

  startedAt   DateTime @default(now())
  completedAt DateTime?

  @@index([userId])
  @@index([lessonId])
  @@index([userId, lessonId])
}

enum QuizAttemptStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

// Course completion certificates
model CourseCertificate {
  id            String   @id @default(cuid())
  certificateId String   @unique // Unique verification ID
  userId        String
  courseId      String

  user          User     @relation("Certificates", fields: [userId], references: [id], onDelete: Cascade)
  course        Course   @relation(fields: [courseId], references: [id])

  pdfUrl        String?  // URL to generated PDF in cloud storage

  issuedAt      DateTime @default(now())

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
  @@index([certificateId])
}

// Video progress tracking for resumption
model LessonProgress {
  id          String   @id @default(cuid())
  userId      String
  lessonId    String

  user        User     @relation("LessonProgress", fields: [userId], references: [id], onDelete: Cascade)

  // Progress data
  videoProgress Float?  // Seconds watched for video lessons
  lastPosition  Float?  // Last position in video (for resumption)
  isCompleted   Boolean @default(false)

  startedAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  completedAt   DateTime?

  @@unique([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
}

// Course feedback/reviews for quality control
model CourseReview {
  id          String   @id @default(cuid())
  userId      String
  courseId    String

  user        User     @relation("CourseReviews", fields: [userId], references: [id], onDelete: Cascade)
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  rating      Int      // 1-5 stars
  comment     String?

  // Admin review (for unpublished courses)
  isAdminReview Boolean @default(false)
  reviewType    ReviewType?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, courseId])
  @@index([courseId])
  @@index([rating])
}

enum ReviewType {
  APPROVAL     // Admin approving course for publication
  FEEDBACK     // Admin requesting changes
  USER_REVIEW  // User feedback after completion
}
```

### Updates to Existing Models

Update the Course model to include category:

```prisma
model Course {
  // ... existing fields

  categoryId  String?
  category    CourseCategory? @relation(fields: [categoryId], references: [id])

  certificates CourseCertificate[]
  reviews     CourseReview[]

  publishedAt DateTime?  // When course was published

  // Course metadata
  estimatedDuration Int?  // Total duration in minutes
  prerequisiteIds   String[] // Array of course IDs that are prerequisites

  // ... rest of existing fields
}
```

Update the User model to include new relations:

```prisma
model User {
  // ... existing relations

  quizAttempts    QuizAttempt[] @relation("QuizAttempts")
  certificates    CourseCertificate[] @relation("Certificates")
  lessonProgress  LessonProgress[] @relation("LessonProgress")
  courseReviews   CourseReview[] @relation("CourseReviews")
}
```

### Database Migration

Run Prisma migrations:

```bash
npx prisma db push
```

### Seed Data: Initialize Course Categories

```typescript
// prisma/seed.ts
async function seedCourseCategories() {
  const categories = [
    {
      name: 'Leadership & Governance',
      slug: 'leadership-governance',
      description: 'Develop leadership skills and understand governance principles for community stewardship.',
      icon: 'Crown'
    },
    {
      name: 'Technical Skills',
      slug: 'technical-skills',
      description: 'Learn practical technical skills for sanctuary operations and development.',
      icon: 'Wrench'
    },
    {
      name: 'Health & Wellness',
      slug: 'health-wellness',
      description: 'Explore holistic health practices, wellness modalities, and healing arts.',
      icon: 'Heart'
    },
    {
      name: 'Sustainability & Permaculture',
      slug: 'sustainability-permaculture',
      description: 'Master sustainable living practices, permaculture design, and regenerative systems.',
      icon: 'Leaf'
    },
    {
      name: 'Community Building',
      slug: 'community-building',
      description: 'Strengthen community bonds through communication, conflict resolution, and collaboration.',
      icon: 'Users'
    },
    {
      name: 'Financial Literacy',
      slug: 'financial-literacy',
      description: 'Understand personal and communal finance, wealth stewardship, and economic systems.',
      icon: 'DollarSign'
    },
    {
      name: 'Arts & Culture',
      slug: 'arts-culture',
      description: 'Express creativity, preserve culture, and engage with artistic practices.',
      icon: 'Palette'
    },
    {
      name: 'Spiritual Development',
      slug: 'spiritual-development',
      description: 'Deepen spiritual practices, meditation, and inner work for personal transformation.',
      icon: 'Sparkles'
    }
  ];

  for (const category of categories) {
    await prisma.courseCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    });
  }
}
```

---

## API Endpoints

### 1. POST /api/courses

**Purpose:** Create a new course (author only)

**Authentication:** Required, role: COMMITTEE_LEADER, BOARD_CHAIR, or WEB_STEWARD

**Request Body:**
```json
{
  "title": "Introduction to Permaculture Design",
  "description": "Learn the fundamentals of permaculture design principles...",
  "categoryId": "cat_sustainability",
  "thumbnail": "https://media.britepool.com/thumbnails/permaculture.jpg",
  "estimatedDuration": 180,
  "prerequisiteIds": []
}
```

**Response:**
```json
{
  "success": true,
  "course": {
    "id": "crs_123",
    "title": "Introduction to Permaculture Design",
    "slug": "introduction-to-permaculture-design",
    "status": "DRAFT",
    "isPublished": false,
    "createdAt": "2025-12-18T10:00:00Z"
  }
}
```

**Error Cases:**
- User not authorized → 403
- Invalid category → 400
- Duplicate slug → 400

---

### 2. GET /api/courses

**Purpose:** Fetch all courses with filtering

**Authentication:** Optional (public endpoint, but shows different data for authenticated users)

**Query Parameters:**
- `status` (optional): Filter by CourseStatus (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
- `categoryId` (optional): Filter by category
- `search` (optional): Search in title and description
- `myEnrolled` (optional, boolean): Show only courses user is enrolled in
- `myCreated` (optional, boolean): Show only courses user created
- `includeProgress` (optional, boolean): Include user's progress data

**Response:**
```json
{
  "courses": [
    {
      "id": "crs_123",
      "title": "Introduction to Permaculture Design",
      "slug": "introduction-to-permaculture-design",
      "description": "Learn the fundamentals...",
      "thumbnail": "https://...",
      "category": {
        "id": "cat_sus",
        "name": "Sustainability & Permaculture",
        "slug": "sustainability-permaculture"
      },
      "status": "PUBLISHED",
      "isPublished": true,
      "estimatedDuration": 180,
      "lessonCount": 12,
      "createdBy": {
        "id": "usr_456",
        "name": "Jane Doe"
      },
      "publishedAt": "2025-12-10T00:00:00Z",
      "userProgress": {
        "progress": 35,
        "isCompleted": false,
        "startedAt": "2025-12-15T10:00:00Z"
      }
    }
  ],
  "total": 24,
  "page": 1,
  "pageSize": 12
}
```

---

### 3. GET /api/courses/[id]

**Purpose:** Get single course with full details

**Authentication:** Optional (public for PUBLISHED courses)

**Response:**
```json
{
  "course": {
    "id": "crs_123",
    "title": "Introduction to Permaculture Design",
    "slug": "introduction-to-permaculture-design",
    "description": "Full description...",
    "thumbnail": "https://...",
    "category": { "id": "cat_sus", "name": "Sustainability & Permaculture" },
    "status": "PUBLISHED",
    "isPublished": true,
    "estimatedDuration": 180,
    "prerequisiteIds": [],
    "lessons": [
      {
        "id": "lsn_1",
        "title": "What is Permaculture?",
        "description": "Introduction to permaculture principles",
        "order": 0,
        "type": "VIDEO",
        "duration": 15,
        "isCompleted": false
      },
      {
        "id": "lsn_2",
        "title": "Observing Your Land",
        "description": "How to assess your site",
        "order": 1,
        "type": "PDF",
        "duration": 20,
        "isCompleted": false
      }
    ],
    "createdBy": {
      "id": "usr_456",
      "name": "Jane Doe",
      "role": "COMMITTEE_LEADER"
    },
    "publishedAt": "2025-12-10T00:00:00Z",
    "userProgress": {
      "progress": 35,
      "completedLessons": ["lsn_1", "lsn_3"],
      "isCompleted": false,
      "startedAt": "2025-12-15T10:00:00Z"
    }
  }
}
```

**Error Cases:**
- Course not found → 404
- User not authorized to view unpublished course → 403

---

### 4. POST /api/courses/[id]/lessons

**Purpose:** Create a new lesson in a course

**Authentication:** Required, must be course author or admin

**Request Body:**
```json
{
  "title": "What is Permaculture?",
  "description": "Introduction to permaculture principles",
  "type": "VIDEO",
  "order": 0,
  "videoUrl": "https://www.youtube.com/watch?v=abc123",
  "duration": 15
}
```

**Response:**
```json
{
  "success": true,
  "lesson": {
    "id": "lsn_1",
    "title": "What is Permaculture?",
    "courseId": "crs_123",
    "order": 0,
    "type": "VIDEO",
    "videoUrl": "https://www.youtube.com/watch?v=abc123",
    "duration": 15,
    "createdAt": "2025-12-18T11:00:00Z"
  }
}
```

**Error Cases:**
- User not authorized → 403
- Invalid lesson type → 400
- Missing required content for lesson type → 400

---

### 5. PATCH /api/courses/[id]/lessons/[lessonId]

**Purpose:** Update a lesson

**Authentication:** Required, must be course author or admin

**Request Body:** (partial update)
```json
{
  "title": "Introduction to Permaculture",
  "duration": 18
}
```

**Response:**
```json
{
  "success": true,
  "lesson": { /* updated lesson */ }
}
```

---

### 6. DELETE /api/courses/[id]/lessons/[lessonId]

**Purpose:** Delete a lesson from a course

**Authentication:** Required, must be course author or admin

**Response:**
```json
{
  "success": true,
  "message": "Lesson deleted successfully"
}
```

---

### 7. POST /api/courses/[id]/enroll

**Purpose:** Enroll user in a course (create CourseProgress record)

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "progress": {
    "id": "cp_789",
    "userId": "usr_456",
    "courseId": "crs_123",
    "progress": 0,
    "completedLessons": [],
    "startedAt": "2025-12-18T12:00:00Z"
  }
}
```

**Error Cases:**
- Already enrolled → 200 (return existing progress)
- Course not published → 403 (unless admin)

---

### 8. POST /api/courses/[courseId]/progress

**Purpose:** Update course progress (mark lesson complete)

**Authentication:** Required

**Request Body:**
```json
{
  "lessonId": "lsn_1",
  "action": "complete"
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "id": "cp_789",
    "progress": 8.33,
    "completedLessons": ["lsn_1"],
    "isCompleted": false
  }
}
```

---

### 9. PATCH /api/courses/[courseId]/lessons/[lessonId]/progress

**Purpose:** Update lesson progress (video position, etc.)

**Authentication:** Required

**Request Body:**
```json
{
  "videoProgress": 120.5,
  "lastPosition": 120.5
}
```

**Response:**
```json
{
  "success": true,
  "lessonProgress": {
    "id": "lp_123",
    "userId": "usr_456",
    "lessonId": "lsn_1",
    "videoProgress": 120.5,
    "lastPosition": 120.5,
    "updatedAt": "2025-12-18T12:15:00Z"
  }
}
```

---

### 10. POST /api/courses/[courseId]/lessons/[lessonId]/quiz/start

**Purpose:** Start a new quiz attempt

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "attempt": {
    "id": "qa_123",
    "userId": "usr_456",
    "lessonId": "lsn_5",
    "attemptNumber": 1,
    "status": "IN_PROGRESS",
    "startedAt": "2025-12-18T13:00:00Z"
  },
  "quiz": {
    "instructions": "Answer all questions to the best of your ability...",
    "passingScore": 70,
    "allowRetakes": true,
    "maxAttempts": 3,
    "questions": [
      {
        "id": "q1",
        "type": "MULTIPLE_CHOICE",
        "text": "What is the primary principle of permaculture?",
        "options": [
          { "id": "a", "text": "Maximize profits" },
          { "id": "b", "text": "Work with nature" },
          { "id": "c", "text": "Use synthetic fertilizers" },
          { "id": "d", "text": "Monoculture farming" }
        ],
        "points": 1
      }
    ]
  }
}
```

**Note:** Correct answers are NOT sent to client until quiz is submitted.

---

### 11. POST /api/courses/[courseId]/lessons/[lessonId]/quiz/submit

**Purpose:** Submit quiz answers and get results

**Authentication:** Required

**Request Body:**
```json
{
  "attemptId": "qa_123",
  "answers": [
    { "questionId": "q1", "answerId": "b" },
    { "questionId": "q2", "answerId": "true" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "attempt": {
    "id": "qa_123",
    "score": 85.5,
    "passed": true,
    "status": "COMPLETED",
    "completedAt": "2025-12-18T13:20:00Z"
  },
  "results": {
    "totalQuestions": 10,
    "correctAnswers": 9,
    "totalPoints": 10,
    "earnedPoints": 9,
    "percentageScore": 90,
    "passed": true,
    "passingScore": 70,
    "questions": [
      {
        "id": "q1",
        "text": "What is the primary principle of permaculture?",
        "userAnswer": "b",
        "correctAnswer": "b",
        "isCorrect": true,
        "explanation": "Permaculture focuses on working with nature..."
      }
    ]
  }
}
```

---

### 12. GET /api/courses/[courseId]/certificate/[userId]

**Purpose:** Generate and download course completion certificate

**Authentication:** Required, user must have completed course

**Response:** PDF file (Content-Type: application/pdf)

**Error Cases:**
- Course not completed → 403
- User not enrolled → 404

---

### 13. POST /api/courses/[id]/status

**Purpose:** Change course status (DRAFT → REVIEW → PUBLISHED)

**Authentication:** Required, role-based:
- DRAFT → REVIEW: Course author
- REVIEW → PUBLISHED: WEB_STEWARD or BOARD_CHAIR
- REVIEW → DRAFT: WEB_STEWARD or BOARD_CHAIR (with feedback)

**Request Body:**
```json
{
  "status": "REVIEW",
  "feedback": "Optional feedback when requesting changes"
}
```

**Response:**
```json
{
  "success": true,
  "course": {
    "id": "crs_123",
    "status": "REVIEW",
    "updatedAt": "2025-12-18T14:00:00Z"
  }
}
```

---

### 14. POST /api/courses/[id]/publish

**Purpose:** Publish a course (admin only)

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Response:**
```json
{
  "success": true,
  "course": {
    "id": "crs_123",
    "status": "PUBLISHED",
    "isPublished": true,
    "publishedAt": "2025-12-18T14:00:00Z"
  }
}
```

---

### 15. GET /api/courses/categories

**Purpose:** Get all course categories

**Authentication:** Optional

**Response:**
```json
{
  "categories": [
    {
      "id": "cat_sus",
      "name": "Sustainability & Permaculture",
      "slug": "sustainability-permaculture",
      "description": "Master sustainable living practices...",
      "icon": "Leaf",
      "courseCount": 12
    }
  ]
}
```

---

### 16. GET /api/admin/courses/analytics

**Purpose:** Get course analytics dashboard data (admin only)

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Response:**
```json
{
  "overview": {
    "totalCourses": 45,
    "publishedCourses": 32,
    "coursesInReview": 5,
    "draftCourses": 8,
    "totalEnrollments": 1248,
    "totalCompletions": 456,
    "avgCompletionRate": 36.5
  },
  "popularCourses": [
    {
      "id": "crs_123",
      "title": "Introduction to Permaculture Design",
      "enrollments": 145,
      "completions": 67,
      "completionRate": 46.2
    }
  ],
  "recentActivity": [
    {
      "type": "enrollment",
      "courseTitle": "Health & Wellness Basics",
      "userName": "John Doe",
      "timestamp": "2025-12-18T14:30:00Z"
    }
  ]
}
```

---

## UI Components

### 1. Course Catalog Page

**Location:** `app/courses/page.tsx`

**Features:**
- Responsive grid layout of course cards (2-4 columns based on viewport)
- Course card displays: thumbnail, title, category, duration, lesson count, progress (if enrolled)
- Filters sidebar:
  - Category checkboxes
  - Duration range slider
  - Search input
  - "My Courses" toggle
- Sort dropdown: Newest, Popular, Title A-Z
- Pagination or infinite scroll
- Empty state: "No courses found" with CTA to clear filters
- Public access (no authentication required to browse published courses)

**Component Tree:**
```
<CourseCatalogPage>
  <PageHeader title="Course Catalog" />
  <CourseFilters />
  <CourseGrid>
    <CourseCard />
    <CourseCard />
    ...
  </CourseGrid>
  <Pagination />
</CourseCatalogPage>
```

---

### 2. Course Detail Page

**Location:** `app/courses/[slug]/page.tsx`

**Features:**
- Course hero section:
  - Thumbnail image
  - Title and description
  - Category badge
  - Estimated duration
  - Author name and avatar
  - Enrollment CTA: "Start Course" or "Continue" button
- Course outline section:
  - List of all lessons with order, title, type icon, duration
  - Checkmarks for completed lessons (if enrolled)
  - Locked icon for prerequisite courses not completed
- Prerequisites section (if any)
- Reviews/ratings section (optional, future enhancement)
- Mobile-responsive layout

---

### 3. Lesson Viewer Page

**Location:** `app/courses/[slug]/lessons/[order]/page.tsx`

**Features:**
- Breadcrumb navigation: Home > Courses > [Course Title] > [Lesson Title]
- Main content area (conditional based on lesson type):
  - **Video:** Video player component
  - **PDF:** PDF viewer component
  - **Text:** Markdown renderer
  - **Quiz:** Quiz interface component
- Sidebar:
  - Course progress indicator
  - Lesson navigation list
  - "Mark as Complete" button
  - "Next Lesson" button
- Fixed header with course title
- Mobile: sidebar collapses to hamburger menu

---

### 4. Video Player Component

**Location:** `app/components/courses/VideoPlayer.tsx`

**Features:**
- Integration with React Player (supports YouTube, Vimeo, MP4)
- Custom controls overlay:
  - Play/pause button
  - Progress bar with scrubbing
  - Volume control
  - Playback speed (0.5x, 1x, 1.25x, 1.5x, 2x)
  - Fullscreen toggle
  - Picture-in-picture (if supported)
- Auto-save progress every 10 seconds
- Resume from last position on load
- Keyboard shortcuts:
  - Space: play/pause
  - Arrow keys: seek forward/backward
  - F: fullscreen
  - M: mute/unmute
- Loading state with spinner
- Error state with retry button

**Props:**
```typescript
interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  courseId: string;
  lastPosition?: number;
  onProgress: (progress: number) => void;
  onComplete: () => void;
}
```

---

### 5. PDF Viewer Component

**Location:** `app/components/courses/PDFViewer.tsx`

**Features:**
- Integration with react-pdf or PDF.js
- PDF rendering canvas
- Page navigation controls:
  - Previous/Next page buttons
  - Page number input
  - Total pages display
- Zoom controls:
  - Zoom in/out buttons
  - Fit to page
  - Fit to width
  - Zoom percentage dropdown
- Thumbnail sidebar (collapsible)
- Loading progress bar
- Download button (if enabled by author)
- Print button
- Mobile-responsive (touch gestures for zoom/pan)

**Props:**
```typescript
interface PDFViewerProps {
  pdfUrl: string;
  lessonId: string;
  allowDownload: boolean;
  onComplete: () => void;
}
```

---

### 6. Quiz Interface Component

**Location:** `app/components/courses/QuizInterface.tsx`

**Features:**
- Quiz start screen:
  - Instructions
  - Passing score requirement
  - Attempts remaining
  - "Start Quiz" button
- Quiz question screen:
  - Question counter (1 of 10)
  - Progress bar
  - Question text (markdown supported)
  - Question image (if provided)
  - Answer options (radio buttons for MULTIPLE_CHOICE)
  - "Previous" and "Next" buttons
  - "Submit Quiz" button (last question)
- Quiz results screen:
  - Score display (percentage and fraction)
  - Pass/fail indicator with color coding
  - Question-by-question breakdown (expandable):
    - Question text
    - User's answer (highlighted)
    - Correct answer (if wrong)
    - Explanation
  - "Retry Quiz" button (if allowed)
  - "Mark as Complete" button (if passed)
  - "Back to Lesson" button

**Props:**
```typescript
interface QuizInterfaceProps {
  lessonId: string;
  courseId: string;
  quizData: QuizData;
  onComplete: (passed: boolean) => void;
}

interface QuizData {
  instructions: string;
  passingScore: number;
  allowRetakes: boolean;
  maxAttempts: number;
  questions: QuizQuestion[];
}
```

---

### 7. Course Author Dashboard

**Location:** `app/dashboard/courses/page.tsx`

**Features:**
- List of courses created by user
- Course cards with status badges (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
- Quick stats: Enrollments, Completions, Avg. Rating
- Actions: Edit, Preview, Delete
- "Create New Course" button
- Filter by status
- Search by title

---

### 8. Course Editor

**Location:** `app/dashboard/courses/[slug]/edit/page.tsx`

**Features:**
- Tabbed interface:
  - **Overview Tab:** Edit course title, description, thumbnail, category
  - **Lessons Tab:** Add, edit, reorder, delete lessons
  - **Settings Tab:** Prerequisites, estimated duration, visibility
  - **Preview Tab:** View course as learner
- Lesson list with drag-and-drop reordering
- "Add Lesson" button opens modal with lesson type selection
- Lesson modals (conditional forms based on type)
- Save/discard changes confirmation
- "Submit for Review" button (if all validations pass)
- Auto-save draft functionality (debounced)

---

### 9. Lesson Editor Modals

**Location:** `app/components/courses/LessonEditorModal.tsx`

**Features:**
- **Video Lesson Form:**
  - Title and description inputs
  - Video URL input (YouTube, Vimeo, or upload MP4)
  - Thumbnail upload (optional, auto-generate from video)
  - Duration input (auto-detect or manual)
  - Preview video
- **PDF Lesson Form:**
  - Title and description inputs
  - PDF file upload (drag-and-drop or browse)
  - Allow download checkbox
  - Preview PDF
- **Text Lesson Form:**
  - Title and description inputs
  - Markdown editor with live preview
  - Rich text toolbar (bold, italic, lists, links, images)
  - Estimated reading time (auto-calculated)
- **Quiz Lesson Form:**
  - Quiz builder interface:
    - Instructions textarea
    - Passing score input
    - Allow retakes checkbox
    - Max attempts input
    - Question list with drag-and-drop reorder
    - "Add Question" button
    - Question editor (expandable):
      - Question text
      - Question image upload (optional)
      - Question type dropdown
      - Answer options (add/remove)
      - Correct answer radio buttons
      - Explanation textarea
      - Points input
- Validation errors displayed inline
- Save button (disabled until valid)
- Cancel button

---

### 10. Certificate Viewer Component

**Location:** `app/components/courses/CertificateViewer.tsx`

**Features:**
- Certificate template display:
  - BRITE POOL logo/branding
  - "Certificate of Completion" heading
  - User's name (large, prominent)
  - "has successfully completed" text
  - Course title
  - Completion date
  - Certificate ID (for verification)
  - Digital signature or seal
- Actions:
  - Download PDF button
  - Print button
  - Share button (copy link, social media)
- Responsive design (print stylesheet for A4/Letter size)
- Certificate verification link: `/verify-certificate/[certificateId]`

**Props:**
```typescript
interface CertificateViewerProps {
  certificate: {
    certificateId: string;
    userId: string;
    userName: string;
    courseTitle: string;
    completedAt: Date;
    pdfUrl?: string;
  };
  onDownload: () => void;
}
```

---

### 11. Admin Course Review Page

**Location:** `app/dashboard/admin/courses/review/page.tsx`

**Features:**
- List of courses with status: REVIEW
- Course cards with:
  - Thumbnail
  - Title and author
  - Submitted date
  - "Review" button
- Review modal:
  - Full course preview (iframe or embedded)
  - Feedback textarea
  - Actions:
    - Approve (publish course)
    - Request Changes (send back to DRAFT with feedback)
    - Reject (archive course)
- Activity log: Recent course reviews

---

### 12. Course Analytics Dashboard

**Location:** `app/dashboard/admin/courses/analytics/page.tsx`

**Features:**
- Overview metrics cards:
  - Total Courses (with status breakdown)
  - Total Enrollments
  - Total Completions
  - Avg. Completion Rate
- Charts:
  - Enrollments over time (line chart)
  - Completions by category (bar chart)
  - Completion rate by course (horizontal bar chart)
- Popular courses table:
  - Course title
  - Enrollments
  - Completions
  - Completion rate
  - Avg. quiz scores
- Recent activity feed
- Export to CSV button

---

## Implementation Details

### Phase 1: Database Schema & Core API (Days 1-3)

#### Day 1: Database Setup
1. Update Prisma schema with new models:
   - CourseCategory
   - QuizAttempt
   - CourseCertificate
   - LessonProgress
   - CourseReview
2. Update existing models (Course, User) with new relations
3. Run database migrations: `npx prisma db push`
4. Create seed script for course categories
5. Test database schema with Prisma Studio

#### Day 2: Course & Lesson APIs
1. Implement course CRUD endpoints:
   - POST /api/courses (create)
   - GET /api/courses (list with filters)
   - GET /api/courses/[id] (get single)
   - PATCH /api/courses/[id] (update)
   - DELETE /api/courses/[id] (soft delete)
2. Implement lesson CRUD endpoints:
   - POST /api/courses/[id]/lessons (create)
   - PATCH /api/courses/[id]/lessons/[lessonId] (update)
   - DELETE /api/courses/[id]/lessons/[lessonId] (delete)
3. Add permission checks (role-based authorization)
4. Add validation using Zod schemas
5. Test all endpoints with Postman or similar

#### Day 3: Progress & Quiz APIs
1. Implement progress tracking endpoints:
   - POST /api/courses/[id]/enroll (enroll user)
   - POST /api/courses/[courseId]/progress (mark lesson complete)
   - PATCH /api/courses/[courseId]/lessons/[lessonId]/progress (update video progress)
2. Implement quiz endpoints:
   - POST /api/courses/[courseId]/lessons/[lessonId]/quiz/start (start attempt)
   - POST /api/courses/[courseId]/lessons/[lessonId]/quiz/submit (submit answers)
   - GET /api/courses/[courseId]/lessons/[lessonId]/quiz/attempts (get user attempts)
3. Implement quiz validation and scoring logic
4. Test quiz flow end-to-end

---

### Phase 2: Course Catalog & Viewer (Days 4-6)

#### Day 4: Course Catalog UI
1. Create course catalog page (`app/courses/page.tsx`)
2. Implement CourseCard component
3. Implement CourseFilters component (category, search, duration)
4. Add responsive grid layout (Tailwind CSS)
5. Integrate with GET /api/courses endpoint
6. Add loading states and empty states
7. Test on mobile and desktop

#### Day 5: Course Detail Page
1. Create course detail page (`app/courses/[slug]/page.tsx`)
2. Display course hero section (thumbnail, title, description, CTA)
3. Display course outline (lesson list with icons and checkmarks)
4. Implement enrollment logic (POST /api/courses/[id]/enroll)
5. Add progress indicator for enrolled users
6. Test enrollment and navigation flow

#### Day 6: Lesson Viewer Page
1. Create lesson viewer page (`app/courses/[slug]/lessons/[order]/page.tsx`)
2. Implement lesson type detection and conditional rendering
3. Add lesson navigation sidebar (all lessons with completion status)
4. Implement "Mark as Complete" button
5. Implement "Next Lesson" navigation
6. Add breadcrumb navigation
7. Test lesson navigation and completion flow

---

### Phase 3: Video, PDF, and Text Lessons (Days 7-9)

#### Day 7: Video Player Component
1. Install React Player: `npm install react-player`
2. Create VideoPlayer component (`app/components/courses/VideoPlayer.tsx`)
3. Integrate React Player with YouTube, Vimeo, MP4 support
4. Add custom controls overlay (play/pause, progress bar, volume, speed)
5. Implement auto-save progress (debounced every 10 seconds)
6. Implement resume from last position
7. Add keyboard shortcuts
8. Test with different video sources

#### Day 8: PDF Viewer Component
1. Install react-pdf: `npm install react-pdf`
2. Create PDFViewer component (`app/components/courses/PDFViewer.tsx`)
3. Implement PDF rendering with page navigation
4. Add zoom controls (zoom in/out, fit to page/width)
5. Add thumbnail sidebar (collapsible)
6. Implement download and print functionality
7. Test with various PDF files

#### Day 9: Text Lesson Renderer
1. Create TextLesson component (`app/components/courses/TextLesson.tsx`)
2. Install markdown renderer: `npm install react-markdown`
3. Render markdown content with syntax highlighting (if code blocks)
4. Style markdown elements (headings, lists, blockquotes, images)
5. Add estimated reading time display
6. Test with various markdown content

---

### Phase 4: Quiz System (Days 10-11)

#### Day 10: Quiz Interface UI
1. Create QuizInterface component (`app/components/courses/QuizInterface.tsx`)
2. Implement quiz start screen (instructions, passing score, attempts)
3. Implement question navigation (previous/next, progress bar)
4. Implement MULTIPLE_CHOICE question rendering (radio buttons)
5. Implement TRUE_FALSE question rendering
6. Add question counter and progress indicator
7. Implement "Submit Quiz" confirmation modal
8. Test quiz navigation and UI

#### Day 11: Quiz Submission & Results
1. Integrate quiz submission with API (POST /api/courses/[courseId]/lessons/[lessonId]/quiz/submit)
2. Implement quiz results screen:
   - Score display
   - Pass/fail indicator
   - Question-by-question breakdown
   - Retry button (if allowed)
3. Handle quiz attempts and retake logic
4. Store quiz results in QuizAttempt model
5. Test quiz scoring and retake scenarios

---

### Phase 5: Course Authoring (Days 12-13)

#### Day 12: Course Editor UI
1. Create course editor page (`app/dashboard/courses/[slug]/edit/page.tsx`)
2. Implement tabbed interface (Overview, Lessons, Settings, Preview)
3. Implement Overview tab:
   - Course title, description, thumbnail, category form
   - Auto-save draft functionality (debounced)
4. Implement Lessons tab:
   - Lesson list with drag-and-drop reordering (using @dnd-kit/sortable)
   - "Add Lesson" button
   - Edit/Delete lesson actions
5. Test course creation and editing flow

#### Day 13: Lesson Editor Modals
1. Create LessonEditorModal component (`app/components/courses/LessonEditorModal.tsx`)
2. Implement video lesson form (URL input, thumbnail upload, duration)
3. Implement PDF lesson form (file upload, allow download checkbox)
4. Implement text lesson form (markdown editor with preview)
5. Implement quiz lesson form (quiz builder):
   - Add/remove questions
   - Question editor (text, options, correct answer, explanation)
   - Drag-and-drop question reordering
6. Add validation for all lesson forms
7. Test lesson creation and editing for all types

---

### Phase 6: Approval Workflow & Certificates (Day 14)

#### Day 14: Approval Workflow
1. Implement course status endpoints:
   - POST /api/courses/[id]/status (change status)
   - POST /api/courses/[id]/publish (publish course)
2. Create admin course review page (`app/dashboard/admin/courses/review/page.tsx`)
3. Implement review modal (approve, request changes, reject)
4. Add email notifications for status changes (optional, use Resend or similar)
5. Test approval workflow (DRAFT → REVIEW → PUBLISHED)

#### Day 14: Certificate Generation
1. Install certificate generation library: `npm install jspdf` or `npm install @react-pdf/renderer`
2. Create certificate template component
3. Implement GET /api/courses/[courseId]/certificate/[userId] endpoint:
   - Generate PDF certificate with user name, course title, completion date, certificate ID
   - Upload PDF to Media Gallery storage (S3)
   - Create CourseCertificate record
   - Return PDF file
4. Create CertificateViewer component
5. Add certificate download button to course completion modal
6. Add "My Certificates" page (`app/dashboard/my-certificates/page.tsx`)
7. Test certificate generation and download

---

## Testing Requirements

### Unit Tests

#### API Endpoints
- Course CRUD operations (create, read, update, delete)
- Lesson CRUD operations
- Enrollment and progress tracking
- Quiz submission and scoring logic
- Certificate generation

#### Components
- CourseCard renders correctly
- VideoPlayer saves progress
- PDFViewer displays PDF
- QuizInterface handles user input
- CertificateViewer displays certificate

---

### Integration Tests

#### User Flows
- User browses course catalog and enrolls in course
- User completes video lesson and marks as complete
- User completes PDF lesson
- User takes quiz, passes, and moves to next lesson
- User completes all lessons and receives certificate
- Course author creates course, adds lessons, submits for review
- Admin reviews and publishes course

---

### Manual Testing Checklist

#### Course Catalog
- [ ] Course catalog page loads without errors
- [ ] All published courses displayed
- [ ] Filters work correctly (category, search, duration)
- [ ] Course cards display correct information
- [ ] Enrollment button works for unenrolled courses
- [ ] "Continue" button works for enrolled courses

#### Course Viewing
- [ ] Course detail page loads with all lessons
- [ ] Lesson navigation works
- [ ] Video lessons play correctly
- [ ] PDF lessons display correctly
- [ ] Text lessons render markdown correctly
- [ ] Quiz lessons load and submit correctly

#### Progress Tracking
- [ ] Lesson completion is tracked correctly
- [ ] Course progress percentage updates
- [ ] Completed lessons show checkmarks
- [ ] Video progress saves and resumes
- [ ] Quiz results are stored

#### Quiz System
- [ ] Quiz start screen displays correctly
- [ ] Questions display with options
- [ ] User can navigate between questions
- [ ] Quiz submission validates all questions answered
- [ ] Quiz results show correct score
- [ ] Retry button works (if allowed)
- [ ] Passed quiz enables lesson completion

#### Certificate Generation
- [ ] Certificate generates upon course completion
- [ ] Certificate includes all required information
- [ ] Certificate downloads as PDF
- [ ] Certificate ID is unique
- [ ] "My Certificates" page displays all certificates

#### Course Authoring
- [ ] Course editor loads without errors
- [ ] Course creation form validates inputs
- [ ] Lessons can be added for all types
- [ ] Lesson editor modals work correctly
- [ ] Drag-and-drop reordering works
- [ ] Course can be submitted for review
- [ ] Draft auto-save works

#### Approval Workflow
- [ ] Admin can view courses in review
- [ ] Admin can preview course
- [ ] Admin can approve and publish course
- [ ] Admin can request changes
- [ ] Course author receives notifications

#### Permissions
- [ ] Only authorized users can create courses
- [ ] Only course author/admin can edit courses
- [ ] Only admin can publish courses
- [ ] Unpublished courses not visible to regular users

#### Mobile Responsiveness
- [ ] Course catalog responsive on mobile
- [ ] Course detail page responsive
- [ ] Lesson viewer responsive
- [ ] Video player works on mobile
- [ ] PDF viewer works on mobile
- [ ] Quiz interface works on mobile

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated and tested
- [ ] Database migrations created
- [ ] All API endpoints implemented and tested
- [ ] All UI components implemented and tested
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed
- [ ] Course categories seeded
- [ ] Environment variables configured (cloud storage, etc.)
- [ ] Build completes without errors
- [ ] No console errors in development

---

### Deployment Steps

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Course Categories**
   ```bash
   npx prisma db seed
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Deploy to Hosting Platform**
   - Vercel: `vercel --prod`
   - Or push to main branch (if auto-deployment configured)

5. **Smoke Tests**
   - Browse course catalog
   - Enroll in test course
   - Complete test lesson
   - Create test course (as admin)
   - Publish test course

---

### Post-Deployment

- [ ] Course catalog page loads in production
- [ ] All published courses visible
- [ ] Users can enroll in courses
- [ ] Lesson viewing works (video, PDF, text, quiz)
- [ ] Progress tracking works
- [ ] Certificates generate correctly
- [ ] Course authoring works
- [ ] Approval workflow works
- [ ] Monitor error logs for 24 hours
- [ ] Collect user feedback
- [ ] Address any critical bugs immediately

---

## Future Enhancements (Post-MVP)

### Phase 2 Features
- Course ratings and reviews (user feedback)
- Course completion badges (display on user profile)
- Discussion forums per course (Q&A)
- Live webinar integration (Zoom, Google Meet)
- Course certificates with QR codes (for mobile verification)
- Course prerequisites enforcement (block enrollment if prerequisites not met)
- Course bundles (learning paths)
- Course recommendations (based on user interests and completed courses)

### Phase 3 Features
- Advanced quiz types (MULTIPLE_SELECT, SHORT_ANSWER, ESSAY)
- Quiz time limits
- Randomized quiz questions (different order per attempt)
- Question banks (reusable question library)
- Course analytics for authors (completion rates, quiz performance)
- Gamification (points, leaderboards, achievements)
- Integration with Sacred Ledger (optional equity rewards for course completion)
- Course assignments (submit files, peer review)
- Instructor feedback on assignments

### Phase 4 Features
- Multi-language support
- Accessibility improvements (WCAG 2.1 AA compliance)
- Offline viewing (download lessons for offline access)
- Mobile app (React Native)
- Push notifications (course reminders, new content)
- Course calendar (schedule lessons)
- Study groups (cohort-based learning)

---

**Spec Complete**

**Next Step:** Run `/create-tasks` to generate implementation task list for 2-week sprint.
