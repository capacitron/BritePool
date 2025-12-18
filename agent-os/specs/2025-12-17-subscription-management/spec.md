# Specification: Subscription Management System

**Feature ID:** F011
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** Stripe Payment Integration (F010), User Authentication (F002)
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
Implement a comprehensive subscription management system that enables members to subscribe to membership tiers, event tickets, and practitioner services. The system provides self-service management (upgrade, downgrade, cancel), admin tools for managing subscriptions and refunds, and robust status tracking with grace periods and dunning management for failed payments.

### Key Requirements
- **Subscription Types:**
  - Membership tiers (FREE, BASIC, PREMIUM, PLATINUM)
  - Event tickets and passes (one-time and recurring)
  - Practitioner services (monthly bookings)
- **Self-Service Portal:**
  - Tier comparison page with feature matrix
  - One-click upgrade/downgrade flows
  - Cancellation workflow with feedback collection
  - View subscription history and upcoming renewals
- **Status Tracking:**
  - ACTIVE: Subscription in good standing
  - PAST_DUE: Payment failed, in grace period
  - CANCELLED: User or admin cancelled
  - INACTIVE: Never subscribed or expired
- **Grace Periods & Dunning:**
  - 7-day grace period for failed payments
  - Automated retry schedule (3, 5, 7 days)
  - Email notifications at each retry attempt
  - Automatic downgrade to FREE after grace period expires
- **Admin Dashboard:**
  - View all subscriptions with filtering
  - Process refunds (full or partial)
  - View payment history and transaction logs
  - Manual subscription adjustments
  - Dunning management and retry controls

### Success Metrics
- 95% successful payment processing rate
- Zero unauthorized subscription changes
- Complete payment history audit trail
- Automated grace period and dunning processes functional
- Users can self-manage subscriptions without support intervention
- Admin can process refunds and adjustments efficiently

---

## User Flows

### Flow 1: New User - Subscribe to Membership Tier

```
1. User logs in and navigates to /dashboard
2. Dashboard shows "FREE" tier badge and "Upgrade" CTA
3. User clicks "Upgrade Membership" button
4. Redirected to /subscriptions/tiers
5. User sees tier comparison table:
   - FREE: Basic access (current tier - highlighted)
   - BASIC: $29/month or $290/year (save $58)
   - PREMIUM: $79/month or $790/year (save $158)
   - PLATINUM: $199/month or $1990/year (save $398)
6. Each tier shows feature list with checkmarks/X marks
7. User clicks "Select Plan" on PREMIUM tier
8. Redirected to /subscriptions/checkout?tier=PREMIUM&billing=monthly
9. Stripe Checkout embedded form loads
10. User enters payment details (card or ACH)
11. User confirms subscription
12. POST /api/subscriptions/create → Creates Stripe subscription
13. Webhook received: subscription.created
14. Database updated: User.subscriptionTier = PREMIUM, User.subscriptionStatus = ACTIVE
15. User redirected to /subscriptions/success
16. Confirmation email sent with receipt and subscription details
17. Dashboard now shows PREMIUM badge and tier benefits
```

### Flow 2: Existing Subscriber - Upgrade Tier

```
1. User with BASIC tier navigates to /subscriptions/manage
2. Sees current subscription card:
   - BASIC - $29/month
   - Next billing date: Jan 15, 2026
   - Payment method: •••• 4242
   - Status: ACTIVE
3. User clicks "Change Plan" button
4. Redirected to /subscriptions/tiers?current=BASIC
5. Tier comparison shows BASIC as current (highlighted)
6. User selects PREMIUM tier
7. Modal appears: "Upgrade to PREMIUM?"
   - "You'll be charged a prorated amount of $X today"
   - "Your next full billing cycle starts on [date]"
   - "Monthly cost will change from $29 to $79"
8. User confirms upgrade
9. POST /api/subscriptions/upgrade
   - Calls Stripe subscription.update() with proration
   - Updates User.subscriptionTier = PREMIUM
10. Confirmation shown: "Successfully upgraded to PREMIUM"
11. Email sent with upgrade confirmation and updated receipt
12. User gains immediate access to PREMIUM features
```

### Flow 3: Subscriber Downgrades Tier

```
1. User with PREMIUM tier navigates to /subscriptions/manage
2. User clicks "Change Plan" button
3. User selects BASIC tier
4. Modal appears: "Downgrade to BASIC?"
   - "Your downgrade will take effect at the end of current billing period: Jan 15, 2026"
   - "You'll keep PREMIUM access until then"
   - "After Jan 15, your monthly cost will be $29"
   - "Features you'll lose: [list]"
5. User confirms downgrade
6. POST /api/subscriptions/downgrade
   - Calls Stripe subscription.update() with at_period_end=true
   - Creates SubscriptionChange record with effectiveDate
7. Subscription status updated to show "Downgrade scheduled for Jan 15"
8. Email sent confirming scheduled downgrade
9. On Jan 15, webhook received: customer.subscription.updated
10. Database updated: User.subscriptionTier = BASIC
11. Email sent: "Your subscription has been downgraded to BASIC"
```

### Flow 4: User Cancels Subscription

```
1. User navigates to /subscriptions/manage
2. User clicks "Cancel Subscription" link (bottom of page)
3. Redirected to /subscriptions/cancel
4. Page shows:
   - "Are you sure you want to cancel?"
   - Current tier benefits summary
   - "Your access will continue until [end of billing period]"
   - Feedback form: "Why are you cancelling?" (optional)
     - Options: Too expensive, Not using features, Found alternative, etc.
5. User selects reason and adds optional comment
6. User clicks "Confirm Cancellation"
7. POST /api/subscriptions/cancel
   - Calls Stripe subscription.cancel() with at_period_end=true
   - Updates User.subscriptionStatus = CANCELLED
   - Logs cancellation reason in database
8. Confirmation page: "Subscription cancelled"
   - "You'll keep access until [date]"
   - "We'd love to have you back - here's 20% off if you return within 90 days"
9. Email sent with cancellation confirmation
10. On end date, webhook received: customer.subscription.deleted
11. User.subscriptionTier = FREE
12. Email sent: "Your subscription has ended"
```

### Flow 5: Payment Failure & Dunning Process

```
1. Stripe attempts to charge user on renewal date
2. Payment fails (insufficient funds, expired card, etc.)
3. Webhook received: invoice.payment_failed
4. POST /api/webhooks/stripe processes webhook
5. Database updated:
   - User.subscriptionStatus = PAST_DUE
   - PaymentAttempt record created with failureReason
6. Email sent immediately: "Payment Failed - Action Required"
   - "Your subscription payment of $79 failed"
   - "We'll retry in 3 days"
   - "Update your payment method: [link]"
7. Day 3: Stripe auto-retries payment
   - If successful → Status back to ACTIVE
   - If fails → Email sent: "Payment Failed - Retry 1 of 3"
8. Day 5: Second retry attempt
   - If fails → Email sent: "Payment Failed - Retry 2 of 3"
9. Day 7: Final retry attempt
   - If successful → Status back to ACTIVE
   - If fails → Email sent: "Payment Failed - Subscription Suspended"
   - User.subscriptionStatus = CANCELLED
   - User.subscriptionTier = FREE (downgraded)
   - Access to premium features removed
10. User must re-subscribe to regain access
```

### Flow 6: User Updates Payment Method

```
1. User with PAST_DUE status receives email notification
2. User clicks "Update Payment Method" link in email
3. Redirected to /subscriptions/payment-method
4. Current payment method shown (if exists): •••• 4242 (Expires 12/25)
5. "Update Payment Method" button displayed
6. Stripe Payment Element embedded form loads
7. User enters new card details
8. User clicks "Save Payment Method"
9. POST /api/subscriptions/update-payment-method
   - Calls Stripe paymentMethod.attach()
   - Sets as default payment method for customer
10. Confirmation: "Payment method updated successfully"
11. If subscription is PAST_DUE:
    - Stripe immediately retries payment
    - If successful → Status changes to ACTIVE
    - Email sent: "Payment successful - subscription reactivated"
```

### Flow 7: Admin Reviews Subscription Dashboard

```
1. Admin (WEB_STEWARD role) navigates to /admin/subscriptions
2. Dashboard shows key metrics:
   - Total Active Subscriptions: 247
   - Monthly Recurring Revenue (MRR): $15,830
   - Past Due: 12
   - Cancelled This Month: 8
   - Churn Rate: 3.2%
3. Filterable subscription list table:
   - Columns: User, Email, Tier, Status, Next Billing, MRR, Actions
   - Filters: Status, Tier, Billing Frequency
   - Search by user name or email
4. Admin sees user in PAST_DUE status
5. Admin clicks user row to expand details:
   - Subscription history timeline
   - Payment attempts log (3 failures shown)
   - Last 4 invoices
   - "Retry Payment" button
   - "Cancel Subscription" button
   - "Issue Refund" button
6. Admin can take manual actions as needed
```

### Flow 8: Admin Processes Refund

```
1. Admin navigates to /admin/subscriptions
2. Admin searches for user by email
3. Admin clicks on user subscription row
4. Admin clicks "Issue Refund" button
5. Refund modal appears:
   - Last payment: $79.00 on Dec 15, 2025
   - Refund amount: $79.00 (editable for partial refund)
   - Reason (required): Dropdown with options
   - Internal notes (optional): Text field
6. Admin enters refund amount ($40 partial refund)
7. Admin selects reason: "Service issue"
8. Admin adds note: "Refunded due to event cancellation"
9. Admin clicks "Process Refund"
10. POST /api/admin/subscriptions/refund
    - Calls Stripe refund.create()
    - Creates RefundRecord in database
    - Logs admin action in audit trail
11. Confirmation: "Refund of $40 processed successfully"
12. Email sent to user with refund confirmation
13. Refund appears in user's payment history
14. Admin audit log updated
```

---

## Database Schema

### Existing Models (from Prisma schema)

```prisma
model User {
  // ... other fields
  subscriptionTier    SubscriptionTier @default(FREE)
  subscriptionStatus  SubscriptionStatus @default(INACTIVE)

  // Relations
  subscriptions       Subscription[]
  paymentMethods      PaymentMethod[]
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

### New Models to Add

```prisma
model Subscription {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Stripe Integration
  stripeSubscriptionId String  @unique
  stripeCustomerId     String
  stripePriceId        String

  // Subscription Details
  tier                SubscriptionTier
  status              SubscriptionStatus @default(INACTIVE)
  billingInterval     BillingInterval    // MONTHLY or ANNUAL

  // Pricing
  amount              Float              // In dollars (e.g., 79.00)
  currency            String @default("USD")

  // Dates
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  cancelAt            DateTime?          // If scheduled cancellation
  canceledAt          DateTime?          // When actually cancelled
  trialStart          DateTime?
  trialEnd            DateTime?

  // Metadata
  cancelReason        String?
  cancelFeedback      String?

  // Relations
  invoices            Invoice[]
  paymentAttempts     PaymentAttempt[]
  subscriptionChanges SubscriptionChange[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([stripeSubscriptionId])
}

model Invoice {
  id                  String   @id @default(cuid())
  subscriptionId      String
  subscription        Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  // Stripe Integration
  stripeInvoiceId     String   @unique
  stripePaymentIntentId String?

  // Invoice Details
  amount              Float
  currency            String @default("USD")
  status              InvoiceStatus

  // Dates
  periodStart         DateTime
  periodEnd           DateTime
  dueDate             DateTime?
  paidAt              DateTime?

  // PDF
  invoicePdfUrl       String?

  // Relations
  refunds             Refund[]

  createdAt           DateTime @default(now())

  @@index([subscriptionId])
  @@index([status])
  @@index([stripeInvoiceId])
}

model PaymentMethod {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Stripe Integration
  stripePaymentMethodId String @unique

  // Card Details (masked)
  type                String   // "card", "ach_debit", etc.
  brand               String?  // "visa", "mastercard", etc.
  last4               String
  expiryMonth         Int?
  expiryYear          Int?

  // Status
  isDefault           Boolean  @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
  @@index([stripePaymentMethodId])
}

model PaymentAttempt {
  id                  String   @id @default(cuid())
  subscriptionId      String
  subscription        Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  // Attempt Details
  attemptNumber       Int      // 1, 2, 3 (for dunning retries)
  status              PaymentAttemptStatus
  amount              Float
  currency            String @default("USD")

  // Failure Details
  failureCode         String?
  failureMessage      String?

  // Stripe
  stripePaymentIntentId String?

  attemptedAt         DateTime @default(now())

  @@index([subscriptionId])
  @@index([status])
}

model SubscriptionChange {
  id                  String   @id @default(cuid())
  subscriptionId      String
  subscription        Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  // Change Details
  changeType          SubscriptionChangeType // UPGRADE, DOWNGRADE, CANCEL, REACTIVATE
  fromTier            SubscriptionTier?
  toTier              SubscriptionTier?

  // Timing
  requestedAt         DateTime @default(now())
  effectiveDate       DateTime // When change takes effect
  processedAt         DateTime?

  // Metadata
  reason              String?
  initiatedBy         String   // "user" or admin user ID

  @@index([subscriptionId])
  @@index([effectiveDate])
}

model Refund {
  id                  String   @id @default(cuid())
  invoiceId           String
  invoice             Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  // Stripe Integration
  stripeRefundId      String   @unique

  // Refund Details
  amount              Float
  currency            String @default("USD")
  status              RefundStatus
  reason              String?
  internalNotes       String?

  // Admin
  processedBy         String   // Admin user ID

  createdAt           DateTime @default(now())

  @@index([invoiceId])
  @@index([stripeRefundId])
}

// Enums

enum BillingInterval {
  MONTHLY
  ANNUAL
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}

enum PaymentAttemptStatus {
  PENDING
  SUCCESS
  FAILED
  RETRYING
}

enum SubscriptionChangeType {
  UPGRADE
  DOWNGRADE
  CANCEL
  REACTIVATE
}

enum RefundStatus {
  PENDING
  SUCCEEDED
  FAILED
  CANCELLED
}
```

---

## API Endpoints

### 1. GET /api/subscriptions/tiers

**Purpose:** Get all available subscription tiers with pricing and features

**Authentication:** Optional (shows different CTAs based on auth status)

**Response:**
```json
{
  "tiers": [
    {
      "id": "FREE",
      "name": "Free Steward",
      "description": "Basic access to community features",
      "monthlyPrice": 0,
      "annualPrice": 0,
      "features": [
        { "name": "Forum access", "included": true },
        { "name": "Event calendar view", "included": true },
        { "name": "Basic course library", "included": true },
        { "name": "Premium courses", "included": false },
        { "name": "Practitioner bookings", "included": false },
        { "name": "Priority support", "included": false }
      ]
    },
    {
      "id": "BASIC",
      "name": "Basic Member",
      "description": "Enhanced access with premium content",
      "monthlyPrice": 29.00,
      "annualPrice": 290.00,
      "stripePriceIdMonthly": "price_basic_monthly",
      "stripePriceIdAnnual": "price_basic_annual",
      "features": [
        { "name": "Forum access", "included": true },
        { "name": "Event calendar view", "included": true },
        { "name": "Basic course library", "included": true },
        { "name": "Premium courses", "included": true },
        { "name": "Practitioner bookings", "included": false },
        { "name": "Priority support", "included": false }
      ]
    },
    {
      "id": "PREMIUM",
      "name": "Premium Member",
      "description": "Full access with practitioner services",
      "monthlyPrice": 79.00,
      "annualPrice": 790.00,
      "stripePriceIdMonthly": "price_premium_monthly",
      "stripePriceIdAnnual": "price_premium_annual",
      "popular": true,
      "features": [
        { "name": "Forum access", "included": true },
        { "name": "Event calendar view", "included": true },
        { "name": "Basic course library", "included": true },
        { "name": "Premium courses", "included": true },
        { "name": "Practitioner bookings", "included": true },
        { "name": "Priority support", "included": true }
      ]
    },
    {
      "id": "PLATINUM",
      "name": "Platinum Member",
      "description": "VIP access with unlimited services",
      "monthlyPrice": 199.00,
      "annualPrice": 1990.00,
      "stripePriceIdMonthly": "price_platinum_monthly",
      "stripePriceIdAnnual": "price_platinum_annual",
      "features": [
        { "name": "Forum access", "included": true },
        { "name": "Event calendar view", "included": true },
        { "name": "Basic course library", "included": true },
        { "name": "Premium courses", "included": true },
        { "name": "Practitioner bookings", "included": true },
        { "name": "Priority support", "included": true },
        { "name": "1-on-1 wellness coaching", "included": true },
        { "name": "Exclusive retreat access", "included": true }
      ]
    }
  ]
}
```

---

### 2. POST /api/subscriptions/create

**Purpose:** Create a new subscription for the user

**Authentication:** Required

**Request Body:**
```json
{
  "tier": "PREMIUM",
  "billingInterval": "MONTHLY",
  "stripePriceId": "price_premium_monthly",
  "successUrl": "/subscriptions/success",
  "cancelUrl": "/subscriptions/tiers"
}
```

**Logic:**
1. Verify user is authenticated
2. Check user doesn't already have active subscription
3. Create or retrieve Stripe Customer
4. Create Stripe Checkout Session with:
   - Selected price ID
   - Success/cancel URLs
   - Customer email prefilled
   - Subscription mode
5. Return checkout session URL

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_123..."
}
```

**Error Cases:**
- User not authenticated → 401
- User already has active subscription → 400
- Invalid tier or price ID → 400
- Stripe API error → 500

---

### 3. GET /api/subscriptions/current

**Purpose:** Get current user's active subscription details

**Authentication:** Required

**Response:**
```json
{
  "subscription": {
    "id": "sub_123",
    "tier": "PREMIUM",
    "status": "ACTIVE",
    "billingInterval": "MONTHLY",
    "amount": 79.00,
    "currency": "USD",
    "currentPeriodStart": "2025-12-15T00:00:00Z",
    "currentPeriodEnd": "2026-01-15T00:00:00Z",
    "cancelAt": null,
    "paymentMethod": {
      "type": "card",
      "brand": "visa",
      "last4": "4242",
      "expiryMonth": 12,
      "expiryYear": 2027
    }
  },
  "upcomingInvoice": {
    "amount": 79.00,
    "dueDate": "2026-01-15T00:00:00Z"
  }
}
```

**If no subscription:**
```json
{
  "subscription": null
}
```

---

### 4. POST /api/subscriptions/upgrade

**Purpose:** Upgrade to a higher tier with proration

**Authentication:** Required

**Request Body:**
```json
{
  "newTier": "PLATINUM",
  "newPriceId": "price_platinum_monthly"
}
```

**Logic:**
1. Verify user has active subscription
2. Verify new tier is higher than current tier
3. Call Stripe subscription.update() with:
   - New price ID
   - proration_behavior: "create_prorations"
4. Calculate prorated charge
5. Update User.subscriptionTier
6. Create SubscriptionChange record
7. Send confirmation email

**Response:**
```json
{
  "success": true,
  "subscription": { /* updated subscription object */ },
  "prorationAmount": 35.50,
  "effectiveImmediately": true
}
```

---

### 5. POST /api/subscriptions/downgrade

**Purpose:** Downgrade to a lower tier at end of billing period

**Authentication:** Required

**Request Body:**
```json
{
  "newTier": "BASIC",
  "newPriceId": "price_basic_monthly"
}
```

**Logic:**
1. Verify user has active subscription
2. Verify new tier is lower than current tier
3. Call Stripe subscription.update() with:
   - New price ID
   - proration_behavior: "none"
   - billing_cycle_anchor: "unchanged"
4. Create SubscriptionChange record with effectiveDate = currentPeriodEnd
5. Send confirmation email

**Response:**
```json
{
  "success": true,
  "currentTier": "PREMIUM",
  "newTier": "BASIC",
  "effectiveDate": "2026-01-15T00:00:00Z",
  "message": "Your subscription will downgrade to BASIC on Jan 15, 2026"
}
```

---

### 6. POST /api/subscriptions/cancel

**Purpose:** Cancel subscription (effective at end of billing period)

**Authentication:** Required

**Request Body:**
```json
{
  "reason": "too_expensive",
  "feedback": "Great service but can't afford right now"
}
```

**Logic:**
1. Verify user has active subscription
2. Call Stripe subscription.update() with cancel_at_period_end: true
3. Update subscription status (still ACTIVE until period ends)
4. Store cancellation reason and feedback
5. Create SubscriptionChange record
6. Send cancellation confirmation email

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled. Access continues until Jan 15, 2026",
  "accessUntil": "2026-01-15T00:00:00Z"
}
```

---

### 7. POST /api/subscriptions/reactivate

**Purpose:** Reactivate a cancelled subscription before period ends

**Authentication:** Required

**Request:** No body required

**Logic:**
1. Verify user has cancelled subscription (cancelAt is set but hasn't passed yet)
2. Call Stripe subscription.update() with cancel_at_period_end: false
3. Remove cancelAt date
4. Update subscription status to ACTIVE
5. Create SubscriptionChange record
6. Send reactivation confirmation email

**Response:**
```json
{
  "success": true,
  "message": "Subscription reactivated successfully",
  "subscription": { /* updated subscription object */ }
}
```

---

### 8. POST /api/subscriptions/update-payment-method

**Purpose:** Update default payment method for subscription

**Authentication:** Required

**Request Body:**
```json
{
  "stripePaymentMethodId": "pm_123456789"
}
```

**Logic:**
1. Verify user is authenticated
2. Verify payment method belongs to user's Stripe customer
3. Call Stripe customer.update() to set default payment method
4. Update PaymentMethod records in database
5. If subscription is PAST_DUE, trigger immediate payment retry
6. Send confirmation email

**Response:**
```json
{
  "success": true,
  "paymentMethod": {
    "type": "card",
    "brand": "visa",
    "last4": "5555",
    "expiryMonth": 8,
    "expiryYear": 2028
  }
}
```

---

### 9. GET /api/subscriptions/payment-history

**Purpose:** Get user's payment history and invoices

**Authentication:** Required

**Query Parameters:**
- `limit` (default: 10)
- `offset` (default: 0)

**Response:**
```json
{
  "invoices": [
    {
      "id": "inv_123",
      "amount": 79.00,
      "currency": "USD",
      "status": "PAID",
      "paidAt": "2025-12-15T10:30:00Z",
      "periodStart": "2025-12-15T00:00:00Z",
      "periodEnd": "2026-01-15T00:00:00Z",
      "invoicePdfUrl": "https://invoice.stripe.com/i/..."
    }
  ],
  "total": 5,
  "hasMore": false
}
```

---

### 10. POST /api/webhooks/stripe

**Purpose:** Handle Stripe webhook events

**Authentication:** Stripe signature verification

**Supported Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

**Logic:**

**invoice.payment_failed:**
```typescript
1. Extract subscription ID and customer ID
2. Find Subscription record in database
3. Update status to PAST_DUE
4. Create PaymentAttempt record with failure details
5. Determine retry attempt number (check previous attempts)
6. Send email based on attempt:
   - Attempt 1: "Payment failed - we'll retry in 3 days"
   - Attempt 2: "Payment failed - retry 2 of 3"
   - Attempt 3: "Final payment attempt failed"
7. If 3rd attempt failed:
   - Cancel subscription
   - Downgrade user to FREE tier
   - Send "Subscription suspended" email
```

**invoice.payment_succeeded:**
```typescript
1. Extract subscription and invoice details
2. Create/update Invoice record
3. Update subscription status to ACTIVE (if was PAST_DUE)
4. Send receipt email with PDF link
```

**customer.subscription.deleted:**
```typescript
1. Find Subscription record
2. Update status to CANCELLED
3. Update User.subscriptionTier = FREE
4. Update User.subscriptionStatus = INACTIVE
5. Send "Subscription ended" email
```

**Response:**
```json
{ "received": true }
```

---

### Admin Endpoints

### 11. GET /api/admin/subscriptions

**Purpose:** Get all subscriptions with filtering and pagination (Admin only)

**Authentication:** Required, Role: WEB_STEWARD or BOARD_CHAIR

**Query Parameters:**
- `status` (ACTIVE, PAST_DUE, CANCELLED, INACTIVE)
- `tier` (FREE, BASIC, PREMIUM, PLATINUM)
- `search` (user name or email)
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "subscriptions": [
    {
      "id": "sub_123",
      "user": {
        "id": "user_123",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "tier": "PREMIUM",
      "status": "ACTIVE",
      "billingInterval": "MONTHLY",
      "amount": 79.00,
      "currentPeriodEnd": "2026-01-15T00:00:00Z",
      "createdAt": "2025-06-15T00:00:00Z"
    }
  ],
  "metrics": {
    "totalActive": 247,
    "totalPastDue": 12,
    "totalCancelled": 8,
    "mrr": 15830.00,
    "arr": 189960.00,
    "churnRate": 3.2
  },
  "total": 267,
  "hasMore": true
}
```

---

### 12. POST /api/admin/subscriptions/[id]/refund

**Purpose:** Process a refund for a subscription payment (Admin only)

**Authentication:** Required, Role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "invoiceId": "inv_123",
  "amount": 79.00,
  "reason": "service_issue",
  "internalNotes": "Refunded due to event cancellation"
}
```

**Logic:**
1. Verify admin permissions
2. Verify invoice exists and belongs to subscription
3. Verify invoice is paid (status: PAID)
4. Call Stripe refund.create()
5. Create Refund record with admin details
6. Log action in admin audit trail
7. Send refund confirmation email to user

**Response:**
```json
{
  "success": true,
  "refund": {
    "id": "ref_123",
    "amount": 79.00,
    "status": "SUCCEEDED",
    "createdAt": "2025-12-18T14:30:00Z"
  }
}
```

---

### 13. POST /api/admin/subscriptions/[id]/retry-payment

**Purpose:** Manually trigger payment retry for PAST_DUE subscription (Admin only)

**Authentication:** Required, Role: WEB_STEWARD or BOARD_CHAIR

**Request:** No body required

**Logic:**
1. Verify admin permissions
2. Verify subscription exists and is PAST_DUE
3. Get latest unpaid invoice from Stripe
4. Call Stripe invoice.pay() to retry payment
5. Create PaymentAttempt record
6. Update subscription status based on result
7. Send email to user with result

**Response:**
```json
{
  "success": true,
  "paymentStatus": "SUCCEEDED",
  "message": "Payment retry successful - subscription reactivated"
}
```

---

### 14. POST /api/admin/subscriptions/[id]/cancel

**Purpose:** Admin cancel subscription immediately (Admin only)

**Authentication:** Required, Role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "reason": "fraud",
  "internalNotes": "User requested via support ticket #1234",
  "immediate": true
}
```

**Logic:**
1. Verify admin permissions
2. Call Stripe subscription.cancel() with at_period_end: false
3. Update subscription status to CANCELLED
4. Downgrade user to FREE tier immediately
5. Log admin action with details
6. Send cancellation notification to user

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled immediately"
}
```

---

## UI Components

### 1. Tier Comparison Page

**Location:** `app/(dashboard)/subscriptions/tiers/page.tsx`

**Features:**
- Responsive 4-column grid (stacks on mobile)
- Each tier card shows:
  - Tier name and tagline
  - Monthly and annual pricing with savings badge
  - Feature list with checkmarks/X marks
  - "Current Plan" badge if user on that tier
  - "Select Plan" or "Upgrade" CTA button
- Billing toggle (Monthly / Annual) with savings highlight
- FAQ accordion at bottom

**Component Structure:**

```tsx
export default function TierComparisonPage() {
  const { data: session } = useSession();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const { data: tiers } = useTiers();
  const currentTier = session?.user?.subscriptionTier || 'FREE';

  const handleSelectPlan = async (tier: string) => {
    if (tier === currentTier) return;

    const priceId = billingInterval === 'monthly'
      ? tier.stripePriceIdMonthly
      : tier.stripePriceIdAnnual;

    const res = await fetch('/api/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify({
        tier: tier.id,
        billingInterval: billingInterval.toUpperCase(),
        stripePriceId: priceId
      })
    });

    const { checkoutUrl } = await res.json();
    window.location.href = checkoutUrl;
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-earth-brown mb-4">
          Choose Your Membership Tier
        </h1>
        <p className="text-lg text-earth-dark max-w-2xl mx-auto">
          All members must accept the covenant. Select the tier that best fits your journey.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4 mb-8">
        <span className={billingInterval === 'monthly' ? 'font-semibold' : 'text-earth-dark'}>
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(prev => prev === 'monthly' ? 'annual' : 'monthly')}
          className="relative w-14 h-7 bg-stone rounded-full"
        >
          <div className={`absolute w-5 h-5 bg-earth-brown rounded-full top-1 transition-transform ${
            billingInterval === 'annual' ? 'translate-x-8' : 'translate-x-1'
          }`} />
        </button>
        <span className={billingInterval === 'annual' ? 'font-semibold' : 'text-earth-dark'}>
          Annual
          <span className="ml-2 text-sm bg-earth-accent text-white px-2 py-1 rounded">
            Save 20%
          </span>
        </span>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {tiers?.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            billingInterval={billingInterval}
            isCurrentTier={tier.id === currentTier}
            onSelect={() => handleSelectPlan(tier.id)}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-serif text-earth-brown mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <FAQAccordion items={subscriptionFAQ} />
      </div>
    </div>
  );
}
```

**TierCard Component:**

```tsx
function TierCard({ tier, billingInterval, isCurrentTier, onSelect }) {
  const price = billingInterval === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
  const savings = billingInterval === 'annual'
    ? (tier.monthlyPrice * 12 - tier.annualPrice)
    : 0;

  return (
    <div className={`
      border-2 rounded-lg p-6 flex flex-col
      ${tier.popular ? 'border-earth-brown shadow-lg scale-105' : 'border-stone'}
      ${isCurrentTier ? 'bg-earth-light' : 'bg-white'}
    `}>
      {tier.popular && (
        <div className="bg-earth-brown text-white text-sm font-semibold px-3 py-1 rounded-full mb-4 text-center">
          Most Popular
        </div>
      )}

      {isCurrentTier && (
        <div className="bg-stone text-earth-brown text-sm font-semibold px-3 py-1 rounded-full mb-4 text-center">
          Current Plan
        </div>
      )}

      <h3 className="text-2xl font-serif text-earth-brown mb-2">
        {tier.name}
      </h3>

      <p className="text-earth-dark text-sm mb-4">
        {tier.description}
      </p>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-earth-brown">
            ${price}
          </span>
          <span className="text-earth-dark">
            /{billingInterval === 'monthly' ? 'mo' : 'yr'}
          </span>
        </div>
        {savings > 0 && (
          <p className="text-sm text-earth-accent mt-1">
            Save ${savings}/year
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-grow">
        {tier.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2">
            {feature.included ? (
              <CheckIcon className="w-5 h-5 text-earth-accent flex-shrink-0 mt-0.5" />
            ) : (
              <XIcon className="w-5 h-5 text-stone-dark flex-shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? 'text-earth-dark' : 'text-stone-dark line-through'}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrentTier}
        className={`
          w-full py-3 rounded-lg font-semibold transition-colors
          ${isCurrentTier
            ? 'bg-stone text-stone-dark cursor-not-allowed'
            : 'bg-earth-brown text-white hover:bg-earth-brown-dark'
          }
        `}
      >
        {isCurrentTier ? 'Current Plan' : 'Select Plan'}
      </button>
    </div>
  );
}
```

---

### 2. Subscription Management Page

**Location:** `app/(dashboard)/subscriptions/manage/page.tsx`

**Features:**
- Current subscription overview card
- Payment method card with update option
- Billing history table
- Change plan button
- Cancel subscription link (subtle, bottom of page)

**Component Structure:**

```tsx
export default function ManageSubscriptionPage() {
  const { data: subscription } = useSubscription();
  const { data: invoices } = useInvoices();

  if (!subscription) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-serif text-earth-brown mb-4">
            No Active Subscription
          </h1>
          <p className="text-earth-dark mb-8">
            You're currently on the Free tier. Upgrade to unlock premium features.
          </p>
          <Link href="/subscriptions/tiers">
            <button className="btn-primary">
              View Membership Tiers
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-serif text-earth-brown mb-8">
        Manage Subscription
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Subscription Card */}
        <SubscriptionOverviewCard subscription={subscription} />

        {/* Payment Method Card */}
        <PaymentMethodCard paymentMethod={subscription.paymentMethod} />
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg border border-stone p-6 mb-8">
        <h2 className="text-xl font-serif text-earth-brown mb-4">
          Billing History
        </h2>
        <InvoiceTable invoices={invoices} />
      </div>

      {/* Cancel Link */}
      <div className="text-center">
        <Link
          href="/subscriptions/cancel"
          className="text-sm text-stone-dark hover:text-earth-brown underline"
        >
          Cancel subscription
        </Link>
      </div>
    </div>
  );
}
```

**SubscriptionOverviewCard Component:**

```tsx
function SubscriptionOverviewCard({ subscription }) {
  const router = useRouter();

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAST_DUE: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg border border-stone p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-earth-brown">
            {subscription.tier} Membership
          </h3>
          <p className="text-earth-dark">
            ${subscription.amount}/{subscription.billingInterval.toLowerCase()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[subscription.status]}`}>
          {subscription.status}
        </span>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-stone-dark">Next billing date</span>
          <span className="text-earth-dark font-medium">
            {formatDate(subscription.currentPeriodEnd)}
          </span>
        </div>

        {subscription.cancelAt && (
          <div className="flex justify-between text-sm">
            <span className="text-stone-dark">Cancels on</span>
            <span className="text-red-600 font-medium">
              {formatDate(subscription.cancelAt)}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/subscriptions/tiers')}
          className="flex-1 py-2 bg-earth-brown text-white rounded-lg hover:bg-earth-brown-dark transition-colors"
        >
          Change Plan
        </button>

        {subscription.cancelAt && (
          <button
            onClick={() => handleReactivate()}
            className="flex-1 py-2 border-2 border-earth-brown text-earth-brown rounded-lg hover:bg-earth-light transition-colors"
          >
            Reactivate
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### 3. Cancellation Page

**Location:** `app/(dashboard)/subscriptions/cancel/page.tsx`

**Features:**
- Confirmation warning
- Benefits summary of what user will lose
- Feedback form with predefined reasons
- Optional comment field
- "Confirm Cancellation" button (prominent)
- "Keep My Subscription" button (secondary)

**Component Structure:**

```tsx
export default function CancelSubscriptionPage() {
  const { data: subscription } = useSubscription();
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    setIsSubmitting(true);

    const res = await fetch('/api/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason, feedback })
    });

    if (res.ok) {
      router.push('/subscriptions/cancelled');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <div className="text-center mb-8">
        <AlertTriangleIcon className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
        <h1 className="text-3xl font-serif text-earth-brown mb-2">
          Cancel Your Subscription?
        </h1>
        <p className="text-earth-dark">
          We're sorry to see you go. Your subscription will remain active until the end of your billing period.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-earth-brown mb-3">
          You'll lose access to:
        </h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-earth-dark">
            <XCircleIcon className="w-5 h-5 text-red-500" />
            Premium course library
          </li>
          <li className="flex items-center gap-2 text-earth-dark">
            <XCircleIcon className="w-5 h-5 text-red-500" />
            Practitioner booking services
          </li>
          <li className="flex items-center gap-2 text-earth-dark">
            <XCircleIcon className="w-5 h-5 text-red-500" />
            Priority support
          </li>
        </ul>
        <p className="text-sm text-stone-dark mt-4">
          Access continues until: <strong>{formatDate(subscription?.currentPeriodEnd)}</strong>
        </p>
      </div>

      <div className="bg-white rounded-lg border border-stone p-6 mb-8">
        <h3 className="font-semibold text-earth-brown mb-4">
          Help us improve - Why are you cancelling?
        </h3>

        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 border border-stone rounded-lg mb-4"
        >
          <option value="">Select a reason...</option>
          <option value="too_expensive">Too expensive</option>
          <option value="not_using">Not using the features</option>
          <option value="found_alternative">Found an alternative</option>
          <option value="technical_issues">Technical issues</option>
          <option value="temporary">Taking a break (temporary)</option>
          <option value="other">Other</option>
        </select>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Additional feedback (optional)"
          className="w-full p-3 border border-stone rounded-lg resize-none"
          rows={4}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="flex-1 py-3 border-2 border-stone text-earth-dark rounded-lg hover:bg-earth-light transition-colors"
        >
          Keep My Subscription
        </button>

        <button
          onClick={handleCancel}
          disabled={isSubmitting || !reason}
          className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
        </button>
      </div>

      <p className="text-center text-sm text-stone-dark mt-6">
        Need help? <Link href="/support" className="text-earth-brown underline">Contact support</Link>
      </p>
    </div>
  );
}
```

---

### 4. Admin Subscription Dashboard

**Location:** `app/(dashboard)/admin/subscriptions/page.tsx`

**Features:**
- Key metrics cards (MRR, ARR, Active, Past Due, Churn)
- Filters (Status, Tier, Search)
- Subscription table with expandable rows
- Bulk actions (export CSV)
- Individual actions (view details, refund, retry payment, cancel)

**Component Structure:**

```tsx
export default function AdminSubscriptionsPage() {
  const [filters, setFilters] = useState({
    status: '',
    tier: '',
    search: ''
  });

  const { data: subscriptionsData } = useAdminSubscriptions(filters);
  const { subscriptions, metrics } = subscriptionsData || {};

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-earth-brown">
          Subscription Management
        </h1>
        <button className="btn-secondary">
          Export CSV
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Active Subscriptions"
          value={metrics?.totalActive || 0}
          icon={<UsersIcon />}
          trend="+12 this month"
        />
        <MetricCard
          label="MRR"
          value={`$${(metrics?.mrr || 0).toLocaleString()}`}
          icon={<DollarSignIcon />}
          trend="+8.3%"
        />
        <MetricCard
          label="ARR"
          value={`$${(metrics?.arr || 0).toLocaleString()}`}
          icon={<TrendingUpIcon />}
        />
        <MetricCard
          label="Past Due"
          value={metrics?.totalPastDue || 0}
          icon={<AlertCircleIcon />}
          alert
        />
        <MetricCard
          label="Churn Rate"
          value={`${metrics?.churnRate || 0}%`}
          icon={<TrendingDownIcon />}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-stone p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="p-2 border border-stone rounded"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={filters.tier}
            onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
            className="p-2 border border-stone rounded"
          >
            <option value="">All Tiers</option>
            <option value="BASIC">Basic</option>
            <option value="PREMIUM">Premium</option>
            <option value="PLATINUM">Platinum</option>
          </select>

          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="md:col-span-2 p-2 border border-stone rounded"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg border border-stone overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-light border-b border-stone">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-earth-brown">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-earth-brown">Tier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-earth-brown">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-earth-brown">Next Billing</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-earth-brown">MRR</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-earth-brown">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions?.map((sub) => (
              <SubscriptionRow key={sub.id} subscription={sub} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**SubscriptionRow Component (Expandable):**

```tsx
function SubscriptionRow({ subscription }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  return (
    <>
      <tr
        className="border-b border-stone hover:bg-earth-light cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="px-4 py-3">
          <div>
            <div className="font-medium text-earth-brown">{subscription.user.name}</div>
            <div className="text-sm text-stone-dark">{subscription.user.email}</div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="px-2 py-1 bg-earth-light text-earth-brown rounded text-sm font-medium">
            {subscription.tier}
          </span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={subscription.status} />
        </td>
        <td className="px-4 py-3 text-sm text-earth-dark">
          {formatDate(subscription.currentPeriodEnd)}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-earth-brown">
          ${subscription.amount}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRefundModal(true);
              }}
              className="text-blue-600 hover:text-blue-800"
              title="Issue Refund"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
            {subscription.status === 'PAST_DUE' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetryPayment(subscription.id);
                }}
                className="text-green-600 hover:text-green-800"
                title="Retry Payment"
              >
                <PlayIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-4 py-4 bg-stone-light">
            <SubscriptionDetails subscription={subscription} />
          </td>
        </tr>
      )}

      {showRefundModal && (
        <RefundModal
          subscription={subscription}
          onClose={() => setShowRefundModal(false)}
        />
      )}
    </>
  );
}
```

---

### 5. Middleware: Subscription Feature Guard

**Location:** `middleware.ts` (add to existing middleware)

**Purpose:** Restrict access to premium features based on subscription tier

**Logic:**

```typescript
// Add to existing middleware.ts

const premiumRoutes = [
  '/courses/premium',
  '/practitioners/book',
  '/events/exclusive'
];

const tierRequirements = {
  '/courses/premium': ['BASIC', 'PREMIUM', 'PLATINUM'],
  '/practitioners/book': ['PREMIUM', 'PLATINUM'],
  '/events/exclusive': ['PLATINUM']
};

export async function middleware(request: NextRequest) {
  // ... existing auth checks ...

  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Check subscription tier for premium routes
  const requiredTiers = tierRequirements[path];
  if (requiredTiers && token) {
    const userTier = token.subscriptionTier || 'FREE';
    const userStatus = token.subscriptionStatus || 'INACTIVE';

    // Must have active subscription and correct tier
    if (userStatus !== 'ACTIVE' || !requiredTiers.includes(userTier)) {
      return NextResponse.redirect(new URL('/subscriptions/upgrade', request.url));
    }
  }

  return NextResponse.next();
}
```

---

## Implementation Details

### Phase 1: Database Schema & Stripe Setup (Days 1-2)

**Day 1: Database Models**

1. Add new Prisma models to `schema.prisma`:
   - Subscription
   - Invoice
   - PaymentMethod
   - PaymentAttempt
   - SubscriptionChange
   - Refund
   - All associated enums

2. Run Prisma migration:
   ```bash
   npx prisma migrate dev --name add_subscription_models
   npx prisma generate
   ```

3. Create seed script for Stripe Price IDs:
   ```typescript
   // prisma/seed-prices.ts
   import Stripe from 'stripe';

   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

   // Create Products
   const basicProduct = await stripe.products.create({
     name: 'BRITE POOL Basic Membership',
     description: 'Enhanced access with premium content'
   });

   // Create Prices
   const basicMonthly = await stripe.prices.create({
     product: basicProduct.id,
     unit_amount: 2900, // $29.00
     currency: 'usd',
     recurring: { interval: 'month' }
   });

   // ... repeat for all tiers and intervals
   ```

**Day 2: Stripe Configuration**

1. Create Stripe webhook endpoint in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to subscribe:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`

2. Save webhook secret to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. Create Stripe utility functions:
   ```typescript
   // lib/stripe.ts
   export function createStripeCustomer(userId, email, name) { }
   export function createCheckoutSession(priceId, customerId) { }
   export function updateSubscription(subscriptionId, newPriceId) { }
   export function cancelSubscription(subscriptionId, atPeriodEnd) { }
   ```

---

### Phase 2: Core API Endpoints (Days 3-4)

**Day 3: User-Facing Endpoints**

Implement the following routes:

1. `/api/subscriptions/tiers` (GET)
   - Return hardcoded tier data with Stripe Price IDs
   - No database queries needed

2. `/api/subscriptions/create` (POST)
   - Create Stripe Checkout Session
   - Include success/cancel URLs
   - Return checkout URL

3. `/api/subscriptions/current` (GET)
   - Query database for user's active subscription
   - Fetch upcoming invoice from Stripe
   - Return combined data

4. `/api/subscriptions/upgrade` (POST)
   - Call Stripe subscription.update()
   - Handle proration
   - Update database

5. `/api/subscriptions/downgrade` (POST)
   - Schedule downgrade for end of period
   - Create SubscriptionChange record

6. `/api/subscriptions/cancel` (POST)
   - Cancel at period end
   - Store feedback

**Day 4: Webhook & Payment Methods**

1. `/api/webhooks/stripe` (POST)
   - Verify Stripe signature
   - Handle all webhook events
   - Update database accordingly
   - Send emails for each event type

2. `/api/subscriptions/update-payment-method` (POST)
   - Attach new payment method
   - Set as default
   - Retry payment if PAST_DUE

3. `/api/subscriptions/payment-history` (GET)
   - Query Invoice table
   - Return paginated results

---

### Phase 3: UI Components (Days 5-6)

**Day 5: User-Facing Pages**

1. `/subscriptions/tiers` page
   - Tier comparison grid
   - Billing toggle
   - Stripe Checkout integration

2. `/subscriptions/manage` page
   - Subscription overview card
   - Payment method card
   - Billing history table

3. `/subscriptions/cancel` page
   - Cancellation flow with feedback form

4. `/subscriptions/success` page
   - Post-checkout confirmation

5. Add "Upgrade" CTAs throughout dashboard:
   - Dashboard header (if FREE tier)
   - Premium course pages (with paywall)
   - Practitioner booking page (with paywall)

**Day 6: Payment Method & Upgrade Flows**

1. Stripe Elements integration for payment method updates
   ```tsx
   // components/PaymentMethodForm.tsx
   import { Elements, PaymentElement } from '@stripe/react-stripe-js';
   ```

2. Upgrade/downgrade modals with confirmation steps

3. Reactivation flow for cancelled subscriptions

---

### Phase 4: Admin Dashboard (Day 7)

**Day 7: Admin Interface**

1. `/admin/subscriptions` page
   - Metrics cards
   - Filterable subscription table
   - Expandable row details

2. Admin API endpoints:
   - `GET /api/admin/subscriptions`
   - `POST /api/admin/subscriptions/[id]/refund`
   - `POST /api/admin/subscriptions/[id]/retry-payment`
   - `POST /api/admin/subscriptions/[id]/cancel`

3. Refund modal component

4. Admin audit logging for all actions

---

### Phase 5: Testing & Dunning (Ongoing)

**Testing Checklist:**

- Test all Stripe webhook events in Stripe Dashboard (use test mode)
- Test dunning flow with Stripe test cards:
  - `4000000000000341` - Declined (triggers payment failure)
- Test upgrade/downgrade proration calculations
- Test cancellation and reactivation flows
- Test payment method updates during PAST_DUE status
- Test admin refund processing
- Test subscription tier access controls (middleware)

**Dunning Configuration in Stripe Dashboard:**

1. Navigate to Settings → Billing → Subscriptions and emails
2. Set retry schedule: 3 days, 5 days, 7 days
3. Configure Smart Retries (Stripe's ML-based retry timing)
4. Enable email receipts and failed payment notifications

---

## Testing Requirements

### Unit Tests

```typescript
// __tests__/api/subscriptions/create.test.ts
describe('POST /api/subscriptions/create', () => {
  test('creates checkout session for authenticated user', async () => {
    const res = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` },
      body: JSON.stringify({
        tier: 'PREMIUM',
        billingInterval: 'MONTHLY',
        stripePriceId: 'price_premium_monthly'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.checkoutUrl).toContain('checkout.stripe.com');
  });

  test('rejects unauthenticated request', async () => {
    const res = await fetch('/api/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify({ tier: 'PREMIUM' })
    });

    expect(res.status).toBe(401);
  });
});

// __tests__/api/webhooks/stripe.test.ts
describe('POST /api/webhooks/stripe', () => {
  test('handles invoice.payment_failed webhook', async () => {
    const event = createStripeWebhookEvent('invoice.payment_failed', {
      subscription: 'sub_123',
      customer: 'cus_123'
    });

    const res = await fetch('/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': generateSignature(event) },
      body: JSON.stringify(event)
    });

    expect(res.status).toBe(200);

    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: 'sub_123' }
    });
    expect(sub.status).toBe('PAST_DUE');
  });
});
```

### Integration Tests

1. **Full Subscription Flow:**
   - User clicks "Select Plan" on PREMIUM tier
   - Redirected to Stripe Checkout
   - Complete payment with test card
   - Webhook received and processed
   - User redirected to success page
   - Database updated with subscription
   - User gains access to premium features

2. **Upgrade Flow:**
   - User with BASIC tier upgrades to PREMIUM
   - Proration calculated correctly
   - Immediate access granted
   - Database updated

3. **Cancellation Flow:**
   - User cancels subscription
   - Access continues until period end
   - On period end, webhook triggers downgrade to FREE
   - Access to premium features revoked

4. **Dunning Flow:**
   - Simulate payment failure
   - Verify PAST_DUE status set
   - Verify retry attempts on days 3, 5, 7
   - Verify subscription cancelled after 3 failures
   - Verify downgrade to FREE tier

### Manual Testing Checklist

**User Flows:**
- [ ] Can view tier comparison page
- [ ] Can subscribe to new tier via Stripe Checkout
- [ ] Can view current subscription details
- [ ] Can upgrade tier with proration
- [ ] Can downgrade tier (scheduled for period end)
- [ ] Can cancel subscription with feedback
- [ ] Can reactivate cancelled subscription
- [ ] Can update payment method
- [ ] Payment failure triggers PAST_DUE status
- [ ] Dunning retries work correctly
- [ ] After 3 failed retries, downgraded to FREE
- [ ] Can view billing history with PDF invoices

**Admin Flows:**
- [ ] Can view subscription dashboard with metrics
- [ ] Can filter subscriptions by status/tier
- [ ] Can search subscriptions by user
- [ ] Can expand row to see detailed info
- [ ] Can process full refund
- [ ] Can process partial refund
- [ ] Can manually retry payment
- [ ] Can cancel subscription immediately
- [ ] All admin actions logged in audit trail

**Access Control:**
- [ ] FREE users cannot access premium courses
- [ ] FREE users cannot book practitioners
- [ ] BASIC users can access premium courses
- [ ] BASIC users cannot book practitioners
- [ ] PREMIUM users can access all features
- [ ] Middleware redirects correctly for unauthorized access

**Email Notifications:**
- [ ] Subscription created email sent
- [ ] Receipt email sent on successful payment
- [ ] Payment failed email sent immediately
- [ ] Retry email sent on each attempt
- [ ] Subscription suspended email sent after final failure
- [ ] Cancellation confirmation email sent
- [ ] Refund confirmation email sent

---

## Deployment Checklist

### Pre-Deployment

- [ ] All Prisma migrations run successfully
- [ ] Stripe products and prices created in live mode
- [ ] Stripe webhook endpoint configured in live mode
- [ ] Environment variables set for production:
  - `STRIPE_SECRET_KEY` (live mode)
  - `STRIPE_PUBLISHABLE_KEY` (live mode)
  - `STRIPE_WEBHOOK_SECRET` (live mode)
- [ ] All API endpoints tested in staging
- [ ] Webhook events tested with Stripe CLI
- [ ] Email templates configured and tested
- [ ] Dunning settings configured in Stripe Dashboard
- [ ] Admin permissions verified
- [ ] All tests passing

### Deployment Steps

1. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Seed Stripe Price IDs:**
   ```bash
   npm run seed:prices
   ```

3. **Deploy Application:**
   - Deploy to production environment
   - Verify environment variables loaded correctly

4. **Configure Stripe Webhook:**
   - Update webhook URL to production domain
   - Test webhook delivery with Stripe test event

5. **Smoke Testing:**
   - Create test subscription
   - Verify webhook processed correctly
   - Verify email sent
   - Cancel test subscription

### Post-Deployment

- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Monitor subscription creation rate
- [ ] Monitor payment failure rate
- [ ] Verify dunning emails being sent
- [ ] Check admin dashboard loads correctly
- [ ] Monitor error logs for any issues
- [ ] Verify tier-based access control working
- [ ] Test user upgrade/downgrade flows
- [ ] Test admin refund processing
- [ ] Create backup of subscription data

---

## Future Enhancements

1. **Trial Periods:**
   - 14-day free trial for new PREMIUM subscriptions
   - Automatic conversion to paid after trial
   - Trial reminder emails

2. **Discount Codes:**
   - Coupon code support via Stripe
   - Percentage and fixed-amount discounts
   - Time-limited promotions

3. **Usage-Based Billing:**
   - Metered billing for practitioner bookings
   - Pay-per-event ticket purchases

4. **Subscription Pausing:**
   - Allow users to pause subscription for 1-3 months
   - Resume subscription without re-subscribing

5. **Gifting:**
   - Gift subscriptions to other users
   - Gift card support

6. **Annual Plan Incentives:**
   - Additional discount for annual plans
   - Bonus features for annual subscribers

7. **Revenue Analytics:**
   - Lifetime value (LTV) calculations
   - Cohort analysis
   - Revenue forecasting

8. **Dunning Improvements:**
   - SMS notifications for failed payments
   - In-app notifications
   - Predictive churn analysis

9. **Multi-Currency Support:**
   - Support for EUR, GBP, etc.
   - Automatic currency conversion

10. **Self-Service Invoicing:**
    - Custom invoice generation for businesses
    - Tax ID collection
    - VAT handling for international customers

---

**Spec Complete**

Next step: Begin implementation with Phase 1 (Database Schema & Stripe Setup).
