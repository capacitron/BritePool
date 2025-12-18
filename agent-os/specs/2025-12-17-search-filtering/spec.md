# Specification: Search & Filtering System

**Feature ID:** F027
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** Authentication (F002), Events Calendar (F009), Forums (F004), LMS Courses (F007), Committee Management (F013)
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
Implement a powerful, permission-aware global search and filtering system that enables members to quickly discover and access courses, events, forum discussions, documents, members, and other content across the platform. The search system respects role-based permissions, ensuring users only see content they have access to, and provides instant typeahead results for rapid discovery.

### Key Requirements
- Global search across all major content types (courses, events, forums, documents, members, tasks)
- Permission-based filtering (users only see content they're authorized to access)
- Instant typeahead/autocomplete results as users type
- Advanced filtering by date range, category, content type, project, status
- Search history tracking for individual users
- Saved searches functionality for frequently used queries
- Full-text search powered by PostgreSQL full-text search (with optional Algolia integration)
- Search analytics and reporting for administrators
- Mobile-responsive search interface

### Success Metrics
- Search results return in under 200ms for typical queries
- 100% permission compliance (no unauthorized content shown)
- Users can find relevant content within 3 keystrokes (typeahead)
- Search usage analytics tracked for optimization
- Zero security breaches through search (proper permission filtering)
- Saved searches reduce repetitive query time by 50%

---

## User Flows

### Flow 1: Global Search with Instant Results

```
1. User logs in and navigates to any page
2. User clicks on search bar in top navigation (or presses CMD+K / CTRL+K)
3. Search modal opens with focus on input field
4. User types first characters (e.g., "heal")
5. After 300ms debounce, GET /api/search?q=heal&instant=true
6. System performs permission-filtered search across all content types
7. Instant results appear grouped by type:
   - Courses (2 results)
   - Events (1 result)
   - Forum Posts (3 results)
   - Members (1 result)
8. User continues typing "healing workshop"
9. Results update in real-time
10. User sees highlighted matches in results
11. User can:
    - Click result to navigate directly
    - Press Enter to see full search results page
    - Use arrow keys to navigate results
    - Press Escape to close modal
12. Search query saved to user's search history
```

### Flow 2: Advanced Filtering on Search Results Page

```
1. User performs global search for "sanctuary"
2. User presses Enter or clicks "See all results"
3. Redirected to /search?q=sanctuary
4. Full search results page displays:
   - Search input with current query
   - Results count (e.g., "42 results for 'sanctuary'")
   - Results grouped by content type
   - Left sidebar with advanced filters
5. User applies filters:
   - Content Type: Select "Events" checkbox
   - Date Range: Select "Next 30 days"
   - Category: Select "SANCTUARY_EVENT"
   - Status: Select "Published"
6. Each filter selection triggers:
   GET /api/search?q=sanctuary&type=events&dateFrom=2025-12-18&dateTo=2026-01-18&category=SANCTUARY_EVENT&status=published
7. Results update without page reload
8. User sees "12 results" (filtered from 42)
9. User clicks "Save Search" button
10. Modal opens: "Save this search?"
    - Name: "Upcoming Sanctuary Events"
    - Make Default: Checkbox
11. POST /api/search/saved with query parameters
12. Search saved to user's profile
13. User can access saved search from search dropdown
```

### Flow 3: Using Saved Searches

```
1. User clicks search bar in navigation
2. Search modal opens showing:
   - Search input field
   - "Recent Searches" section (last 5 searches)
   - "Saved Searches" section (user's saved searches)
3. User sees saved searches:
   - "Upcoming Sanctuary Events" (3 new results)
   - "Education Board Discussions" (12 new results)
   - "My Committee Tasks" (5 new results)
4. User clicks "Upcoming Sanctuary Events"
5. System executes saved search query
6. Redirected to /search with saved filters applied
7. Results show only events matching saved criteria
8. Badge shows "3 new results since last view"
```

### Flow 4: Permission-Filtered Search Results

```
1. Basic Member (role: STEWARD) searches for "governance"
2. GET /api/search?q=governance
3. Server-side permission filtering:
   - Checks user role and committee memberships
   - Filters out:
     * Private committee discussions user isn't member of
     * Unpublished courses
     * Internal admin documents
     * Private events
4. Results show only:
   - Public forum posts about governance
   - Published governance-related courses
   - Public governance events
5. Committee Leader (on Governance Board) performs same search
6. Server applies different permissions:
   - Includes Governance Board private discussions
   - Shows committee-specific documents
   - Includes committee meeting events
7. Results include restricted content the leader has access to
8. Each result shows permission indicator:
   - Public icon (globe)
   - Committee-only icon (lock with committee name)
   - Members-only icon (users)
```

### Flow 5: Search Analytics (Admin View)

```
1. Admin logs in with WEB_STEWARD role
2. Admin navigates to /dashboard/admin/analytics/search
3. Admin sees search analytics dashboard:
   - Total searches (last 30 days)
   - Most searched terms (top 20)
   - Zero-result searches (optimization candidates)
   - Average search response time
   - Searches by content type breakdown
   - Saved searches count
4. Admin can filter analytics by:
   - Date range
   - User role
   - Content type
   - Search success rate
5. Admin clicks on "Zero-result searches"
6. Sees list of queries that returned no results:
   - "herbal medicine workshop" (0 results, 8 searches)
   - "solar panel installation" (0 results, 5 searches)
7. Admin identifies content gaps
8. Admin can export analytics as CSV
9. POST /api/admin/search/analytics/export
```

---

## Database Schema

### New Model: SearchQuery (Search History & Analytics)

```prisma
model SearchQuery {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation("SearchQueries", fields: [userId], references: [id], onDelete: Cascade)

  query       String   // The search term
  filters     Json?    // Applied filters as JSON
  resultsCount Int     @default(0)
  responseTime Int?    // Response time in milliseconds
  clickedResult String? // ID of result user clicked (for analytics)

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([query])
  @@index([createdAt])
}

model SavedSearch {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation("SavedSearches", fields: [userId], references: [id], onDelete: Cascade)

  name        String
  query       String
  filters     Json?    // Saved filter configuration
  isDefault   Boolean  @default(false)

  lastUsedAt  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([lastUsedAt])
}
```

### Update User Model

```prisma
model User {
  // ... existing fields

  // Search Relations
  searchQueries SearchQuery[] @relation("SearchQueries")
  savedSearches SavedSearch[] @relation("SavedSearches")
}
```

### Full-Text Search Indexes (PostgreSQL)

Add full-text search indexes to existing models:

```sql
-- Courses full-text search
CREATE INDEX idx_courses_fts ON "Course" USING GIN (
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '')
  )
);

-- Events full-text search
CREATE INDEX idx_events_fts ON "Event" USING GIN (
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(location, '')
  )
);

-- Forum posts full-text search
CREATE INDEX idx_forum_posts_fts ON "ForumPost" USING GIN (
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(content, '')
  )
);

-- Users full-text search (name only, email excluded for privacy)
CREATE INDEX idx_users_fts ON "User" USING GIN (
  to_tsvector('english', COALESCE(name, ''))
);

-- Tasks full-text search
CREATE INDEX idx_tasks_fts ON "Task" USING GIN (
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '')
  )
);

-- Announcements full-text search
CREATE INDEX idx_announcements_fts ON "Announcement" USING GIN (
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(content, '')
  )
);
```

---

## API Endpoints

### 1. GET /api/search

**Purpose:** Global search with permission filtering

**Authentication:** Required

**Query Parameters:**
- `q` (required): Search query string
- `instant` (optional, boolean): If true, return limited instant results
- `type` (optional): Filter by content type (courses, events, forum, users, tasks, announcements)
- `dateFrom` (optional): Filter by date range start (ISO 8601)
- `dateTo` (optional): Filter by date range end (ISO 8601)
- `category` (optional): Filter by category (course type, event type, etc.)
- `status` (optional): Filter by status (published, draft, etc.)
- `committeeId` (optional): Filter by committee
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Logic:**
1. Validate user authentication
2. Parse and sanitize query string
3. Build PostgreSQL full-text search query with filters
4. Apply permission filtering based on user role and memberships:
   - Public content: All users can see
   - Committee content: Only committee members
   - Draft/unpublished: Only creators and admins
5. Execute parallel searches across all enabled content types
6. Rank results by relevance (ts_rank)
7. Track search query in SearchQuery table
8. Return grouped results

**Response (instant=true):**
```json
{
  "query": "healing",
  "totalResults": 12,
  "groups": [
    {
      "type": "courses",
      "label": "Courses",
      "count": 3,
      "results": [
        {
          "id": "course_123",
          "type": "course",
          "title": "Healing Modalities Workshop",
          "description": "Learn about various healing practices...",
          "url": "/dashboard/courses/healing-modalities",
          "thumbnail": "https://...",
          "metadata": {
            "status": "published",
            "lessons": 12
          },
          "highlight": "<mark>Healing</mark> Modalities Workshop",
          "permission": "public"
        }
      ]
    },
    {
      "type": "events",
      "label": "Events",
      "count": 2,
      "results": [
        {
          "id": "event_456",
          "type": "event",
          "title": "Community Healing Circle",
          "description": "Monthly gathering for...",
          "url": "/dashboard/events/community-healing-circle",
          "metadata": {
            "startTime": "2025-12-25T18:00:00Z",
            "location": "Sanctuary Garden"
          },
          "highlight": "Community <mark>Healing</mark> Circle",
          "permission": "public"
        }
      ]
    }
  ],
  "searchId": "sq_789"
}
```

**Response (full search):**
```json
{
  "query": "healing",
  "totalResults": 47,
  "filters": {
    "type": null,
    "dateFrom": null,
    "dateTo": null,
    "category": null,
    "status": null
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  },
  "groups": [
    {
      "type": "courses",
      "label": "Courses",
      "count": 15,
      "results": [/* ... */]
    },
    {
      "type": "events",
      "label": "Events",
      "count": 8,
      "results": [/* ... */]
    },
    {
      "type": "forum",
      "label": "Discussions",
      "count": 18,
      "results": [/* ... */]
    },
    {
      "type": "members",
      "label": "Members",
      "count": 6,
      "results": [/* ... */]
    }
  ],
  "responseTime": 145,
  "searchId": "sq_790"
}
```

**Error Cases:**
- User not authenticated → 401
- Query string empty or invalid → 400
- Server error during search → 500

---

### 2. POST /api/search/saved

**Purpose:** Save a search query for later use

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Upcoming Sanctuary Events",
  "query": "sanctuary",
  "filters": {
    "type": "events",
    "dateFrom": "2025-12-18",
    "dateTo": "2026-01-18",
    "category": "SANCTUARY_EVENT",
    "status": "published"
  },
  "isDefault": false
}
```

**Logic:**
1. Validate user authentication
2. Validate search name and query
3. Check user doesn't exceed max saved searches (e.g., 10)
4. If isDefault=true, set all other user's saved searches to isDefault=false
5. Create SavedSearch record
6. Return created record

**Response:**
```json
{
  "success": true,
  "savedSearch": {
    "id": "ss_123",
    "name": "Upcoming Sanctuary Events",
    "query": "sanctuary",
    "filters": { /* ... */ },
    "isDefault": false,
    "createdAt": "2025-12-18T10:00:00Z"
  }
}
```

**Error Cases:**
- User not authenticated → 401
- Invalid name or query → 400
- Max saved searches exceeded → 400

---

### 3. GET /api/search/saved

**Purpose:** Get user's saved searches

**Authentication:** Required

**Response:**
```json
{
  "savedSearches": [
    {
      "id": "ss_123",
      "name": "Upcoming Sanctuary Events",
      "query": "sanctuary",
      "filters": { /* ... */ },
      "isDefault": false,
      "lastUsedAt": "2025-12-17T14:30:00Z",
      "newResultsCount": 3
    }
  ]
}
```

---

### 4. DELETE /api/search/saved/[id]

**Purpose:** Delete a saved search

**Authentication:** Required (must be owner of saved search)

**Response:**
```json
{
  "success": true,
  "deletedId": "ss_123"
}
```

---

### 5. GET /api/search/history

**Purpose:** Get user's recent search history

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of recent searches to return (default: 10, max: 50)

**Response:**
```json
{
  "history": [
    {
      "id": "sq_789",
      "query": "healing",
      "filters": null,
      "resultsCount": 47,
      "createdAt": "2025-12-18T09:30:00Z"
    },
    {
      "id": "sq_788",
      "query": "governance board",
      "filters": { "type": "forum" },
      "resultsCount": 12,
      "createdAt": "2025-12-17T15:20:00Z"
    }
  ]
}
```

---

### 6. POST /api/search/track-click

**Purpose:** Track when user clicks on a search result (for analytics)

**Authentication:** Required

**Request Body:**
```json
{
  "searchId": "sq_789",
  "resultId": "course_123",
  "resultType": "course",
  "position": 1
}
```

**Logic:**
1. Update SearchQuery record with clicked result
2. Increment click-through analytics
3. Return success

**Response:**
```json
{
  "success": true
}
```

---

### 7. GET /api/admin/search/analytics (Admin Only)

**Purpose:** Get search analytics and reporting

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Query Parameters:**
- `dateFrom` (optional): Start date for analytics range
- `dateTo` (optional): End date for analytics range
- `groupBy` (optional): Group results by day, week, or month

**Response:**
```json
{
  "summary": {
    "totalSearches": 1247,
    "uniqueUsers": 89,
    "avgResponseTime": 156,
    "avgResultsCount": 12.3,
    "zeroResultSearches": 34
  },
  "topQueries": [
    { "query": "healing", "count": 87, "avgResults": 42 },
    { "query": "governance", "count": 56, "avgResults": 18 },
    { "query": "workshop", "count": 45, "avgResults": 28 }
  ],
  "zeroResultQueries": [
    { "query": "herbal medicine workshop", "count": 8 },
    { "query": "solar panel installation", "count": 5 }
  ],
  "searchesByType": {
    "courses": 412,
    "events": 298,
    "forum": 356,
    "members": 123,
    "tasks": 58
  },
  "savedSearches": {
    "total": 156,
    "avgPerUser": 1.75
  }
}
```

---

### 8. POST /api/admin/search/reindex (Admin Only)

**Purpose:** Trigger full-text search index rebuild

**Authentication:** Required, role: WEB_STEWARD

**Logic:**
1. Queue background job to rebuild all full-text search indexes
2. Return job ID for tracking

**Response:**
```json
{
  "success": true,
  "jobId": "reindex_job_123",
  "message": "Search index rebuild queued"
}
```

---

## UI Components

### 1. Global Search Bar Component

**Location:** `app/components/search/GlobalSearchBar.tsx`

**Features:**
- Always visible in top navigation
- Keyboard shortcut (CMD+K / CTRL+K) to focus
- Placeholder text: "Search courses, events, discussions..."
- Search icon (magnifying glass)
- Click opens search modal

**Component Structure:**
```tsx
export function GlobalSearchBar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="search-bar-button"
      >
        <SearchIcon />
        <span>Search...</span>
        <kbd>⌘K</kbd>
      </button>

      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

---

### 2. Search Modal Component (Instant Search)

**Location:** `app/components/search/SearchModal.tsx`

**Features:**
- Full-screen modal overlay
- Search input with autofocus
- Debounced instant search (300ms)
- Grouped results by content type
- Keyboard navigation (arrow keys, enter, escape)
- Loading state while searching
- Empty state for no results
- Recent searches display
- Saved searches display

**Component Structure:**
```tsx
export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) return;

    setIsLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&instant=true`);
    const data = await res.json();
    setResults(data);
    setIsLoading(false);
  }, 300);

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    }
  }, [query]);

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="search-modal">
        <div className="search-input-container">
          <SearchIcon />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            autoFocus
          />
          {isLoading && <Spinner />}
        </div>

        {!query && <RecentAndSavedSearches />}

        {query && results && (
          <SearchResultsGrouped results={results} onClose={onClose} />
        )}

        {query && !isLoading && results?.totalResults === 0 && (
          <EmptyState query={query} />
        )}

        <div className="search-footer">
          <kbd>↑↓</kbd> Navigate
          <kbd>Enter</kbd> Select
          <kbd>Esc</kbd> Close
        </div>
      </div>
    </Dialog>
  );
}
```

---

### 3. Search Results Page

**Location:** `app/search/page.tsx`

**Features:**
- Full search results with pagination
- Advanced filters sidebar
- Results grouped by content type
- Filter pills showing active filters
- Sort options (relevance, date, name)
- Save search button
- Export results button (for admins)

**URL Pattern:** `/search?q=healing&type=events&dateFrom=2025-12-18`

---

### 4. Advanced Filters Sidebar

**Location:** `app/components/search/AdvancedFilters.tsx`

**Features:**
- Content type multi-select (courses, events, forum, etc.)
- Date range picker
- Category dropdown (varies by content type)
- Status filter (published, draft, etc.)
- Committee filter (if user is member of committees)
- Clear all filters button
- Active filter count badge

---

### 5. Saved Searches Manager

**Location:** `app/dashboard/settings/saved-searches/page.tsx`

**Features:**
- List of all saved searches
- Edit saved search (rename, update filters)
- Delete saved search
- Set default search
- New results badge
- Execute saved search button

---

### 6. Search Analytics Dashboard (Admin)

**Location:** `app/dashboard/admin/analytics/search/page.tsx`

**Features:**
- Total searches metric card
- Top queries table
- Zero-result queries alert list
- Search performance chart (response time)
- Searches by content type pie chart
- Date range filter
- Export analytics button

---

## Implementation Details

### Phase 1: Database & Full-Text Search Setup (Days 1-2)

1. Add SearchQuery and SavedSearch models to Prisma schema
2. Run database migrations
3. Create PostgreSQL full-text search indexes:
   ```bash
   npx prisma db push
   psql $DATABASE_URL < create_fts_indexes.sql
   ```
4. Test full-text search queries in PostgreSQL
5. Create search utility functions for building queries

**Key Files:**
- `prisma/schema.prisma` - Add new models
- `prisma/migrations/add_search_models.sql` - Migration
- `scripts/create_fts_indexes.sql` - Full-text search indexes
- `lib/search/query-builder.ts` - Search query construction utilities

---

### Phase 2: Search API Implementation (Days 3-4)

1. Implement `/api/search` endpoint with:
   - Query parsing and validation
   - Permission-based filtering logic
   - Full-text search across all content types
   - Result ranking and grouping
   - Search query tracking
2. Implement search utility functions:
   - `searchCourses(query, filters, userId)`
   - `searchEvents(query, filters, userId)`
   - `searchForumPosts(query, filters, userId)`
   - `searchUsers(query, filters, userId)`
   - `searchTasks(query, filters, userId)`
3. Add permission checking helpers:
   - `canUserAccessCourse(userId, courseId)`
   - `canUserAccessEvent(userId, eventId)`
   - `canUserAccessForumPost(userId, postId)`
4. Implement saved search endpoints
5. Implement search history endpoints
6. Add click tracking endpoint

**Key Files:**
- `app/api/search/route.ts` - Main search endpoint
- `app/api/search/saved/route.ts` - Saved searches CRUD
- `app/api/search/history/route.ts` - Search history
- `lib/search/permissions.ts` - Permission checking
- `lib/search/searchers/` - Individual content type searchers

---

### Phase 3: Search UI Components (Days 5-6)

1. Create GlobalSearchBar component
2. Implement SearchModal with instant results
3. Build SearchResultsGrouped component
4. Create full search results page
5. Implement AdvancedFilters sidebar
6. Add keyboard navigation
7. Style with biophilic design system
8. Add loading and empty states
9. Implement search highlighting

**Key Files:**
- `app/components/search/GlobalSearchBar.tsx`
- `app/components/search/SearchModal.tsx`
- `app/components/search/SearchResultsGrouped.tsx`
- `app/components/search/AdvancedFilters.tsx`
- `app/search/page.tsx` - Full results page
- `app/components/search/SearchResult.tsx` - Individual result card

---

### Phase 4: Saved Searches & Analytics (Day 7)

1. Create SavedSearches management page
2. Implement search analytics dashboard (admin)
3. Add analytics tracking to search queries
4. Create analytics visualization components
5. Add export functionality
6. Test all search features end-to-end
7. Performance optimization and caching

**Key Files:**
- `app/dashboard/settings/saved-searches/page.tsx`
- `app/dashboard/admin/analytics/search/page.tsx`
- `app/api/admin/search/analytics/route.ts`
- `lib/search/analytics.ts`

---

### Permission Filtering Logic

Each content type has specific permission rules:

**Courses:**
```typescript
async function searchCourses(query: string, filters: Filters, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  // Base query with full-text search
  const whereClause: any = {
    AND: [
      {
        OR: [
          { title: { search: query } },
          { description: { search: query } }
        ]
      },
      {
        OR: [
          { isPublished: true }, // Public courses
          { createdById: userId }, // User's own courses
          user.role === 'WEB_STEWARD' || user.role === 'BOARD_CHAIR' ? {} : null // Admins see all
        ].filter(Boolean)
      }
    ]
  };

  // Apply additional filters
  if (filters.status) {
    whereClause.AND.push({ status: filters.status });
  }

  return prisma.course.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      thumbnail: true,
      status: true,
      createdBy: { select: { name: true } }
    },
    take: 5 // Limit for instant search
  });
}
```

**Forum Posts:**
```typescript
async function searchForumPosts(query: string, filters: Filters, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      committees: {
        include: { committee: true }
      }
    }
  });

  const userCommitteeIds = user.committees.map(cm => cm.committeeId);

  const whereClause: any = {
    AND: [
      {
        OR: [
          { title: { search: query } },
          { content: { search: query } }
        ]
      },
      {
        category: {
          OR: [
            { committeeId: null }, // Public forum posts
            { committeeId: { in: userCommitteeIds } } // User's committee posts
          ]
        }
      }
    ]
  };

  return prisma.forumPost.findMany({
    where: whereClause,
    include: {
      author: { select: { name: true } },
      category: { select: { name: true } }
    },
    take: 5
  });
}
```

---

### Search Result Highlighting

Use PostgreSQL's `ts_headline` function for highlighting:

```sql
SELECT
  id,
  title,
  ts_headline('english', description, websearch_to_tsquery('english', $1)) as highlighted_description,
  ts_rank(to_tsvector('english', title || ' ' || description), websearch_to_tsquery('english', $1)) as rank
FROM "Course"
WHERE to_tsvector('english', title || ' ' || description) @@ websearch_to_tsquery('english', $1)
ORDER BY rank DESC
LIMIT 20;
```

---

### Performance Optimization

1. **Caching:** Cache popular search queries for 5 minutes using Redis (if available)
2. **Indexes:** Ensure GIN indexes on all searchable text columns
3. **Pagination:** Limit instant search to 5 results per type, full search to 20 per page
4. **Debouncing:** 300ms debounce on instant search to reduce API calls
5. **Parallel Searches:** Execute searches across content types in parallel using `Promise.all()`
6. **Query Optimization:** Use `select` to only fetch needed fields

---

## Testing Requirements

### Unit Tests

```typescript
// Test permission filtering
test('searchCourses returns only published courses for basic users', async () => {
  const userId = 'user_steward';
  const results = await searchCourses('healing', {}, userId);

  expect(results.every(course => course.isPublished)).toBe(true);
});

test('searchForumPosts excludes private committee discussions', async () => {
  const userId = 'user_not_in_governance';
  const results = await searchForumPosts('governance', {}, userId);

  const governanceCommitteeId = await getCommitteeId('governance');
  expect(results.every(post =>
    post.category.committeeId !== governanceCommitteeId
  )).toBe(true);
});

// Test full-text search
test('search finds partial word matches', async () => {
  const results = await searchCourses('heal', {}, 'admin_user');

  expect(results.some(course =>
    course.title.toLowerCase().includes('healing')
  )).toBe(true);
});
```

### Integration Tests

- User performs search and sees permission-filtered results
- User saves search and can retrieve it later
- Admin views search analytics
- Search respects all advanced filters
- Keyboard navigation works in search modal

### Manual Testing Checklist

- [ ] Global search bar accessible from all pages
- [ ] CMD+K / CTRL+K opens search modal
- [ ] Instant results appear within 500ms
- [ ] Search highlights match query terms
- [ ] Permission filtering works correctly (test with different user roles)
- [ ] Advanced filters update results correctly
- [ ] Saved searches can be created, edited, and deleted
- [ ] Search history shows recent queries
- [ ] Zero-result searches show helpful empty state
- [ ] Mobile responsive design works
- [ ] Keyboard navigation (arrows, enter, escape) works
- [ ] Admin analytics dashboard displays correct data
- [ ] Click tracking records properly

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated with SearchQuery and SavedSearch models
- [ ] Database migrations tested
- [ ] Full-text search indexes created in PostgreSQL
- [ ] All API endpoints implemented and tested
- [ ] UI components built and styled
- [ ] Permission filtering tested with all user roles
- [ ] Performance testing completed (< 200ms response time)
- [ ] All tests passing

### Deployment Steps

1. Backup production database
2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Create full-text search indexes:
   ```bash
   psql $DATABASE_URL < scripts/create_fts_indexes.sql
   ```
4. Build application:
   ```bash
   npm run build
   ```
5. Deploy to hosting platform
6. Run smoke tests:
   - Perform test search as different user roles
   - Verify permission filtering
   - Check analytics dashboard

### Post-Deployment

- [ ] Search functionality working for all users
- [ ] No unauthorized content visible in search results
- [ ] Search response times acceptable (< 200ms)
- [ ] Full-text search indexes active
- [ ] Saved searches working
- [ ] Search history tracking
- [ ] Analytics dashboard accessible to admins
- [ ] Monitor error logs for search-related issues
- [ ] Track search usage metrics

---

## Future Enhancements

1. **Algolia Integration:** Optional integration with Algolia for advanced search features
2. **Voice Search:** Voice-to-text search using Web Speech API
3. **Search Suggestions:** Auto-suggest queries based on popular searches
4. **Advanced Operators:** Support for boolean operators (AND, OR, NOT, quotes)
5. **Faceted Search:** Dynamic facets based on search results
6. **Search Result Previews:** Rich previews with more context
7. **Collaborative Filtering:** "Users who searched this also searched..."
8. **Multi-Language Support:** Full-text search in Spanish
9. **PDF/Document Search:** Index and search uploaded PDFs
10. **Semantic Search:** AI-powered semantic search using embeddings
11. **Search Alerts:** Email notifications when new content matches saved search
12. **Federated Search:** Search across external partner resources

---

## Security Considerations

1. **SQL Injection Prevention:** Use parameterized queries, never concatenate user input
2. **Permission Enforcement:** Always filter results by user permissions server-side
3. **Rate Limiting:** Implement rate limiting to prevent search abuse (max 100 searches/minute per user)
4. **Input Sanitization:** Sanitize search queries to prevent XSS attacks
5. **Sensitive Data Exclusion:** Never index passwords, tokens, or PII in search
6. **Audit Logging:** Log all searches for security auditing
7. **Access Control:** Ensure search analytics only accessible by admins

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
