# Feature Requirements: Membership Contract Agreement System

## Feature Overview
Implement covenant acceptance workflow requiring members to agree to combined membership agreement after registration but before site access.

## User Stories

### As a prospective member:
- I want to create an account with email and password
- I want to see the full membership contract before committing
- I want to understand what I'm agreeing to
- I want to download a copy of the contract I agreed to

### As an admin (Web Steward):
- I want to update the contract when legal/organizational changes occur
- I want to track which version each member agreed to
- I want to require re-acceptance when the contract changes
- I want legal protection through timestamp and IP logging

### As the organization:
- We need enforceable covenant agreements
- We need version control for legal compliance
- We need complete site lockout for non-acceptance

## Functional Requirements

### 1. Contract Flow
- **Timing:** Contract agreement required AFTER registration, BEFORE site access
- **Documents:** Single combined document containing:
  - Membership Agreement
  - Non-Disclosure Agreement (NDA)
  - Definitions & Terminology
- **Versioning:** Track contract versions with re-acceptance requirement

### 2. Agreement Process
- Display full contract text (from `ContractVersion` model)
- Must scroll to bottom before "I Agree" button activates
- Checkbox: "I have read and agree to the terms"
- Record timestamp, IP address, contract version on acceptance
- Complete site lockout if not agreed (no access to any member features)

### 3. Contract Versioning
- Admins can publish new contract versions
- Only one version can be active at a time
- When new version published:
  - Existing members flagged for re-acceptance
  - On next login, must review and accept new version
  - Access blocked until re-acceptance

### 4. Legal Tracking
- Store in `User` model:
  - `covenantAcceptedAt`: DateTime
  - `covenantVersion`: String (version accepted)
  - `covenantIpAddress`: String (IP at time of acceptance)
- Immutable audit log (no edits after acceptance)

### 5. Access Control
- **Before Acceptance:**
  - Can only access: /register, /login, /contract-review
  - Redirect all other routes to /contract-review
- **After Acceptance:**
  - Full access to member dashboard and features

## Technical Requirements

### Database
- `ContractVersion` model (already in Prisma schema):
  - `id`, `version`, `content`, `publishedAt`, `isActive`
- `User` model fields:
  - `covenantAcceptedAt`, `covenantVersion`, `covenantIpAddress`

### API Endpoints
- `GET /api/contract/active` - Fetch active contract version
- `POST /api/contract/accept` - Accept contract (user ID, version, IP)
- `GET /api/contract/user-status` - Check if user needs to accept/re-accept
- `POST /api/admin/contract/publish` - Publish new version (admin only)

### UI Components
- **ContractReviewPage** (`app/(auth)/contract-review/page.tsx`)
  - Full contract display with scrolling
  - Scroll-to-bottom detection
  - Agreement checkbox + button
  - Download PDF option
- **ContractGuard** (middleware)
  - Check covenant acceptance on protected routes
  - Redirect to /contract-review if not accepted

### Middleware
- Route protection checking `covenantAcceptedAt` and `covenantVersion`
- IP address capture from request headers

## Design Specifications

### Visual Design
- Use biophilic design system (earth tones)
- Parchment-style background for contract (stone-warm)
- Serif font for legal text (Spectral)
- Generous line height for readability
- Sticky footer with acceptance controls

### Accessibility
- Keyboard navigation for checkbox and button
- Screen reader support for all interactions
- WCAG AA contrast for all text
- Focus indicators on interactive elements

## Success Criteria

- [ ] New users cannot access site without accepting contract
- [ ] Contract version and timestamp logged for all users
- [ ] IP address captured at time of acceptance
- [ ] Admins can publish new contract versions
- [ ] Existing users prompted to re-accept when version changes
- [ ] Users can download PDF of accepted contract
- [ ] All routes protected except registration/login/contract pages
- [ ] Scroll-to-bottom required before acceptance enabled

## Open Questions

1. Should we email users when a new contract version is published?
2. Grace period for re-acceptance (e.g., 7 days) or immediate lockout?
3. PDF generation: server-side or client-side?
4. Should we display a diff of changes when showing new version?

## Dependencies

- NextAuth.js authentication (Feature #2)
- User model in database
- Email system for notifications (optional)

## Estimated Effort

**Medium (M)** - 1 week

## Related Features

- Feature #2: User Authentication & Role-Based Access
- Feature #22: Admin Panel (for managing contract versions)
