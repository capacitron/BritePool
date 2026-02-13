# BRITE POOL - Ministerium of Empowerment

## Overview
A comprehensive Next.js 15 web platform for the BRITE POOL private ministerial association featuring 27 features across 10 phases. Built with:
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM (v5.22)
- **Authentication**: NextAuth v5 with JWT
- **Payments**: Stripe subscriptions (SDK v20.1.0, API 2025-12-15.clover)
- **Styling**: Tailwind CSS with biophilic earth-tone design
- **Language**: TypeScript

## Running the Application
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

## Admin Access
- Email: admin@britepool.org
- Password: Admin123!

## Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio
- `npx tsx prisma/seed.ts` - Seed database

## Database Configuration
- **Development**: Replit-provisioned PostgreSQL (via DATABASE_URL secret)
- **Production**: Neon PostgreSQL (configure DATABASE_URL in production env)
- Both databases share the same Prisma schema

## Project Structure
```
app/
├── (auth)/             - Login/Register pages
├── (dashboard)/        - Protected dashboard routes
│   └── dashboard/
│       ├── admin/      - Admin panel (users, announcements)
│       ├── analytics/  - Platform analytics
│       ├── committees/ - Committee management
│       ├── courses/    - LMS courses
│       ├── documents/  - Document library
│       ├── events/     - Events calendar
│       ├── forums/     - Community forums
│       ├── maintenance/- Maintenance requests
│       ├── map/        - Interactive map
│       ├── media/      - Media gallery
│       ├── participation/ - Sacred Ledger
│       ├── partners/   - Partner gallery
│       ├── profile/    - User profile
│       ├── stakeholder/- Stakeholder dashboard
│       ├── subscription/- Subscription management
│       ├── tasks/      - Task management
│       └── transparency/- Transparency hub
├── (onboarding)/       - New user onboarding flow
├── contract/           - Covenant agreement page
└── api/                - API routes

components/
├── dashboard/          - Dashboard layout components
├── events/             - Calendar component
├── pricing/            - Subscription pricing cards
├── tasks/              - Task board components
├── analytics/          - Analytics stat cards
└── ui/                 - Reusable UI components

lib/
├── auth/               - NextAuth configuration
│   ├── config.ts       - Full auth config (Credentials provider, Prisma)
│   └── edge-config.ts  - Edge-safe auth config (middleware only)
├── middleware/
│   └── security-headers.ts - Security headers (CSP, frame-ancestors)
├── email.ts            - Email service (Resend)
├── notifications.ts    - Notification system
├── prisma.ts           - Prisma client
├── stripe.ts           - Stripe initialization
└── logger.ts           - Pino logging (with conditional pino-pretty)

prisma/
├── schema.prisma       - Database schema (30+ models)
└── seed.ts             - Database seeding
```

## Features by Phase

### Phase 1: Authentication & Membership
- NextAuth JWT authentication with 8 role levels
- Covenant agreement system with versioning
- IP logging for contract acceptance
- Multi-step onboarding flow

### Phase 2: Communications
- Forums with 6 categories and threaded discussions
- Task management with Kanban board
- Maintenance request system with priority levels
- Announcements with priority and targeting

### Phase 3: Learning & Events
- LMS with courses, modules, and lessons
- Progress tracking and completion certificates
- Events calendar with monthly view
- Event registration and attendance tracking

### Phase 4: Payments
- Stripe subscription integration
- 4 tiers: FREE, BASIC ($10), PREMIUM ($25), PLATINUM ($99)
- Billing portal for subscription management
- Webhook handling for subscription updates

### Phase 5: Community
- 5 committees (Governance, Wealth, Education, Health, Operations)
- Committee membership management
- Sacred Ledger participation tracking
- Equity units (10 hours = 1 unit)

### Phase 6: Media & Content
- Media gallery with type filtering
- Interactive map with locations
- Partner gallery with categories
- Document management system

### Phase 7: Transparency
- Transparency hub with financial summaries
- Stakeholder dashboard with metrics
- Document library by category
- Activity feeds and announcements

### Phase 8-10: Admin & Analytics
- Admin panel for user management
- Role and subscription management
- Platform analytics dashboard
- Engagement and participation metrics

## Role Hierarchy
1. WEB_STEWARD - Full admin access
2. BOARD_CHAIR - Admin access
3. COMMITTEE_LEADER - Committee management
4. CONTENT_MODERATOR - Content moderation
5. ELDER_COUNCIL - Advisory role
6. ACTIVE_GUARDIAN - Active member
7. STEWARD - Standard member
8. PUBLIC - Public/unauthenticated

## Environment Variables Required

### Replit Secrets (sensitive - set via Secrets tab)
```
DATABASE_URL           - PostgreSQL connection string
AUTH_SECRET            - NextAuth JWT secret
NEXTAUTH_URL           - Application URL (https://...)
RESEND_API_KEY         - Resend email API key
STRIPE_SECRET_KEY      - Stripe secret API key
STRIPE_PUBLISHABLE_KEY - Stripe publishable key
STRIPE_WEBHOOK_SECRET  - Stripe webhook secret
STRIPE_PRICE_BASIC     - Price ID for Basic tier
STRIPE_PRICE_PREMIUM   - Price ID for Premium tier
STRIPE_PRICE_PLATINUM  - Price ID for Platinum tier
```

### Environment Variables (non-sensitive - set via env vars)
```
AUTH_TRUST_HOST=true    - Required for Replit proxy
FROM_EMAIL             - Email sender address
FROM_NAME              - Email sender name
```

## Recent Changes
- 2026-02-13: Referral/Introducer system
  - Added referredById self-relation on User model for affiliate tracking
  - Member search API (/api/members/search) for name-based lookup (no email exposure)
  - "Who Introduced You?" section in financial screening with debounced search
  - Referral connection saved during onboarding, optional field
  - Admin user detail shows Referral Network card (introducer + people introduced)
  - Financial screening questionnaire with 6 questions + referral (onboarding step 4)
  - Server-side scoring, tier assignment, red flag detection

- 2026-02-13: Comprehensive security and configuration audit
  - Removed .env file with plaintext secrets (security fix)
  - Added trustHost: true to both auth configs (edge + full)
  - Set AUTH_TRUST_HOST=true env var
  - Replaced all localhost URL fallbacks with Replit domain
  - Fixed URL construction in payment routes (create-checkout, portal)
  - Updated security headers: X-Frame-Options SAMEORIGIN, CSP frame-ancestors for Replit
  - Fixed allowedDevOrigins in next.config.js for Replit proxy
  - Removed BYPASS_DASHBOARD_AUTH constant from dashboard layout
  - Made pino-pretty import conditional (prevents production crash)
  - Removed API key logging from email.ts
  - Removed dotenv/config manual import from email.ts
  - Removed duplicate SessionProvider component
  - Set FROM_EMAIL, FROM_NAME, AUTH_TRUST_HOST env vars

- 2025-12-18: Complete platform implementation
  - Built all 27 features across 10 phases
  - Implemented authentication with 8 role levels
  - Added Stripe subscription management
  - Created LMS with courses and progress tracking
  - Built committee and participation systems
  - Added media gallery, maps, and partners
  - Implemented admin panel and analytics
  - Created multi-step onboarding flow

## Known Limitations
- In-memory rate limiting, caching, and realtime (SSE) services won't persist across autoscale instances. Redis needed for production multi-instance deployment.
- RESEND_API_KEY must be added to Replit Secrets for email functionality to work (currently in mock mode).

## Design System
- **Colors**: Earth-tone palette (brown, sage, terracotta, stone)
- **Typography**: Clean, professional fonts
- **Layout**: Card-based dashboard design
- **Icons**: Lucide React icon library
