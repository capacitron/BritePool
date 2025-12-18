# Product Roadmap

## Phase 1: Foundation & Access Control

1. [ ] **Membership Contract Agreement System** — Implement covenant acceptance workflow requiring members to agree to combined membership agreement after registration but before site access. Includes contract versioning, re-acceptance tracking when updated, and complete site lockout for non-acceptance. `M`

2. [ ] **User Authentication & Role-Based Access** — Implement secure JWT-based authentication with role-based permissions for Web Steward, Board Chair Directors, Committee Leaders, Content Moderators, Support Staff, Stewards, Partners, and Residents. Include protected routes and role-specific dashboard access. `L`

3. [ ] **Member Dashboard Foundation** — Create personalized dashboard showing member profile, covenant acceptance status, subscription tier, participation summary, and navigation to all member features. Displays current equity units and contribution hours for participating members. `M`

## Phase 2: Communications & Community

4. [ ] **Communications System - Forums & Messaging** — Build internal communication platform with public discussion forums for community-wide topics, group messaging channels for committees, and admin broadcast messaging. Support threaded discussions, rich text formatting, and message search. `L`

5. [ ] **Announcement System with Email Notifications** — Create announcement system with priority levels (urgent/info), role-targeted delivery, pinned dashboard announcements, and integrated email notification system. Members receive weekly digest emails for messages, announcements, and event reminders. `M`

6. [ ] **Community Portal - Task Management** — Implement task assignment and tracking system for residents and practitioners. Includes task creation, assignment, status updates, priority levels, and completion verification. Integrated with committee workflows. `M`

7. [ ] **Community Portal - Maintenance Requests** — Create maintenance request submission and tracking system for sanctuary residents. Includes request forms, priority assignment, status tracking, photo uploads, and resolution workflows. `S`

## Phase 3: Learning & Events

8. [ ] **Lightweight LMS - Course Platform** — Build simple two-level course system (Course → Lessons) supporting video lessons, PDF downloads, and quizzes/assessments. Committee leaders and admins can author courses with approval workflow. Includes progress tracking and completion certificates. Separate from equity system. `L`

9. [ ] **Events Calendar System** — Create full-featured calendar for committee meetings, workshops, sanctuary events, and virtual webinars. Includes RSVP/registration with capacity limits, recurring events, email reminders, personal calendar sync (iCal export), and multiple views (month, week, list/agenda). Committee leaders and admins can create events. `L`

## Phase 4: Payments & Subscriptions

10. [ ] **Stripe Payment Integration** — Integrate Stripe payment processor for secure payment handling. Support monthly and annual recurring subscriptions, one-time payments for events, and webhook handling for payment status updates. Includes PCI-compliant checkout flow and receipt generation. `M`

11. [ ] **Subscription Management System** — Build subscription management for membership tiers, event tickets/passes, and practitioner services. Members can self-service upgrade/downgrade/cancel subscriptions. Admin dashboard for managing subscriptions, refunds, and viewing payment history. `M`

12. [ ] **Membership Tiers & Access Control** — Implement tiered access model where basic features are free for all covenant members, and premium features (advanced courses, exclusive events, practitioner bookings) require active subscription. Includes tier comparison page and upgrade prompts. `S`

## Phase 5: Committee & Governance

13. [ ] **Committee Management System** — Build committee structure for Governance, Wealth, Education, Health, and Operations boards. Committee leaders can manage member assignments, schedule meetings (integrated with calendar), track decisions, and manage committee-specific tasks and discussions. `L`

14. [ ] **Sacred Ledger - Participation Tracking** — Build system to log and verify member participation hours across committees and tasks. Automatically calculates equity units (10 hours = 1 unit) and displays contribution history with verification workflow. Admin approval for hour logging. `L`

## Phase 6: Content & Media

15. [ ] **Media Gallery System** — Implement media upload, storage (AWS S3/Cloudinary), and display system for photography, drone footage, and project visuals. Includes categorization by project, date, and media type with responsive lightbox viewing and lazy loading. `M`

16. [ ] **Interactive Project Maps** — Integrate Mapbox or Leaflet for interactive maps showing sanctuary locations (Aliento De Vida 415-acre property) with custom markers for points of interest, facilities, and development zones. Includes zoom, pan, location details popup, and mobile-optimized touch controls. `M`

17. [ ] **Affiliate Partners Gallery** — Create filterable grid gallery (3-4 columns) displaying partner logos, names, descriptions, and services. Partners can self-service manage profiles after admin approval. Simple category filter (Advisory Board, Practitioners, Sponsors, etc.). `S`

## Phase 7: Transparency & Stakeholder

18. [ ] **Transparency Hub - Public Facing** — Build public-facing transparency page showing real-time project progress, funding milestones, and ecological metrics for sanctuary projects. Includes visual timeline, impact metrics displays, and media gallery integration. Accessible without login for public trust-building. `M`

19. [ ] **Stakeholder Dashboard** — Create secure dashboard for partners and advisory board members to access progress reports, session logs, project documentation, and timestamp-verified updates. Includes document library with filtering, download capabilities, and view-only permissions. `M`

20. [ ] **Document Management & Timestamp Verification** — Implement secure document storage (AWS S3) with version control, blockchain-ready SHA-256 timestamp verification for stakeholder reports, covenant agreements, and official records. Includes access control and audit logging. `L`

## Phase 8: Onboarding & Applications

21. [ ] **Application & Onboarding Workflow** — Create multi-step application system for prospective members to submit occupational requests, upload documents, schedule interviews with committee leaders, and complete onboarding steps. Includes admin review dashboard and automated status emails. `M`

## Phase 9: Admin & Management

22. [ ] **Admin Panel with Role-Based Controls** — Create comprehensive administrative interface with role-specific access for Web Steward (full access), Board Chair Directors (domain-specific), Committee Leaders (committee only), Content Moderators (approve/edit content), and Support Staff (view/assist only). Includes user management, content moderation, and system settings. `L`

23. [ ] **Analytics & Reporting Dashboard** — Create analytics dashboard showing member engagement metrics, course completion rates, event attendance, subscription revenue, participation statistics, and platform usage insights. Exportable reports for administrators and committee leaders. `M`

## Phase 10: Integrations & Advanced Features

24. [ ] **ActiveCampaign Integration** — Integrate ActiveCampaign API for external newsletter management, automated marketing outreach campaigns, and prospect nurturing. Includes list sync, campaign tracking, and unsubscribe handling. Separate from internal announcement system. `S`

25. [ ] **Internal Management Software Integration** — Build API integration layer to sync with existing internal tracking systems for auto-updating progress logs, member data, and maintaining consistency across platforms. Includes webhook receivers and scheduled sync jobs. `L`

26. [ ] **Multilingual Support (Spanish)** — Implement full Spanish localization using next-intl for all public-facing and member areas. Includes JSON-based translation files, language switcher, and locale-specific date/number formatting for Costa Rica sanctuary members. `M`

27. [ ] **Search & Filtering System** — Add global search functionality across courses, events, forum discussions, documents, and members (respecting permissions). Advanced filtering by date, category, project, status, and content type with instant results. `M`

---

## Notes

**Development Approach:**
- Order items by technical dependencies and product architecture
- Each item represents an end-to-end (frontend + backend) functional and testable feature
- Build in phases to ensure stable foundation before adding complexity

**Key Dependencies:**
- Contract system (1) must be complete before authentication (2)
- Authentication and roles (2) required for all subsequent features
- Payment integration (10) required before subscription management (11)
- Committee system (13) supports task management (6), events (9), and forums (4)
- Communication system (4,5) foundational for community engagement

**Effort Scale:**
- `XS`: 1 day
- `S`: 2-3 days
- `M`: 1 week
- `L`: 2 weeks
- `XL`: 3+ weeks

**Total Estimated Timeline:**
27 features × average 1.5 weeks = ~40 weeks for full build (adjustable based on team size and parallel development)
