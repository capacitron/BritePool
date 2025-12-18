# Specification: Membership Tiers & Access Control

**Feature ID:** F012
**Priority:** High
**Effort:** Small (2-3 days)
**Dependencies:** Authentication (F002), Subscriptions (F011)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Tier Definition Matrix](#tier-definition-matrix)
3. [User Flows](#user-flows)
4. [Database Schema](#database-schema)
5. [Access Control Middleware](#access-control-middleware)
6. [API Endpoints](#api-endpoints)
7. [UI Components](#ui-components)
8. [Implementation Details](#implementation-details)
9. [Testing Requirements](#testing-requirements)
10. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Purpose
Implement a comprehensive four-tier membership system (FREE, BASIC, PREMIUM, PLATINUM) with feature-level access control, paywall components, upgrade prompts, and middleware to enforce tier-based permissions throughout the platform. This system provides a clear monetization strategy while ensuring free members can still access core community features.

### Key Requirements
- Four subscription tiers with clearly defined feature access levels
- Middleware-based access control for route and feature protection
- Tier comparison page for transparent feature visibility
- Upgrade prompts and paywalls at feature boundaries
- Graceful degradation for non-premium features
- Integration with Subscriptions system (F011)
- Real-time tier checking without page reloads
- Analytics tracking for upgrade conversion funnel

### Success Metrics
- 100% of premium features protected by middleware
- Zero unauthorized access to tier-restricted content
- Tier comparison page conversion rate >5%
- Upgrade prompts shown contextually at feature boundaries
- Clear user understanding of tier benefits (measured via surveys)
- Seamless integration with payment processing (F011)

---

## Tier Definition Matrix

### Feature Access by Tier

| Feature Category | FREE | BASIC | PREMIUM | PLATINUM |
|-----------------|------|-------|---------|----------|
| **Community & Forums** |
| Covenant Agreement Access | ✓ | ✓ | ✓ | ✓ |
| Basic Forum Discussions | ✓ | ✓ | ✓ | ✓ |
| Forum Post Creation | ✓ | ✓ | ✓ | ✓ |
| Direct Messaging | - | ✓ | ✓ | ✓ |
| Private Group Forums | - | - | ✓ | ✓ |
| **Events & Calendar** |
| View Public Events | ✓ | ✓ | ✓ | ✓ |
| Register for Basic Events | ✓ | ✓ | ✓ | ✓ |
| Register for Workshops | - | ✓ | ✓ | ✓ |
| Priority Event Registration | - | - | ✓ | ✓ |
| Exclusive Members-Only Events | - | - | - | ✓ |
| **Learning & Courses** |
| View Course Catalog | ✓ | ✓ | ✓ | ✓ |
| Access Intro Courses (3 max) | ✓ | ✓ | ✓ | ✓ |
| Access All Standard Courses | - | ✓ | ✓ | ✓ |
| Access Premium Courses | - | - | ✓ | ✓ |
| Live Webinar Participation | - | - | ✓ | ✓ |
| 1-on-1 Instructor Sessions | - | - | - | ✓ |
| **Practitioner Services** |
| View Practitioner Directory | ✓ | ✓ | ✓ | ✓ |
| Contact Practitioners | - | ✓ | ✓ | ✓ |
| Book Appointments | - | - | ✓ | ✓ |
| Priority Booking | - | - | - | ✓ |
| Discounted Sessions (15% off) | - | - | - | ✓ |
| **Sacred Ledger** |
| View Personal Contributions | ✓ | ✓ | ✓ | ✓ |
| Log Participation Hours | ✓ | ✓ | ✓ | ✓ |
| Earn Equity Units | - | ✓ | ✓ | ✓ |
| **Media & Gallery** |
| View Public Media Gallery | ✓ | ✓ | ✓ | ✓ |
| Download Standard Resolution | - | ✓ | ✓ | ✓ |
| Download High Resolution | - | - | ✓ | ✓ |
| Upload to Member Gallery | - | - | ✓ | ✓ |
| **Committee Participation** |
| View Committee Info | ✓ | ✓ | ✓ | ✓ |
| Join Committees | - | ✓ | ✓ | ✓ |
| Vote on Committee Decisions | - | - | ✓ | ✓ |
| Lead Committees | - | - | - | ✓ |
| **Other Benefits** |
| Monthly Newsletter | ✓ | ✓ | ✓ | ✓ |
| Announcements | ✓ | ✓ | ✓ | ✓ |
| Resource Library Access | - | ✓ | ✓ | ✓ |
| Merchandise Discounts | - | - | 10% | 20% |
| Support Priority | Standard | Standard | Priority | VIP |

### Tier Pricing

| Tier | Monthly Price | Annual Price (savings) | Key Value Proposition |
|------|--------------|------------------------|----------------------|
| **FREE** | $0 | $0 | Access core community features and covenant |
| **BASIC** | $25/mo | $250/year (17% off) | Participate in workshops and earn equity |
| **PREMIUM** | $75/mo | $750/year (17% off) | Full course access + practitioner bookings |
| **PLATINUM** | $150/mo | $1,500/year (17% off) | VIP access + leadership opportunities |

---

## User Flows

### Flow 1: Free User Encounters Paywall

```
1. User logs in with FREE tier (subscriptionTier = FREE)
2. User browses site and navigates to /courses
3. User sees course catalog with clear tier badges:
   - "Free" badge on intro courses
   - "Basic+" badge on standard courses (locked icon)
   - "Premium" badge on advanced courses (locked icon)
4. User clicks on locked "Basic+" course
5. Paywall component appears as modal overlay:
   - "This course requires BASIC membership or higher"
   - Show tier comparison table highlighting BASIC features
   - "Upgrade to BASIC" CTA button (primary action)
   - "View all tiers" link (secondary action)
6. User clicks "Upgrade to BASIC"
7. Redirects to /pricing with BASIC tier pre-selected
8. User completes payment flow (F011 - Subscriptions)
9. After successful payment:
   - subscriptionTier updated to BASIC
   - subscriptionStatus updated to ACTIVE
10. User redirected back to course page
11. Course is now unlocked and accessible
```

### Flow 2: User Compares Tiers Before Upgrading

```
1. User navigates to /pricing (tier comparison page)
2. User sees four-column comparison table:
   - All features listed with checkmarks per tier
   - Monthly and annual pricing toggle
   - Clear differentiation of tier benefits
3. User can filter view:
   - "Show all features" (default)
   - "Show differences only" (highlights tier gaps)
4. Each tier card has:
   - Tier name and tagline
   - Price (monthly/annual toggle)
   - "Current Plan" badge if applicable
   - "Upgrade" button if lower than current
   - "Manage Subscription" link if current
5. User clicks "Upgrade to PREMIUM"
6. Modal confirms upgrade details:
   - New monthly charge
   - Proration details if mid-cycle
   - Features gained
   - "Confirm Upgrade" button
7. User confirms → POST /api/subscriptions/upgrade
8. Payment processed via Stripe/payment gateway
9. Success message + redirect to dashboard
10. Immediate access to new premium features
```

### Flow 3: Middleware Blocks Access to Protected Route

```
1. User with BASIC tier navigates to /dashboard/practitioners/book/[id]
2. Middleware chain executes:
   a. Authentication check (passed - user is logged in)
   b. Covenant acceptance check (passed - covenant accepted)
   c. Tier access check (FAILED - needs PREMIUM tier)
3. Middleware captures originalUrl = /dashboard/practitioners/book/[id]
4. Redirects to /upgrade?required=PREMIUM&return=/dashboard/practitioners/book/[id]
5. Upgrade prompt page shows:
   - "Premium Membership Required"
   - Feature description: "Book appointments with practitioners"
   - Tier comparison focused on PREMIUM benefits
   - "Upgrade Now" CTA
6. User upgrades to PREMIUM
7. After successful upgrade:
   - Redirects to originalUrl (/dashboard/practitioners/book/[id])
8. User can now complete booking
```

### Flow 4: User Receives Contextual Upgrade Prompt

```
1. User with BASIC tier is viewing /dashboard/committees/health
2. User sees committee overview and member list
3. User clicks "Vote on Proposal" button
4. onClick handler checks tier requirement:
   - getFeatureAccess('committee_voting', user.subscriptionTier)
   - Returns: { hasAccess: false, requiredTier: 'PREMIUM' }
5. Instead of navigation, inline prompt appears:
   - Banner at top of page (not blocking modal)
   - "Voting on committee decisions requires Premium membership"
   - "Upgrade to Premium" button
   - "Learn More" link → /pricing
   - Dismissable (X button)
6. User can continue browsing but cannot vote
7. Upgrade prompt persists on relevant pages
8. User upgrades → prompt disappears immediately
```

### Flow 5: Admin Grants Complimentary Tier Upgrade

```
1. Admin navigates to /dashboard/admin/users/[id]
2. Admin sees user subscription details:
   - Current Tier: FREE
   - Status: INACTIVE
   - Member Since: 2025-12-01
3. Admin clicks "Grant Complimentary Access"
4. Modal opens with options:
   - Select Tier: [Dropdown: BASIC, PREMIUM, PLATINUM]
   - Duration: [Dropdown: 1 month, 3 months, 6 months, 1 year, Lifetime]
   - Reason: [Text field for admin notes]
5. Admin selects PREMIUM, 6 months, reason: "Early supporter reward"
6. Admin clicks "Grant Access"
7. POST /api/admin/subscriptions/grant
8. System updates:
   - subscriptionTier = PREMIUM
   - subscriptionStatus = ACTIVE
   - isComplementary = true (special flag)
   - complementaryExpiresAt = now() + 6 months
9. User receives email notification of upgrade
10. User immediately gains PREMIUM access
11. After 6 months, tier reverts to FREE unless renewed
```

---

## Database Schema

### Existing Models (Utilized)

The `User` model already has subscription fields:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique

  // Subscription fields (already exist)
  subscriptionTier    SubscriptionTier @default(FREE)
  subscriptionStatus  SubscriptionStatus @default(INACTIVE)

  // ... other fields
}

enum SubscriptionTier {
  FREE
  BASIC
  PREMIUM
  PLATINUM
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  PAST_DUE
  CANCELLED
}
```

### New Models: Subscription Management

```prisma
model Subscription {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Current subscription details
  tier                  SubscriptionTier
  status                SubscriptionStatus
  billingCycle          BillingCycle @default(MONTHLY)

  // Payment gateway integration
  stripeCustomerId      String?  @unique
  stripeSubscriptionId  String?  @unique

  // Pricing
  amount                Float    // Current monthly charge
  currency              String   @default("USD")

  // Billing dates
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  nextBillingDate       DateTime?

  // Complimentary access
  isComplementary       Boolean  @default(false)
  complementaryReason   String?
  complementaryExpiresAt DateTime?

  // Cancellation
  cancelAtPeriodEnd     Boolean  @default(false)
  cancelledAt           DateTime?

  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  payments              Payment[]
  tierChanges           TierChangeLog[]

  @@index([userId])
  @@index([stripeCustomerId])
  @@index([status])
}

model Payment {
  id                String   @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  amount            Float
  currency          String   @default("USD")
  status            PaymentStatus

  // Payment gateway
  stripePaymentIntentId String? @unique
  stripeInvoiceId       String? @unique

  // Failure handling
  failureReason     String?
  attemptCount      Int      @default(1)

  paidAt            DateTime?
  createdAt         DateTime @default(now())

  @@index([subscriptionId])
  @@index([status])
}

model TierChangeLog {
  id                String   @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  fromTier          SubscriptionTier
  toTier            SubscriptionTier
  reason            TierChangeReason

  // Proration details
  proratedAmount    Float?
  proratedDays      Int?

  changedById       String?  // Admin ID if manually changed

  createdAt         DateTime @default(now())

  @@index([subscriptionId])
  @@index([createdAt])
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

enum TierChangeReason {
  UPGRADE
  DOWNGRADE
  ADMIN_GRANT
  ADMIN_REVOKE
  CANCELLATION
  PAYMENT_FAILURE
}
```

### New Model: Feature Access Configuration

This model allows dynamic feature access configuration without code changes:

```prisma
model FeatureAccess {
  id              String   @id @default(cuid())
  featureKey      String   @unique  // e.g., "course_premium", "practitioner_booking"
  featureName     String              // Display name
  description     String?

  freeTier        Boolean  @default(false)
  basicTier       Boolean  @default(false)
  premiumTier     Boolean  @default(false)
  platinumTier    Boolean  @default(true)

  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([featureKey])
}
```

### Seed Data: Feature Access Matrix

```typescript
// prisma/seed.ts
const featureAccessMatrix = [
  // Forums & Community
  { featureKey: 'forum_view', featureName: 'View Forums', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'forum_post', featureName: 'Create Forum Posts', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'direct_messaging', featureName: 'Direct Messaging', freeTier: false, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'private_groups', featureName: 'Private Group Forums', freeTier: false, basicTier: false, premiumTier: true, platinumTier: true },

  // Events
  { featureKey: 'event_view', featureName: 'View Events', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'event_register_basic', featureName: 'Register for Basic Events', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'event_register_workshop', featureName: 'Register for Workshops', freeTier: false, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'event_priority', featureName: 'Priority Event Registration', freeTier: false, basicTier: false, premiumTier: true, platinumTier: true },
  { featureKey: 'event_exclusive', featureName: 'Exclusive Members Events', freeTier: false, basicTier: false, premiumTier: false, platinumTier: true },

  // Courses
  { featureKey: 'course_view_catalog', featureName: 'View Course Catalog', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'course_access_intro', featureName: 'Access Intro Courses', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'course_access_standard', featureName: 'Access All Standard Courses', freeTier: false, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'course_access_premium', featureName: 'Access Premium Courses', freeTier: false, basicTier: false, premiumTier: true, platinumTier: true },
  { featureKey: 'course_webinar', featureName: 'Live Webinar Participation', freeTier: false, basicTier: false, premiumTier: true, platinumTier: true },
  { featureKey: 'course_instructor_session', featureName: '1-on-1 Instructor Sessions', freeTier: false, basicTier: false, premiumTier: false, platinumTier: true },

  // Practitioners
  { featureKey: 'practitioner_view', featureName: 'View Practitioner Directory', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'practitioner_contact', featureName: 'Contact Practitioners', freeTier: false, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'practitioner_booking', featureName: 'Book Appointments', freeTier: false, basicTier: false, premiumTier: true, platinumTier: true },
  { featureKey: 'practitioner_priority', featureName: 'Priority Booking', freeTier: false, basicTier: false, premiumTier: false, platinumTier: true },
  { featureKey: 'practitioner_discount', featureName: 'Session Discounts (15%)', freeTier: false, basicTier: false, premiumTier: false, platinumTier: true },

  // Sacred Ledger
  { featureKey: 'ledger_view', featureName: 'View Personal Contributions', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'ledger_log', featureName: 'Log Participation Hours', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'ledger_earn_equity', featureName: 'Earn Equity Units', freeTier: false, basicTier: true, premiumTier: true, platinumTier: true },

  // Media Gallery
  { featureKey: 'media_view', featureName: 'View Public Gallery', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'media_download_standard', featureName: 'Download Standard Res', freeTier: false, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'media_download_high', featureName: 'Download High Res', freeTier: false, basicTier: false, premiumTier: true, platinumTier: true },
  { featureKey: 'media_upload', featureName: 'Upload to Gallery', freeTier: false, basicTier: false, premiumTier: true, platinumTier: true },

  // Committees
  { featureKey: 'committee_view', featureName: 'View Committee Info', freeTier: true, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'committee_join', featureName: 'Join Committees', freeTier: false, basicTier: true, premiumTier: true, platinumTier: true },
  { featureKey: 'committee_vote', featureName: 'Vote on Decisions', freeTier: false, basicTier: false, premiumTier: true, platinumTier: true },
  { featureKey: 'committee_lead', featureName: 'Lead Committees', freeTier: false, basicTier: false, premiumTier: false, platinumTier: true },
];

async function seedFeatureAccess() {
  for (const feature of featureAccessMatrix) {
    await prisma.featureAccess.upsert({
      where: { featureKey: feature.featureKey },
      update: {},
      create: feature
    });
  }
}
```

---

## Access Control Middleware

### Server-Side Middleware (Next.js)

**Location:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Route protection configuration
const routeProtection: Record<string, { requiredTier: SubscriptionTier; featureKey?: string }> = {
  // Courses
  '/dashboard/courses/premium': { requiredTier: 'PREMIUM', featureKey: 'course_access_premium' },
  '/dashboard/courses/webinar': { requiredTier: 'PREMIUM', featureKey: 'course_webinar' },

  // Practitioners
  '/dashboard/practitioners/book': { requiredTier: 'PREMIUM', featureKey: 'practitioner_booking' },
  '/dashboard/practitioners/priority': { requiredTier: 'PLATINUM', featureKey: 'practitioner_priority' },

  // Events
  '/dashboard/events/exclusive': { requiredTier: 'PLATINUM', featureKey: 'event_exclusive' },

  // Committees
  '/dashboard/committees/*/vote': { requiredTier: 'PREMIUM', featureKey: 'committee_vote' },
  '/dashboard/committees/*/lead': { requiredTier: 'PLATINUM', featureKey: 'committee_lead' },

  // Media
  '/dashboard/media/upload': { requiredTier: 'PREMIUM', featureKey: 'media_upload' },
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Public routes - no checks needed
  const publicRoutes = ['/', '/login', '/register', '/pricing', '/about'];
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // Authentication check
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Covenant check
  if (!token.covenantAcceptedAt || token.covenantVersion !== activeContractVersion) {
    return NextResponse.redirect(new URL('/contract-review', request.url));
  }

  // Tier access check
  const tierCheck = checkRouteAccess(path, token.subscriptionTier as SubscriptionTier);

  if (!tierCheck.hasAccess) {
    const upgradeUrl = new URL('/upgrade', request.url);
    upgradeUrl.searchParams.set('required', tierCheck.requiredTier);
    upgradeUrl.searchParams.set('feature', tierCheck.featureKey || '');
    upgradeUrl.searchParams.set('return', path);
    return NextResponse.redirect(upgradeUrl);
  }

  return NextResponse.next();
}

function checkRouteAccess(path: string, userTier: SubscriptionTier): {
  hasAccess: boolean;
  requiredTier?: SubscriptionTier;
  featureKey?: string;
} {
  // Check exact match first
  if (routeProtection[path]) {
    const { requiredTier, featureKey } = routeProtection[path];
    return {
      hasAccess: compareTiers(userTier, requiredTier) >= 0,
      requiredTier,
      featureKey
    };
  }

  // Check wildcard patterns
  for (const [pattern, config] of Object.entries(routeProtection)) {
    if (pattern.includes('*') && matchPattern(path, pattern)) {
      return {
        hasAccess: compareTiers(userTier, config.requiredTier) >= 0,
        requiredTier: config.requiredTier,
        featureKey: config.featureKey
      };
    }
  }

  // Default: allow access
  return { hasAccess: true };
}

function matchPattern(path: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]+') + '$');
  return regex.test(path);
}

function compareTiers(userTier: SubscriptionTier, requiredTier: SubscriptionTier): number {
  const tierHierarchy = { FREE: 0, BASIC: 1, PREMIUM: 2, PLATINUM: 3 };
  return tierHierarchy[userTier] - tierHierarchy[requiredTier];
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Client-Side Access Control Utility

**Location:** `lib/access-control.ts`

```typescript
import { SubscriptionTier } from '@prisma/client';

interface FeatureAccessResult {
  hasAccess: boolean;
  requiredTier?: SubscriptionTier;
  currentTier: SubscriptionTier;
  featureKey: string;
}

// Feature access rules (synced with database FeatureAccess model)
const featureAccessRules: Record<string, { minTier: SubscriptionTier }> = {
  // Forums
  'forum_view': { minTier: 'FREE' },
  'forum_post': { minTier: 'FREE' },
  'direct_messaging': { minTier: 'BASIC' },
  'private_groups': { minTier: 'PREMIUM' },

  // Events
  'event_view': { minTier: 'FREE' },
  'event_register_basic': { minTier: 'FREE' },
  'event_register_workshop': { minTier: 'BASIC' },
  'event_priority': { minTier: 'PREMIUM' },
  'event_exclusive': { minTier: 'PLATINUM' },

  // Courses
  'course_view_catalog': { minTier: 'FREE' },
  'course_access_intro': { minTier: 'FREE' },
  'course_access_standard': { minTier: 'BASIC' },
  'course_access_premium': { minTier: 'PREMIUM' },
  'course_webinar': { minTier: 'PREMIUM' },
  'course_instructor_session': { minTier: 'PLATINUM' },

  // Practitioners
  'practitioner_view': { minTier: 'FREE' },
  'practitioner_contact': { minTier: 'BASIC' },
  'practitioner_booking': { minTier: 'PREMIUM' },
  'practitioner_priority': { minTier: 'PLATINUM' },
  'practitioner_discount': { minTier: 'PLATINUM' },

  // Committees
  'committee_view': { minTier: 'FREE' },
  'committee_join': { minTier: 'BASIC' },
  'committee_vote': { minTier: 'PREMIUM' },
  'committee_lead': { minTier: 'PLATINUM' },

  // Media
  'media_view': { minTier: 'FREE' },
  'media_download_standard': { minTier: 'BASIC' },
  'media_download_high': { minTier: 'PREMIUM' },
  'media_upload': { minTier: 'PREMIUM' },

  // Sacred Ledger
  'ledger_view': { minTier: 'FREE' },
  'ledger_log': { minTier: 'FREE' },
  'ledger_earn_equity': { minTier: 'BASIC' },
};

/**
 * Check if user has access to a specific feature
 */
export function checkFeatureAccess(
  featureKey: string,
  userTier: SubscriptionTier
): FeatureAccessResult {
  const rule = featureAccessRules[featureKey];

  if (!rule) {
    console.warn(`Feature access rule not found for: ${featureKey}`);
    return {
      hasAccess: true, // Default to allow if rule missing
      currentTier: userTier,
      featureKey
    };
  }

  const hasAccess = compareTiers(userTier, rule.minTier) >= 0;

  return {
    hasAccess,
    requiredTier: hasAccess ? undefined : rule.minTier,
    currentTier: userTier,
    featureKey
  };
}

/**
 * Compare two tiers (returns: negative if tier1 < tier2, 0 if equal, positive if tier1 > tier2)
 */
export function compareTiers(tier1: SubscriptionTier, tier2: SubscriptionTier): number {
  const hierarchy = { FREE: 0, BASIC: 1, PREMIUM: 2, PLATINUM: 3 };
  return hierarchy[tier1] - hierarchy[tier2];
}

/**
 * Get tier display name
 */
export function getTierName(tier: SubscriptionTier): string {
  const names = {
    FREE: 'Free',
    BASIC: 'Basic',
    PREMIUM: 'Premium',
    PLATINUM: 'Platinum'
  };
  return names[tier];
}

/**
 * Get tier badge color
 */
export function getTierColor(tier: SubscriptionTier): string {
  const colors = {
    FREE: 'gray',
    BASIC: 'blue',
    PREMIUM: 'purple',
    PLATINUM: 'gold'
  };
  return colors[tier];
}

/**
 * Get pricing for tier
 */
export function getTierPricing(tier: SubscriptionTier): { monthly: number; annual: number } {
  const pricing = {
    FREE: { monthly: 0, annual: 0 },
    BASIC: { monthly: 25, annual: 250 },
    PREMIUM: { monthly: 75, annual: 750 },
    PLATINUM: { monthly: 150, annual: 1500 }
  };
  return pricing[tier];
}

/**
 * Get all features for a tier
 */
export function getTierFeatures(tier: SubscriptionTier): string[] {
  return Object.entries(featureAccessRules)
    .filter(([_, rule]) => compareTiers(tier, rule.minTier) >= 0)
    .map(([key, _]) => key);
}
```

### React Hook for Access Control

**Location:** `hooks/useFeatureAccess.ts`

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { checkFeatureAccess, FeatureAccessResult } from '@/lib/access-control';
import { SubscriptionTier } from '@prisma/client';

/**
 * React hook for checking feature access in components
 */
export function useFeatureAccess(featureKey: string): FeatureAccessResult & {
  isLoading: boolean;
} {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return {
      isLoading: true,
      hasAccess: false,
      currentTier: 'FREE' as SubscriptionTier,
      featureKey
    };
  }

  const userTier = (session?.user?.subscriptionTier as SubscriptionTier) || 'FREE';
  const result = checkFeatureAccess(featureKey, userTier);

  return {
    ...result,
    isLoading: false
  };
}

/**
 * Hook for bulk feature checking
 */
export function useFeatureAccessBulk(featureKeys: string[]): {
  results: Record<string, FeatureAccessResult>;
  isLoading: boolean;
} {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return {
      isLoading: true,
      results: {}
    };
  }

  const userTier = (session?.user?.subscriptionTier as SubscriptionTier) || 'FREE';
  const results: Record<string, FeatureAccessResult> = {};

  for (const key of featureKeys) {
    results[key] = checkFeatureAccess(key, userTier);
  }

  return {
    results,
    isLoading: false
  };
}
```

---

## API Endpoints

### 1. GET /api/tiers/pricing

**Purpose:** Get pricing information for all tiers

**Authentication:** None required

**Response:**
```json
{
  "tiers": [
    {
      "tier": "FREE",
      "name": "Free",
      "monthly": 0,
      "annual": 0,
      "features": ["covenant_access", "forum_view", "event_view"],
      "color": "gray"
    },
    {
      "tier": "BASIC",
      "name": "Basic",
      "monthly": 25,
      "annual": 250,
      "annualSavings": 50,
      "savingsPercentage": 17,
      "features": ["all_free_features", "course_access_standard", "committee_join"],
      "color": "blue"
    },
    {
      "tier": "PREMIUM",
      "name": "Premium",
      "monthly": 75,
      "annual": 750,
      "annualSavings": 150,
      "savingsPercentage": 17,
      "features": ["all_basic_features", "practitioner_booking", "committee_vote"],
      "color": "purple"
    },
    {
      "tier": "PLATINUM",
      "name": "Platinum",
      "monthly": 150,
      "annual": 1500,
      "annualSavings": 300,
      "savingsPercentage": 17,
      "features": ["all_premium_features", "priority_booking", "committee_lead"],
      "color": "gold"
    }
  ]
}
```

---

### 2. GET /api/tiers/comparison

**Purpose:** Get complete feature comparison matrix for all tiers

**Authentication:** None required

**Query Parameters:**
- `format` (optional): "table" | "compact" (default: "table")

**Response:**
```json
{
  "comparison": {
    "categories": [
      {
        "name": "Community & Forums",
        "features": [
          {
            "key": "forum_view",
            "name": "View Forums",
            "free": true,
            "basic": true,
            "premium": true,
            "platinum": true
          },
          {
            "key": "direct_messaging",
            "name": "Direct Messaging",
            "free": false,
            "basic": true,
            "premium": true,
            "platinum": true
          }
        ]
      },
      {
        "name": "Learning & Courses",
        "features": [
          {
            "key": "course_access_premium",
            "name": "Premium Courses",
            "free": false,
            "basic": false,
            "premium": true,
            "platinum": true
          }
        ]
      }
    ]
  }
}
```

---

### 3. POST /api/tiers/check-access

**Purpose:** Check if user has access to specific feature(s)

**Authentication:** Required

**Request Body:**
```json
{
  "featureKeys": ["practitioner_booking", "committee_vote"]
}
```

**Response:**
```json
{
  "results": {
    "practitioner_booking": {
      "hasAccess": false,
      "requiredTier": "PREMIUM",
      "currentTier": "BASIC"
    },
    "committee_vote": {
      "hasAccess": false,
      "requiredTier": "PREMIUM",
      "currentTier": "BASIC"
    }
  }
}
```

---

### 4. POST /api/subscriptions/upgrade

**Purpose:** Upgrade user's subscription tier

**Authentication:** Required

**Request Body:**
```json
{
  "targetTier": "PREMIUM",
  "billingCycle": "MONTHLY",
  "paymentMethodId": "pm_123..." // Stripe payment method ID
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123...",
    "tier": "PREMIUM",
    "status": "ACTIVE",
    "billingCycle": "MONTHLY",
    "amount": 75,
    "nextBillingDate": "2026-01-18T00:00:00Z"
  },
  "proration": {
    "creditedAmount": 10.50,
    "chargedAmount": 64.50
  }
}
```

**Error Cases:**
- Invalid tier → 400
- Payment failed → 402
- Already at or above target tier → 409

---

### 5. POST /api/admin/subscriptions/grant

**Purpose:** Admin grants complimentary tier access to user

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "userId": "user_123...",
  "tier": "PREMIUM",
  "duration": "6_MONTHS",
  "reason": "Early supporter reward"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "userId": "user_123...",
    "tier": "PREMIUM",
    "isComplementary": true,
    "complementaryExpiresAt": "2026-06-18T00:00:00Z"
  }
}
```

---

## UI Components

### 1. Tier Comparison Page

**Location:** `app/(marketing)/pricing/page.tsx`

**Features:**
- Four-column layout (one per tier)
- Monthly/Annual toggle with savings display
- Complete feature checklist per tier
- Visual tier badges and colors
- "Current Plan" indicator
- "Upgrade" CTAs with hover states
- Mobile-responsive (stacked on mobile)
- Testimonials section
- FAQ accordion

**Component Structure:**

```tsx
export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { data: session } = useSession();
  const currentTier = session?.user?.subscriptionTier || 'FREE';

  return (
    <div className="min-h-screen bg-gradient-to-b from-earth-light to-white">
      {/* Header */}
      <section className="py-12 text-center">
        <h1 className="text-5xl font-serif text-earth-brown mb-4">
          Choose Your Membership Tier
        </h1>
        <p className="text-xl text-earth-dark max-w-2xl mx-auto">
          Join the BRITE POOL community and unlock features that match your journey
        </p>

        {/* Billing Cycle Toggle */}
        <div className="mt-8 inline-flex items-center gap-4 bg-white p-2 rounded-full shadow-md">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={billingCycle === 'annual' ? 'btn-primary' : 'btn-secondary'}
          >
            Annual <span className="ml-1 text-sm">(Save 17%)</span>
          </button>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <TierCard
              key={tier.tier}
              tier={tier}
              billingCycle={billingCycle}
              currentTier={currentTier}
            />
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-serif text-center mb-12">
            Complete Feature Comparison
          </h2>
          <FeatureComparisonTable />
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-serif text-center mb-12">
          Frequently Asked Questions
        </h2>
        <FAQAccordion />
      </section>
    </div>
  );
}
```

---

### 2. Paywall Component

**Location:** `components/paywalls/FeaturePaywall.tsx`

**Purpose:** Reusable paywall modal/banner shown when user lacks access

**Props:**
```typescript
interface FeaturePaywallProps {
  featureKey: string;
  featureName: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  variant?: 'modal' | 'banner' | 'inline';
  onDismiss?: () => void;
  onUpgrade?: () => void;
}
```

**Component:**

```tsx
export function FeaturePaywall({
  featureKey,
  featureName,
  requiredTier,
  currentTier,
  variant = 'modal',
  onDismiss,
  onUpgrade
}: FeaturePaywallProps) {
  const router = useRouter();
  const tierName = getTierName(requiredTier);
  const tierColor = getTierColor(requiredTier);
  const pricing = getTierPricing(requiredTier);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push(`/pricing?upgrade=${requiredTier}&feature=${featureKey}`);
    }
  };

  if (variant === 'modal') {
    return (
      <Modal isOpen onClose={onDismiss}>
        <div className="p-8 text-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <LockIcon className="w-10 h-10 text-gray-400" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-serif text-earth-brown mb-4">
            {tierName} Membership Required
          </h2>

          {/* Feature Name */}
          <p className="text-lg text-earth-dark mb-6">
            <strong>{featureName}</strong> is available to {tierName} members and above.
          </p>

          {/* Tier Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${tierColor}-100 text-${tierColor}-800 mb-8`}>
            <span className="font-semibold">{tierName}</span>
            <span className="text-sm">from ${pricing.monthly}/mo</span>
          </div>

          {/* Benefits List */}
          <div className="text-left mb-8 bg-earth-light p-6 rounded-lg">
            <h3 className="font-semibold mb-3">Unlock with {tierName}:</h3>
            <ul className="space-y-2">
              {getTierFeatures(requiredTier).slice(0, 5).map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-green-600" />
                  <span>{featureAccessRules[feature]?.name || feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <button onClick={onDismiss} className="btn-secondary flex-1">
              Not Now
            </button>
            <button onClick={handleUpgrade} className="btn-primary flex-1">
              Upgrade to {tierName}
            </button>
          </div>

          {/* View All Tiers Link */}
          <p className="mt-4 text-sm text-gray-600">
            <a href="/pricing" className="underline hover:text-earth-brown">
              Compare all membership tiers
            </a>
          </p>
        </div>
      </Modal>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-${tierColor}-50 border border-${tierColor}-200 rounded-lg p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <LockIcon className="w-6 h-6 text-gray-500" />
          <div>
            <p className="font-semibold text-earth-brown">
              {tierName} Feature
            </p>
            <p className="text-sm text-earth-dark">
              {featureName} requires {tierName} membership
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onDismiss && (
            <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700">
              <XIcon className="w-5 h-5" />
            </button>
          )}
          <button onClick={handleUpgrade} className="btn-primary-sm">
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
      <LockIcon className="w-12 h-12 mx-auto mb-4 text-purple-400" />
      <h3 className="text-xl font-semibold text-earth-brown mb-2">
        Unlock {featureName}
      </h3>
      <p className="text-earth-dark mb-4">
        Available with {tierName} membership
      </p>
      <button onClick={handleUpgrade} className="btn-primary">
        Upgrade to {tierName} - ${pricing.monthly}/mo
      </button>
    </div>
  );
}
```

---

### 3. Tier Badge Component

**Location:** `components/badges/TierBadge.tsx`

**Purpose:** Display tier indicators throughout the UI

```tsx
interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
  showPrice?: boolean;
}

export function TierBadge({ tier, size = 'md', showPrice = false }: TierBadgeProps) {
  const name = getTierName(tier);
  const color = getTierColor(tier);
  const pricing = getTierPricing(tier);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold
        bg-${color}-100 text-${color}-800 ${sizeClasses[size]}`}
    >
      {tier === 'PLATINUM' && <StarIcon className="w-4 h-4" />}
      {name}
      {showPrice && pricing.monthly > 0 && (
        <span className="text-xs opacity-75">
          ${pricing.monthly}/mo
        </span>
      )}
    </span>
  );
}
```

---

### 4. Upgrade Prompt Component

**Location:** `components/prompts/UpgradePrompt.tsx`

**Purpose:** Contextual upgrade prompts shown in feature areas

```tsx
interface UpgradePromptProps {
  featureKey: string;
  title: string;
  description: string;
  benefits: string[];
  imageUrl?: string;
}

export function UpgradePrompt({
  featureKey,
  title,
  description,
  benefits,
  imageUrl
}: UpgradePromptProps) {
  const { hasAccess, requiredTier, currentTier } = useFeatureAccess(featureKey);
  const router = useRouter();

  // Don't show if user has access
  if (hasAccess) return null;

  const tierName = getTierName(requiredTier!);
  const pricing = getTierPricing(requiredTier!);

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 rounded-2xl p-8 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Image/Illustration */}
        {imageUrl && (
          <div className="order-2 md:order-1">
            <img
              src={imageUrl}
              alt={title}
              className="rounded-lg shadow-md w-full"
            />
          </div>
        )}

        {/* Right: Content */}
        <div className={imageUrl ? 'order-1 md:order-2' : 'col-span-2'}>
          {/* Tier Badge */}
          <TierBadge tier={requiredTier!} size="lg" showPrice />

          {/* Title */}
          <h3 className="text-3xl font-serif text-earth-brown mt-4 mb-3">
            {title}
          </h3>

          {/* Description */}
          <p className="text-lg text-earth-dark mb-6">
            {description}
          </p>

          {/* Benefits */}
          <ul className="space-y-3 mb-8">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-earth-dark">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push(`/pricing?upgrade=${requiredTier}&feature=${featureKey}`)}
              className="btn-primary text-lg"
            >
              Upgrade to {tierName} - ${pricing.monthly}/mo
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="btn-secondary"
            >
              Compare All Tiers
            </button>
          </div>

          {/* Fine Print */}
          <p className="mt-4 text-sm text-gray-600">
            Cancel anytime. No long-term commitment required.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 5. Feature Gate Wrapper Component

**Location:** `components/gates/FeatureGate.tsx`

**Purpose:** Wrap components to conditionally render based on tier access

```tsx
interface FeatureGateProps {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPaywall?: boolean;
}

export function FeatureGate({
  featureKey,
  children,
  fallback,
  showPaywall = true
}: FeatureGateProps) {
  const { hasAccess, requiredTier, isLoading } = useFeatureAccess(featureKey);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded" />;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access
  if (showPaywall) {
    return (
      <FeaturePaywall
        featureKey={featureKey}
        featureName={featureAccessRules[featureKey]?.name || 'This feature'}
        requiredTier={requiredTier!}
        currentTier={useSession().data?.user?.subscriptionTier || 'FREE'}
        variant="inline"
      />
    );
  }

  return <>{fallback || null}</>;
}

// Usage example:
<FeatureGate featureKey="practitioner_booking">
  <PractitionerBookingForm practitionerId={id} />
</FeatureGate>
```

---

## Implementation Details

### Phase 1: Database & Schema (Day 1, Morning)

1. Update Prisma schema with new models:
   - `Subscription`
   - `Payment`
   - `TierChangeLog`
   - `FeatureAccess`

2. Run database migration:
   ```bash
   npx prisma db push
   ```

3. Create seed script for feature access matrix:
   ```bash
   npx prisma db seed
   ```

4. Test database schema and relationships

---

### Phase 2: Access Control System (Day 1, Afternoon - Day 2)

1. Implement `lib/access-control.ts` utility functions
2. Create Next.js middleware for route protection
3. Build React hooks (`useFeatureAccess`, `useFeatureAccessBulk`)
4. Add API endpoints:
   - `/api/tiers/pricing`
   - `/api/tiers/comparison`
   - `/api/tiers/check-access`
5. Test access control logic thoroughly

---

### Phase 3: UI Components (Day 2, Afternoon - Day 3)

1. Build tier comparison page (`/pricing`)
2. Create reusable components:
   - `TierBadge`
   - `FeaturePaywall` (modal, banner, inline variants)
   - `UpgradePrompt`
   - `FeatureGate`
   - `TierCard`
3. Implement tier comparison table
4. Add mobile responsiveness
5. Style with biophilic design system

---

### Phase 4: Integration & Testing (Day 3, Afternoon)

1. Integrate paywalls throughout app:
   - Courses pages
   - Practitioner booking
   - Committee voting
   - Media upload
2. Add upgrade prompts contextually
3. Test all user flows:
   - Free user hitting paywalls
   - Tier comparison and upgrade
   - Access control enforcement
4. Test middleware protection
5. QA across devices

---

## Testing Requirements

### Unit Tests

```typescript
// Test access control utility
describe('checkFeatureAccess', () => {
  test('FREE tier can access free features', () => {
    const result = checkFeatureAccess('forum_view', 'FREE');
    expect(result.hasAccess).toBe(true);
  });

  test('FREE tier cannot access premium features', () => {
    const result = checkFeatureAccess('practitioner_booking', 'FREE');
    expect(result.hasAccess).toBe(false);
    expect(result.requiredTier).toBe('PREMIUM');
  });

  test('PLATINUM tier has access to all features', () => {
    const result = checkFeatureAccess('committee_lead', 'PLATINUM');
    expect(result.hasAccess).toBe(true);
  });
});

// Test tier comparison
describe('compareTiers', () => {
  test('PREMIUM is higher than BASIC', () => {
    expect(compareTiers('PREMIUM', 'BASIC')).toBeGreaterThan(0);
  });

  test('FREE is lower than PREMIUM', () => {
    expect(compareTiers('FREE', 'PREMIUM')).toBeLessThan(0);
  });
});
```

### Integration Tests

```typescript
// Test middleware protection
test('Middleware blocks FREE user from PREMIUM route', async () => {
  const req = createMockRequest('/dashboard/practitioners/book', { tier: 'FREE' });
  const res = await middleware(req);

  expect(res.status).toBe(302);
  expect(res.headers.get('Location')).toContain('/upgrade');
});

// Test API access check
test('POST /api/tiers/check-access returns correct results', async () => {
  const res = await fetch('/api/tiers/check-access', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${basicUserToken}` },
    body: JSON.stringify({ featureKeys: ['practitioner_booking'] })
  });

  const data = await res.json();
  expect(data.results.practitioner_booking.hasAccess).toBe(false);
  expect(data.results.practitioner_booking.requiredTier).toBe('PREMIUM');
});
```

### Manual Testing Checklist

- [ ] FREE user can access all free features
- [ ] FREE user sees paywalls on premium features
- [ ] BASIC user can access basic features
- [ ] PREMIUM user can access premium features
- [ ] PLATINUM user has full access
- [ ] Middleware blocks unauthorized route access
- [ ] Upgrade flow works end-to-end
- [ ] Tier comparison page displays correctly
- [ ] Paywall modals appear correctly
- [ ] Upgrade prompts are contextual
- [ ] Mobile responsive design works
- [ ] Feature gates hide/show content correctly
- [ ] Tier badges display with correct colors
- [ ] Pricing toggles between monthly/annual

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated with new models
- [ ] Database migrations tested in staging
- [ ] Feature access matrix seeded
- [ ] All API endpoints implemented
- [ ] Middleware configured correctly
- [ ] UI components tested across devices
- [ ] Access control thoroughly tested
- [ ] No hardcoded tier logic (all configurable)
- [ ] All tests passing

### Deployment Steps

1. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

2. **Environment Variables:**
   - Ensure Stripe API keys configured (for F011 integration)
   - Set active contract version for middleware

3. **Deploy Application:**
   ```bash
   npm run build
   npm run deploy
   ```

4. **Smoke Tests:**
   - Test tier comparison page loads
   - Test paywall appears for FREE user
   - Test upgrade flow (use test payment method)
   - Verify middleware blocks protected routes

### Post-Deployment

- [ ] All four tiers visible on pricing page
- [ ] Feature access rules enforced correctly
- [ ] Paywalls appearing at correct boundaries
- [ ] Middleware blocking unauthorized access
- [ ] No console errors on any tier
- [ ] Analytics tracking upgrade conversions
- [ ] Monitor Stripe webhooks for payment events
- [ ] Check database for proper tier assignments

---

## Future Enhancements

1. **Dynamic Feature Flags:** Allow admins to toggle feature access without code changes
2. **A/B Testing:** Test different pricing models and upgrade prompts
3. **Tier Benefits Animation:** Interactive animations showing tier benefits
4. **Referral Rewards:** Give tier discounts for user referrals
5. **Trial Periods:** 7-day free trial for PREMIUM tier
6. **Usage Analytics:** Track which premium features drive most upgrades
7. **Custom Tiers:** Allow custom enterprise tiers for large groups
8. **Tier Bundling:** Family/group plans with shared benefits
9. **Loyalty Rewards:** Discounts for long-term members
10. **Seasonal Promotions:** Limited-time pricing offers

---

## Success Metrics & Analytics

Track the following metrics to measure feature success:

### Conversion Metrics
- Pricing page visit → upgrade conversion rate
- Paywall impression → upgrade conversion rate
- Feature-specific conversion rates (which features drive upgrades)
- Average time from signup to first upgrade
- Upgrade funnel drop-off points

### Revenue Metrics
- Monthly Recurring Revenue (MRR) by tier
- Annual Recurring Revenue (ARR)
- Average Revenue Per User (ARPU)
- Lifetime Value (LTV) by acquisition cohort
- Churn rate by tier

### Engagement Metrics
- Feature usage by tier
- Premium feature adoption rate post-upgrade
- Paywall dismissal rate (how often users dismiss without upgrading)
- Tier comparison page bounce rate

### Support Metrics
- Support tickets related to tier confusion
- Feature access error rate
- Payment failure rate by tier

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
