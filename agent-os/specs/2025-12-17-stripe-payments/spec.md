# Specification: Stripe Payment Integration

**Feature ID:** F010
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** Authentication (F002)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Flows](#user-flows)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Stripe Integration](#stripe-integration)
6. [UI Components](#ui-components)
7. [Implementation Details](#implementation-details)
8. [Testing Requirements](#testing-requirements)
9. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Purpose
Implement a comprehensive Stripe payment integration system enabling BRITE POOL to accept monthly and annual recurring subscription payments, process one-time payments for events and workshops, handle payment status updates via webhooks, and deliver receipts automatically. The system must be PCI-compliant by leveraging Stripe's hosted checkout and elements, ensuring secure handling of payment information.

### Key Requirements
- **Stripe Payment Processor Integration** with secure API communication
- **Recurring Subscriptions**: Monthly and annual billing cycles for membership tiers
- **One-Time Payments**: Event registrations, workshop fees, and donations
- **Webhook Handling**: Real-time payment status updates (succeeded, failed, refunded)
- **PCI-Compliant Checkout Flow**: Stripe Checkout and Stripe Elements for secure payment collection
- **Receipt Generation & Email Delivery**: Automatic receipt creation and delivery after successful payments
- **Customer Portal**: Stripe-hosted portal for subscription management, invoices, and payment methods

### Success Metrics
- 100% of payments processed through PCI-compliant Stripe infrastructure
- Zero sensitive payment data stored in application database
- Automatic webhook handling for all payment events (success rate >99%)
- Receipt delivery within 5 minutes of successful payment
- Subscription cancellation and update flows fully functional via Stripe Customer Portal
- Complete audit trail of all payment transactions

---

## User Flows

### Flow 1: New User Subscribes to Membership (Recurring Subscription)

```
1. User logs in and navigates to /dashboard/membership
2. User sees membership tier options (Basic, Premium, Platinum)
3. User clicks "Subscribe" button on desired tier (e.g., Premium)
4. Modal or redirect shows billing frequency options:
   - Monthly ($X/month)
   - Annual ($Y/year - Save 15%)
5. User selects billing frequency
6. POST /api/payments/create-subscription-checkout
   - Request: { tierId: "PREMIUM", interval: "month" }
7. Backend creates Stripe Checkout Session:
   - Customer: existing or new Stripe customer linked to user
   - Mode: subscription
   - Line items: membership tier with selected interval
   - Success URL: /dashboard/subscription-success?session_id={CHECKOUT_SESSION_ID}
   - Cancel URL: /dashboard/membership
8. Backend returns { checkoutUrl: "https://checkout.stripe.com/..." }
9. User redirected to Stripe-hosted checkout page
10. User enters payment details (Stripe handles PCI compliance)
11. User completes checkout
12. Stripe redirects to success URL
13. Frontend displays success message and fetches updated subscription status
14. Webhook received: checkout.session.completed
15. Backend updates User model:
    - subscriptionTier: PREMIUM
    - subscriptionStatus: ACTIVE
16. Payment record created in database
17. Invoice record created
18. Receipt generated and emailed to user
19. User now has access to premium features
```

### Flow 2: User Pays for Event Registration (One-Time Payment)

```
1. User logs in and navigates to /dashboard/events
2. User views event detail page (e.g., "Healing Retreat Workshop")
3. Event has registration fee: $75
4. User clicks "Register & Pay" button
5. POST /api/payments/create-event-checkout
   - Request: { eventId: "evt_123...", amount: 7500 } // amount in cents
6. Backend creates Stripe Checkout Session:
   - Customer: existing or new Stripe customer linked to user
   - Mode: payment (one-time)
   - Line items: event registration fee
   - Metadata: { eventId, userId, type: "event_registration" }
   - Success URL: /dashboard/events/[eventId]/registration-success?session_id={CHECKOUT_SESSION_ID}
   - Cancel URL: /dashboard/events/[eventId]
7. Backend returns { checkoutUrl: "https://checkout.stripe.com/..." }
8. User redirected to Stripe-hosted checkout page
9. User enters payment details
10. User completes checkout
11. Stripe redirects to success URL
12. Frontend automatically registers user for event
13. Webhook received: checkout.session.completed
14. Backend creates EventRegistration record (status: REGISTERED)
15. Payment record created with metadata.eventId
16. Invoice record created
17. Receipt generated and emailed with event details
18. Confirmation email sent with event date/time/location
```

### Flow 3: Webhook Handles Subscription Payment Succeeded

```
1. Stripe sends webhook event: invoice.payment_succeeded
2. POST /api/webhooks/stripe (with Stripe signature header)
3. Backend verifies webhook signature using Stripe secret
4. Backend extracts event data:
   - Type: invoice.payment_succeeded
   - Customer ID
   - Invoice ID
   - Amount paid
   - Subscription ID
5. Backend finds User by stripeCustomerId
6. Backend creates Payment record:
   - userId
   - amount
   - currency: "usd"
   - status: SUCCEEDED
   - stripePaymentIntentId
   - stripeInvoiceId
7. Backend creates Invoice record:
   - userId
   - paymentId
   - amount
   - paidAt: now()
8. Backend generates receipt PDF
9. Backend sends receipt email to user
10. Backend responds 200 OK to Stripe
```

### Flow 4: Webhook Handles Subscription Payment Failed

```
1. Stripe sends webhook event: invoice.payment_failed
2. POST /api/webhooks/stripe
3. Backend verifies signature
4. Backend extracts event data:
   - Customer ID
   - Invoice ID
   - Error message
5. Backend finds User by stripeCustomerId
6. Backend updates User model:
   - subscriptionStatus: PAST_DUE
7. Backend creates Payment record:
   - status: FAILED
   - errorMessage
8. Backend sends email notification to user:
   - Subject: "Payment Failed - Action Required"
   - Body: Details about failed payment, link to update payment method
9. Backend responds 200 OK to Stripe
```

### Flow 5: User Manages Subscription via Stripe Customer Portal

```
1. User logs in and navigates to /dashboard/subscription
2. User sees current subscription status:
   - Tier: Premium
   - Billing: Monthly ($49/month)
   - Next payment: Jan 15, 2026
3. User clicks "Manage Subscription" button
4. POST /api/payments/create-portal-session
5. Backend creates Stripe Customer Portal session:
   - Customer: user's stripeCustomerId
   - Return URL: /dashboard/subscription
6. Backend returns { portalUrl: "https://billing.stripe.com/..." }
7. User redirected to Stripe-hosted portal
8. User can:
   - View payment history and invoices
   - Update payment method
   - Cancel subscription
   - Change billing frequency (monthly <-> annual)
9. User makes changes (e.g., cancels subscription)
10. Stripe sends webhook: customer.subscription.deleted
11. Backend updates User model:
    - subscriptionStatus: CANCELLED
12. User redirected back to /dashboard/subscription
13. Frontend shows updated subscription status
```

### Flow 6: Refund Processing

```
1. Admin logs in with WEB_STEWARD or BOARD_CHAIR role
2. Admin navigates to /dashboard/admin/payments
3. Admin views payment records and selects one to refund
4. Admin clicks "Refund Payment" button
5. Modal confirms refund amount and reason
6. POST /api/admin/payments/[id]/refund
   - Request: { amount: 5000, reason: "Customer request" }
7. Backend creates Stripe refund:
   - Payment Intent ID
   - Amount (full or partial)
8. Stripe processes refund
9. Webhook received: charge.refunded
10. Backend updates Payment record:
    - status: REFUNDED
    - refundedAt: now()
    - refundReason
11. Backend sends refund confirmation email to user
12. Backend responds to admin with success message
```

---

## Database Schema

### New Model: Payment

```prisma
model Payment {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation("Payments", fields: [userId], references: [id], onDelete: Cascade)

  // Stripe IDs
  stripePaymentIntentId String? @unique
  stripeChargeId        String?
  stripeInvoiceId       String?
  stripeSubscriptionId  String?

  // Payment details
  amount      Int      // Amount in cents
  currency    String   @default("usd")
  status      PaymentStatus
  type        PaymentType

  // Metadata
  metadata    Json?    // { eventId, tierId, description, etc. }

  // Refund information
  refundedAt  DateTime?
  refundAmount Int?    // Amount refunded in cents
  refundReason String?

  // Error handling
  errorMessage String?

  // Relations
  invoice     Invoice?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([stripePaymentIntentId])
  @@index([stripeSubscriptionId])
}

model Invoice {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation("Invoices", fields: [userId], references: [id], onDelete: Cascade)

  paymentId   String   @unique
  payment     Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  // Invoice details
  invoiceNumber String  @unique  // e.g., "INV-2025-001234"
  amount      Int      // Amount in cents
  currency    String   @default("usd")

  // Invoice items
  items       Json     // [{ description, amount, quantity }]

  // Stripe data
  stripeInvoiceId String? @unique
  stripeInvoiceUrl String?  // Stripe-hosted invoice URL
  stripeInvoicePdf String?  // PDF download link

  // Status
  status      InvoiceStatus
  paidAt      DateTime?
  dueDate     DateTime?

  // Receipt
  receiptUrl  String?  // S3 or storage URL for generated receipt PDF
  receiptSentAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([invoiceNumber])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
  CANCELLED
}

enum PaymentType {
  SUBSCRIPTION_RECURRING  // Monthly/annual membership
  EVENT_REGISTRATION      // One-time event payment
  WORKSHOP_FEE           // One-time workshop payment
  DONATION               // One-time donation
  ONE_TIME_PURCHASE      // Generic one-time payment
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}
```

### Updates to Existing Models

**User Model** (add relations and Stripe fields):
```prisma
model User {
  // ... existing fields

  // Stripe customer
  stripeCustomerId String? @unique

  // Relations
  payments    Payment[] @relation("Payments")
  invoices    Invoice[] @relation("Invoices")

  @@index([stripeCustomerId])
}
```

**EventRegistration Model** (add payment reference):
```prisma
model EventRegistration {
  // ... existing fields

  paymentId   String?
  payment     Payment? @relation(fields: [paymentId], references: [id])
}
```

### Database Migration

Run Prisma migrations:
```bash
npx prisma db push
```

---

## API Endpoints

### 1. POST /api/payments/create-subscription-checkout

**Purpose:** Create Stripe Checkout session for recurring subscription

**Authentication:** Required (authenticated user)

**Request Body:**
```json
{
  "tierId": "PREMIUM",
  "interval": "month"
}
```

**Logic:**
1. Verify user is authenticated
2. Validate subscription tier exists (BASIC, PREMIUM, PLATINUM)
3. Validate interval is "month" or "year"
4. Get or create Stripe customer for user
5. Get price ID from Stripe for tier and interval
6. Create Stripe Checkout Session:
   - mode: "subscription"
   - customer: stripeCustomerId
   - line_items: [{ price: stripePriceId, quantity: 1 }]
   - metadata: { userId, tierId, interval }
   - success_url: /dashboard/subscription-success?session_id={CHECKOUT_SESSION_ID}
   - cancel_url: /dashboard/membership
7. Return checkout URL

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error Cases:**
- User not authenticated → 401
- Invalid tier or interval → 400
- Stripe API error → 500

---

### 2. POST /api/payments/create-event-checkout

**Purpose:** Create Stripe Checkout session for one-time event payment

**Authentication:** Required (authenticated user)

**Request Body:**
```json
{
  "eventId": "evt_clx123...",
  "amount": 7500
}
```

**Logic:**
1. Verify user is authenticated
2. Verify event exists and has capacity
3. Verify user not already registered
4. Get or create Stripe customer
5. Create Stripe Checkout Session:
   - mode: "payment"
   - customer: stripeCustomerId
   - line_items: [{ price_data: { currency: "usd", unit_amount: amount, product_data: { name: eventTitle } }, quantity: 1 }]
   - metadata: { userId, eventId, type: "event_registration" }
   - success_url: /dashboard/events/[eventId]/success?session_id={CHECKOUT_SESSION_ID}
   - cancel_url: /dashboard/events/[eventId]
6. Return checkout URL

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error Cases:**
- User not authenticated → 401
- Event not found → 404
- User already registered → 400
- Event at capacity → 400
- Stripe API error → 500

---

### 3. POST /api/payments/create-portal-session

**Purpose:** Create Stripe Customer Portal session for subscription management

**Authentication:** Required (authenticated user with active subscription)

**Request Body:**
```json
{
  "returnUrl": "/dashboard/subscription"
}
```

**Logic:**
1. Verify user is authenticated
2. Verify user has stripeCustomerId
3. Create Stripe Billing Portal Session:
   - customer: stripeCustomerId
   - return_url: returnUrl (default: /dashboard/subscription)
4. Return portal URL

**Response:**
```json
{
  "portalUrl": "https://billing.stripe.com/p/session/test_..."
}
```

**Error Cases:**
- User not authenticated → 401
- No Stripe customer found → 400
- Stripe API error → 500

---

### 4. POST /api/webhooks/stripe

**Purpose:** Handle Stripe webhook events for payment status updates

**Authentication:** Webhook signature verification (Stripe-Signature header)

**Events Handled:**
- `checkout.session.completed` - New payment or subscription created
- `invoice.payment_succeeded` - Recurring payment successful
- `invoice.payment_failed` - Payment failed
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled
- `charge.refunded` - Payment refunded

**Logic:**
1. Verify webhook signature using `stripe.webhooks.constructEvent()`
2. Extract event type and data
3. Route to appropriate handler based on event type
4. Update database accordingly
5. Send emails if necessary
6. Return 200 OK

**Response:**
```json
{
  "received": true
}
```

**Error Cases:**
- Invalid signature → 401
- Event handling error → Log error, return 500 (Stripe will retry)

---

### 5. GET /api/payments

**Purpose:** Get user's payment history

**Authentication:** Required (authenticated user)

**Query Parameters:**
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)
- `status` (optional): Filter by status

**Response:**
```json
{
  "payments": [
    {
      "id": "pay_123...",
      "amount": 4900,
      "currency": "usd",
      "status": "SUCCEEDED",
      "type": "SUBSCRIPTION_RECURRING",
      "createdAt": "2025-12-17T10:00:00Z",
      "invoice": {
        "invoiceNumber": "INV-2025-001234",
        "stripeInvoicePdf": "https://..."
      }
    }
  ],
  "total": 42
}
```

---

### 6. GET /api/payments/[id]

**Purpose:** Get payment details

**Authentication:** Required (user must own payment or be admin)

**Response:**
```json
{
  "id": "pay_123...",
  "amount": 4900,
  "currency": "usd",
  "status": "SUCCEEDED",
  "type": "SUBSCRIPTION_RECURRING",
  "stripePaymentIntentId": "pi_...",
  "metadata": {
    "tierId": "PREMIUM",
    "interval": "month"
  },
  "createdAt": "2025-12-17T10:00:00Z",
  "invoice": {
    "invoiceNumber": "INV-2025-001234",
    "stripeInvoiceUrl": "https://...",
    "stripeInvoicePdf": "https://...",
    "receiptUrl": "https://..."
  }
}
```

---

### 7. POST /api/admin/payments/[id]/refund (Admin Only)

**Purpose:** Refund a payment

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "amount": 4900,
  "reason": "Customer request"
}
```

**Logic:**
1. Verify admin role
2. Verify payment exists and is refundable
3. Create Stripe refund
4. Update Payment record with refund details
5. Send refund confirmation email
6. Return success response

**Response:**
```json
{
  "success": true,
  "refund": {
    "id": "re_...",
    "amount": 4900,
    "status": "succeeded"
  }
}
```

---

## Stripe Integration

### Stripe SDK Setup

**Installation:**
```bash
npm install stripe @stripe/stripe-js
```

**Server-Side Initialization:**
```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18',
  typescript: true,
});
```

**Client-Side Initialization:**
```typescript
// lib/stripe-client.ts
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

### Environment Variables

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product/Price IDs
STRIPE_BASIC_MONTHLY_PRICE_ID=price_...
STRIPE_BASIC_YEARLY_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
STRIPE_PLATINUM_MONTHLY_PRICE_ID=price_...
STRIPE_PLATINUM_YEARLY_PRICE_ID=price_...
```

### Stripe Configuration in Dashboard

1. **Products & Prices:**
   - Create products: Basic Membership, Premium Membership, Platinum Membership
   - Create prices for each:
     - Monthly recurring
     - Yearly recurring (with 15% discount)

2. **Customer Portal Configuration:**
   - Enable invoice history
   - Enable payment method updates
   - Enable subscription cancellation
   - Enable subscription updates (change plan)
   - Configure business information

3. **Webhook Endpoints:**
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `charge.refunded`

---

## UI Components

### 1. Membership Subscription Page

**Location:** `app/dashboard/membership/page.tsx`

**Features:**
- Three-column layout showing membership tiers
- Pricing cards with features list
- Toggle between monthly and annual billing
- "Subscribe" button for each tier
- Current subscription status indicator
- "Manage Subscription" button for existing subscribers

**Component Structure:**
```tsx
export default function MembershipPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const { user } = useAuth();

  const handleSubscribe = async (tierId: string) => {
    const res = await fetch('/api/payments/create-subscription-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId, interval: billingInterval }),
    });
    const { checkoutUrl } = await res.json();
    window.location.href = checkoutUrl;
  };

  const handleManageSubscription = async () => {
    const res = await fetch('/api/payments/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl: '/dashboard/subscription' }),
    });
    const { portalUrl } = await res.json();
    window.location.href = portalUrl;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif text-earth-brown mb-8">
        Choose Your Membership
      </h1>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-stone-warm rounded-lg p-1">
          <button
            onClick={() => setBillingInterval('month')}
            className={billingInterval === 'month' ? 'active' : ''}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={billingInterval === 'year' ? 'active' : ''}
          >
            Annual (Save 15%)
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div key={tier.id} className="card">
            <h3>{tier.name}</h3>
            <p className="text-3xl font-bold">
              ${tier.prices[billingInterval]}
              <span className="text-sm">/{billingInterval}</span>
            </p>
            <ul className="features">
              {tier.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(tier.id)}
              className="btn-primary"
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>

      {/* Existing Subscription */}
      {user.subscriptionStatus === 'ACTIVE' && (
        <div className="mt-12 text-center">
          <p>Current Plan: {user.subscriptionTier}</p>
          <button onClick={handleManageSubscription} className="btn-secondary">
            Manage Subscription
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 2. Event Registration with Payment

**Location:** `app/dashboard/events/[id]/page.tsx`

**Features:**
- Event details display
- Registration form
- Payment button (if event has fee)
- Redirect to Stripe Checkout

**Component Structure:**
```tsx
const handleRegisterAndPay = async () => {
  const res = await fetch('/api/payments/create-event-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId: event.id, amount: event.registrationFee }),
  });
  const { checkoutUrl } = await res.json();
  window.location.href = checkoutUrl;
};
```

---

### 3. Payment History Page

**Location:** `app/dashboard/payments/page.tsx`

**Features:**
- List of all user payments
- Filter by status and type
- View invoice/receipt links
- Download PDF receipts

---

### 4. Admin Payment Management

**Location:** `app/dashboard/admin/payments/page.tsx`

**Features:**
- View all payments across all users
- Filter and search
- Refund processing
- Payment analytics dashboard

---

## Implementation Details

### Phase 1: Stripe Setup & Configuration (Day 1)

1. Create Stripe account (if not exists)
2. Configure products and prices in Stripe Dashboard
3. Set up webhook endpoint
4. Configure Customer Portal settings
5. Add environment variables to `.env.local`
6. Install Stripe SDK: `npm install stripe @stripe/stripe-js`

### Phase 2: Database Schema & Models (Day 2)

1. Add Payment and Invoice models to Prisma schema
2. Update User model with stripeCustomerId
3. Run database migrations: `npx prisma db push`
4. Generate Prisma client: `npx prisma generate`

### Phase 3: API Endpoints - Core Payment (Days 3-4)

1. Implement `/api/payments/create-subscription-checkout`
2. Implement `/api/payments/create-event-checkout`
3. Implement `/api/payments/create-portal-session`
4. Implement `/api/payments` (GET - list payments)
5. Implement `/api/payments/[id]` (GET - payment details)
6. Add helper functions for Stripe customer creation
7. Add error handling and logging

### Phase 4: Webhook Handler (Day 5)

1. Implement `/api/webhooks/stripe`
2. Add signature verification
3. Implement handlers for each event type:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
4. Add database update logic
5. Implement email notifications
6. Test webhook events using Stripe CLI

### Phase 5: UI Components (Days 6-7)

1. Create membership subscription page
2. Implement event registration with payment
3. Create payment history page
4. Build admin payment management interface
5. Add success/cancel pages for checkout flows
6. Implement receipt generation and email delivery
7. Style components with biophilic design system

---

## Testing Requirements

### Unit Tests

**Payment API Tests:**
```typescript
test('POST /api/payments/create-subscription-checkout creates checkout session', async () => {
  const res = await fetch('/api/payments/create-subscription-checkout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tierId: 'PREMIUM', interval: 'month' })
  });

  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.checkoutUrl).toContain('checkout.stripe.com');
});

test('Webhook signature verification rejects invalid signatures', async () => {
  const res = await fetch('/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'invalid' },
    body: JSON.stringify({ type: 'invoice.payment_succeeded' })
  });

  expect(res.status).toBe(401);
});
```

### Integration Tests

**Subscription Flow:**
1. User creates checkout session
2. Simulate successful checkout webhook
3. Verify user subscription status updated
4. Verify payment record created
5. Verify invoice created and receipt sent

**Event Payment Flow:**
1. User creates event checkout session
2. Simulate successful payment webhook
3. Verify EventRegistration created
4. Verify payment record created
5. Verify receipt email sent

### Manual Testing Checklist

- [ ] Can create subscription checkout session for monthly billing
- [ ] Can create subscription checkout session for annual billing
- [ ] Can complete payment on Stripe Checkout page
- [ ] Webhook successfully updates subscription status
- [ ] Receipt email delivered after successful payment
- [ ] Can access Stripe Customer Portal
- [ ] Can cancel subscription via Customer Portal
- [ ] Webhook handles subscription cancellation
- [ ] Can process one-time event payment
- [ ] Can view payment history
- [ ] Admin can view all payments
- [ ] Admin can process refunds
- [ ] Failed payment updates subscription status to PAST_DUE
- [ ] Payment failure email sent to user

### Stripe Test Mode

Use Stripe test cards for manual testing:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication Required: `4000 0025 0000 3155`

---

## Deployment Checklist

### Pre-Deployment

- [ ] Stripe account created and verified
- [ ] Products and prices configured in Stripe Dashboard
- [ ] Customer Portal configured
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Environment variables set in production
- [ ] Database schema synced (`npx prisma db push`)
- [ ] All API endpoints tested
- [ ] Webhook handler tested with Stripe CLI
- [ ] Email templates created for receipts and notifications
- [ ] All tests passing

### Deployment Steps

1. Deploy database migrations to production
2. Deploy application code to hosting platform
3. Verify environment variables in production
4. Configure production webhook endpoint in Stripe Dashboard
5. Test webhook delivery using Stripe Dashboard test events
6. Switch Stripe from test mode to live mode
7. Update environment variables with live API keys
8. Test end-to-end subscription flow in production
9. Test end-to-end event payment flow in production
10. Monitor logs for errors

### Post-Deployment

- [ ] Verify webhook events being received (check Stripe Dashboard)
- [ ] Test subscription creation and payment flow
- [ ] Test Customer Portal access
- [ ] Verify receipt emails being delivered
- [ ] Test payment failure handling
- [ ] Monitor error logs for 24 hours
- [ ] Verify all Stripe events logging correctly
- [ ] Test refund processing (admin)
- [ ] Verify payment history displays correctly
- [ ] Check database for payment and invoice records

### Security Checklist

- [ ] Stripe webhook secret verified on all webhook requests
- [ ] Stripe API keys stored securely (never in client-side code)
- [ ] No sensitive payment data stored in application database
- [ ] PCI compliance maintained (all payment data handled by Stripe)
- [ ] HTTPS enforced on all payment endpoints
- [ ] Rate limiting enabled on payment endpoints
- [ ] User authorization checked before creating checkout sessions
- [ ] Admin endpoints protected with role-based access control

---

## Receipt Generation & Email Delivery

### Receipt Template

**Email Subject:** Receipt for Your {PaymentType} - {InvoiceNumber}

**Email Body:**
```
Dear {UserName},

Thank you for your payment to BRITE POOL Ministerium of Empowerment.

RECEIPT
Invoice Number: {InvoiceNumber}
Date: {PaymentDate}
Amount Paid: ${Amount}

PAYMENT DETAILS
{ItemizedList}

Payment Method: {CardBrand} ending in {Last4}
Transaction ID: {StripePaymentIntentId}

You can view and download your invoice at any time from your account dashboard.

If you have any questions, please contact us at support@britepool.org.

Blessings,
BRITE POOL Team
```

### Receipt PDF Generation

Use library: `pdfkit` or `react-pdf`

**PDF Contents:**
- BRITE POOL logo and branding
- Invoice number and date
- Payment details (itemized)
- Payment method
- Transaction ID
- Total amount paid
- Footer with contact information

---

## Future Enhancements

1. **Multiple Payment Methods:** Support ACH, bank transfers, crypto payments
2. **Discounts & Coupons:** Stripe coupon integration for promotional discounts
3. **Payment Plans:** Installment payment options for large purchases
4. **Automated Invoicing:** Send invoices before payment due date
5. **Subscription Dunning:** Automated retry logic for failed payments
6. **Revenue Analytics Dashboard:** Admin dashboard showing MRR, churn, LTV
7. **Tax Calculation:** Automatic tax calculation using Stripe Tax
8. **Multi-Currency Support:** Accept payments in multiple currencies

---

**Spec Complete**

**Next Step:** Run `/create-tasks` to generate implementation task list.
