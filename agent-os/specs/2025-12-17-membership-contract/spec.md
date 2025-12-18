# Specification: Membership Contract Agreement System

**Feature ID:** F001
**Priority:** Critical
**Effort:** Medium (1 week)
**Dependencies:** Database schema (Prisma), User model
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
Implement a legally-compliant covenant acceptance system where members must agree to the BRITE POOL membership contract after registration but before accessing any member features.

### Key Requirements
- Single combined contract document (Membership Agreement + NDA + Definitions)
- Version control with re-acceptance tracking
- Timestamp and IP address logging for legal protection
- Complete site lockout for non-acceptance
- Admin interface to publish new contract versions

### Success Metrics
- 100% of active users have accepted current contract version
- Zero access to member features without contract acceptance
- Complete audit trail of all contract acceptances

---

## User Flows

### Flow 1: New User Registration & Contract Acceptance

```
1. User visits /register
2. User fills out registration form (email, password, name)
3. User submits form → POST /api/auth/register
4. Account created, user redirected to /login
5. User logs in → POST /api/auth/login
6. Middleware checks covenant acceptance status
7. User has NO acceptance → Redirect to /contract-review
8. User sees full contract with scroll requirement
9. User scrolls to bottom (button becomes enabled)
10. User checks "I agree" checkbox
11. User clicks "Accept Contract" button
12. POST /api/contract/accept (captures IP, timestamp, version)
13. Database updated with acceptance details
14. User redirected to /dashboard
15. User now has full site access
```

### Flow 2: Existing User - New Contract Version Published

```
1. Admin publishes new contract version (POST /api/admin/contract/publish)
2. New ContractVersion created with isActive=true
3. Previous version set to isActive=false
4. Existing user logs in
5. Middleware checks: user.covenantVersion != active contract version
6. User redirected to /contract-review with notice: "Updated Contract"
7. User sees new contract (optionally: diff of changes shown)
8. User must re-accept following same flow as new users
9. Access blocked until re-acceptance
```

### Flow 3: User Attempts to Access Protected Route Without Acceptance

```
1. User navigates to /dashboard (or any protected route)
2. Middleware checks session.user.covenantAcceptedAt
3. If null or version mismatch → Redirect to /contract-review
4. User must complete acceptance flow
5. After acceptance → Redirect back to originally requested URL
```

---

## Database Schema

### Existing Models (from Prisma schema)

```prisma
model User {
  // ... other fields
  covenantAcceptedAt  DateTime?
  covenantVersion     String?
  covenantIpAddress   String?
}

model ContractVersion {
  id          String   @id @default(cuid())
  version     String   @unique  // e.g., "1.0.0", "1.1.0"
  content     String   // Full markdown/HTML content
  publishedAt DateTime @default(now())
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([isActive])
}
```

### Contract Content Structure

The `content` field in `ContractVersion` should contain the combined document:

```markdown
# BRITE POOL MINISTERIUM OF EMPOWERMENT
## MEMBERSHIP & PARTICIPATION AGREEMENT

### I. PURPOSE & INTENT
[Full membership agreement text...]

### II. DEFINITIONS
[Definitions & Terminology...]

### III. NON-DISCLOSURE
[NDA terms...]

[Rest of contract content...]
```

---

## API Endpoints

### 1. GET /api/contract/active

**Purpose:** Fetch the current active contract version

**Authentication:** None required (needed for pre-auth users)

**Response:**
```json
{
  "id": "clx123...",
  "version": "1.0.0",
  "content": "# BRITE POOL MINISTERIUM...",
  "publishedAt": "2025-12-17T00:00:00Z"
}
```

**Error Cases:**
- No active contract found → 404

---

### 2. POST /api/contract/accept

**Purpose:** Record user's acceptance of the contract

**Authentication:** Required (user must be logged in)

**Request Body:**
```json
{
  "contractVersionId": "clx123...",
  "version": "1.0.0"
}
```

**Logic:**
1. Verify user is authenticated
2. Verify contract version exists and is active
3. Capture IP address from request headers (`x-forwarded-for` or `req.socket.remoteAddress`)
4. Update User record:
   - `covenantAcceptedAt` = now()
   - `covenantVersion` = provided version
   - `covenantIpAddress` = captured IP

**Response:**
```json
{
  "success": true,
  "acceptedAt": "2025-12-17T12:34:56Z"
}
```

**Error Cases:**
- User not authenticated → 401
- Contract version not found → 404
- Contract version not active → 400

---

### 3. GET /api/contract/user-status

**Purpose:** Check if logged-in user needs to accept/re-accept contract

**Authentication:** Required

**Response:**
```json
{
  "needsAcceptance": false,
  "currentVersion": "1.0.0",
  "userAcceptedVersion": "1.0.0",
  "acceptedAt": "2025-12-17T12:34:56Z"
}
```

OR

```json
{
  "needsAcceptance": true,
  "currentVersion": "1.1.0",
  "userAcceptedVersion": "1.0.0",  // or null if never accepted
  "reason": "version_mismatch"     // or "not_accepted"
}
```

---

### 4. POST /api/admin/contract/publish (Admin Only)

**Purpose:** Publish a new contract version

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "version": "1.1.0",
  "content": "# BRITE POOL MINISTERIUM..."
}
```

**Logic:**
1. Verify user has admin permissions
2. Set all existing contracts to `isActive = false`
3. Create new `ContractVersion` with `isActive = true`
4. (Optional) Trigger email notification to all users about new version

**Response:**
```json
{
  "success": true,
  "contractId": "clx456...",
  "version": "1.1.0",
  "affectedUsers": 247  // Count of users who now need to re-accept
}
```

---

## UI Components

### 1. Contract Review Page

**Location:** `app/(auth)/contract-review/page.tsx`

**Features:**
- Full-screen layout with sticky header and footer
- Scrollable contract content area
- Scroll position tracking
- "I Agree" checkbox (disabled until scrolled to bottom)
- "Accept Contract" button (disabled until checkbox checked)
- "Download PDF" link
- Visual indicator showing scroll progress

**Component Structure:**

```tsx
export default function ContractReviewPage() {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active contract
  useEffect(() => {
    fetch('/api/contract/active').then(/*...*/)
  }, []);

  // Track scroll position
  const handleScroll = (e) => {
    const element = e.target;
    const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    if (atBottom) setHasScrolledToBottom(true);
  };

  // Handle acceptance
  const handleAccept = async () => {
    setIsSubmitting(true);
    const res = await fetch('/api/contract/accept', {
      method: 'POST',
      body: JSON.stringify({ contractVersionId, version })
    });
    if (res.ok) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-earth-light">
      <header className="bg-stone-warm border-b border-stone p-6">
        <h1 className="text-3xl font-serif text-earth-brown">Membership Agreement</h1>
      </header>

      <div
        className="flex-1 overflow-y-auto p-8 md:p-12"
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto prose prose-earth">
          {/* Render contract content as markdown */}
          <ReactMarkdown>{contractContent}</ReactMarkdown>
        </div>
      </div>

      <footer className="bg-stone-warm border-t border-stone p-6 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="checkbox"
              id="agree"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="w-5 h-5 accent-earth-brown"
            />
            <label htmlFor="agree" className="text-earth-dark">
              I have read and agree to the terms above
            </label>
          </div>

          <button
            onClick={handleAccept}
            disabled={!hasAgreed || isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Accept Contract'}
          </button>
        </div>

        {!hasScrolledToBottom && (
          <p className="text-sm text-earth-brown mt-2 text-center">
            Please scroll to the bottom to enable acceptance
          </p>
        )}
      </footer>
    </div>
  );
}
```

**Accessibility:**
- Keyboard navigation for checkbox and button
- ARIA labels for scroll status
- Focus management on page load
- Screen reader announcements for button state changes

---

### 2. Middleware: Contract Guard

**Location:** `middleware.ts` (Next.js middleware)

**Purpose:** Protect all routes except auth routes, redirect unauthenticated or non-covenant users

**Logic:**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicRoutes = ['/', '/login', '/register', '/contract-review'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // Require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check covenant acceptance
  if (!token.covenantAcceptedAt || token.covenantVersion !== activeVersion) {
    return NextResponse.redirect(new URL('/contract-review', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

### 3. Admin Contract Manager Component

**Location:** `app/dashboard/admin/contracts/page.tsx`

**Features:**
- View all contract versions
- Create new version (rich text editor)
- Publish new version (sets as active)
- See count of users affected by version change

---

## Implementation Details

### Phase 1: Database & API (Days 1-2)

1. Ensure Prisma schema is up to date
2. Run `npx prisma db push` to sync schema
3. Seed initial contract version:
   ```typescript
   await prisma.contractVersion.create({
     data: {
       version: '1.0.0',
       content: contractMarkdownContent,
       isActive: true
     }
   });
   ```
4. Implement API routes:
   - `/api/contract/active`
   - `/api/contract/accept`
   - `/api/contract/user-status`
   - `/api/admin/contract/publish`

### Phase 2: UI Components (Days 3-4)

1. Create Contract Review Page
2. Implement scroll tracking logic
3. Style with biophilic design system
4. Add markdown rendering (use `react-markdown`)

### Phase 3: Middleware & Protection (Day 5)

1. Implement Next.js middleware
2. Add covenant check to NextAuth callbacks
3. Test route protection

### Phase 4: Admin Interface (Days 6-7)

1. Create admin contract management page
2. Add rich text editor for creating versions
3. Implement publish workflow
4. Test version updates and re-acceptance flow

---

## Testing Requirements

### Unit Tests

```typescript
// Test contract acceptance API
test('POST /api/contract/accept records acceptance', async () => {
  const res = await fetch('/api/contract/accept', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${validToken}` },
    body: JSON.stringify({ contractVersionId, version: '1.0.0' })
  });

  expect(res.status).toBe(200);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  expect(user.covenantAcceptedAt).not.toBeNull();
  expect(user.covenantVersion).toBe('1.0.0');
  expect(user.covenantIpAddress).toBeTruthy();
});
```

### Integration Tests

- User registration → contract review → acceptance → dashboard access
- User with old version → new version published → forced re-acceptance
- User tries to access protected route → redirected to contract review

### Manual Testing Checklist

- [ ] New user can register and see contract
- [ ] Cannot accept without scrolling to bottom
- [ ] Cannot access dashboard without accepting
- [ ] IP address and timestamp logged correctly
- [ ] Admin can publish new version
- [ ] Existing users prompted to re-accept on new version
- [ ] All protected routes redirect properly
- [ ] Download PDF works
- [ ] Mobile responsive design works

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database schema synced (`npx prisma db push`)
- [ ] Initial contract version seeded
- [ ] Environment variables configured
- [ ] API endpoints tested
- [ ] Middleware tested
- [ ] All tests passing

### Deployment Steps

1. Deploy database migrations
2. Seed initial contract version
3. Deploy application code
4. Test in production environment
5. Monitor for errors

### Post-Deployment

- [ ] Verify new user registration flow
- [ ] Verify existing users can still log in
- [ ] Monitor database for contract acceptances
- [ ] Check IP addresses are being captured correctly

---

## Future Enhancements

1. **Email Notifications:** Send email when new contract version published
2. **Diff View:** Show visual diff of changes between versions
3. **Grace Period:** Allow 7-day grace period for re-acceptance
4. **Multi-Language:** Spanish translation of contract
5. **PDF Generation:** Server-side PDF generation for download
6. **Audit Log:** Separate table for all acceptance events (immutable)

---

**Spec Complete** ✅

Next step: Run `/create-tasks` to generate implementation task list.
