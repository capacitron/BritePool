# Tech Stack

## Framework & Runtime
- **Application Framework:** Next.js 14+ (App Router)
- **Language/Runtime:** TypeScript 5+ on Node.js 20+
- **Package Manager:** pnpm (fast, efficient, disk-space optimized)

## Frontend
- **JavaScript Framework:** React 18+ (Server Components + Client Components)
- **CSS Framework:** Tailwind CSS 4+ (utility-first for custom biophilic design)
- **UI Components:** shadcn/ui (accessible, customizable components)
- **Icons:** Lucide React (clean, modern icon set)
- **Animations:** Framer Motion (smooth transitions for nature-inspired UX)

## Database & Storage
- **Database:** PostgreSQL 16+ (reliable, ACID-compliant for member data)
- **ORM/Query Builder:** Prisma (type-safe database access with migrations)
- **Caching:** Redis (session management, real-time data caching)
- **File Storage:** AWS S3 or Cloudinary (media assets - photos, drone footage)
- **CDN:** CloudFront or Cloudinary CDN (optimized global media delivery)

## Authentication & Authorization
- **Authentication:** NextAuth.js v5 (secure JWT-based auth)
- **Session Management:** JWT with secure httpOnly cookies
- **Authorization:** Role-based access control (RBAC) middleware
- **Password Security:** bcrypt for hashing

## Maps & Geolocation
- **Mapping Library:** Mapbox GL JS or Leaflet.js (interactive sanctuary maps)
- **Geocoding:** Mapbox Geocoding API
- **Custom Markers:** SVG-based custom markers for sanctuary locations

## Internationalization (i18n)
- **i18n Framework:** next-intl (Next.js-native internationalization)
- **Languages:** English (en), Spanish (es)
- **Content Management:** JSON-based translation files with fallback support

## Email & Communications
- **Email Marketing:** ActiveCampaign API integration
- **Transactional Email:** SendGrid or Resend (system notifications, onboarding)
- **Email Templates:** React Email (type-safe email templates)

## Testing & Quality
- **Test Framework:** Vitest (fast unit tests) + Playwright (E2E tests)
- **Type Checking:** TypeScript strict mode
- **Linting/Formatting:** ESLint + Prettier + prettier-plugin-tailwindcss
- **Pre-commit Hooks:** Husky + lint-staged (code quality enforcement)

## Deployment & Infrastructure
- **Hosting:** Vercel (seamless Next.js deployment) or AWS (EC2 + RDS)
- **CI/CD:** GitHub Actions (automated testing and deployment)
- **SSL/TLS:** Automatic HTTPS via Vercel or AWS Certificate Manager
- **Backups:** Daily automated PostgreSQL backups to S3
- **Environment Management:** .env files with validation via zod

## Monitoring & Analytics
- **Error Tracking:** Sentry (real-time error monitoring)
- **Analytics:** Plausible or Vercel Analytics (privacy-focused, GDPR-compliant)
- **Performance Monitoring:** Vercel Speed Insights
- **Logging:** Pino (structured JSON logging)

## Accessibility
- **Standards Compliance:** WCAG 2.1 Level AA
- **Testing:** axe-core (automated accessibility testing)
- **Screen Reader Support:** Semantic HTML + ARIA labels
- **Focus Management:** Custom focus trap utilities

## Document Management
- **Document Storage:** AWS S3 with versioning
- **Timestamp Verification:** Blockchain-ready hashing (SHA-256)
- **PDF Generation:** react-pdf or Puppeteer (reports, certificates)

## Third-Party Integrations
- **ActiveCampaign:** REST API integration for newsletters and campaigns
- **Internal Management Software:** Custom REST API integration layer
- **Payment Processing:** Stripe (for future covenant contributions if needed)

## Development Tools
- **Version Control:** Git + GitHub
- **API Development:** tRPC (type-safe API layer) or Next.js API Routes
- **Database GUI:** Prisma Studio or TablePlus
- **API Testing:** Thunder Client or Postman

## Security
- **CORS:** Configured for domain security
- **Rate Limiting:** Upstash Redis rate limiting
- **Input Validation:** Zod schemas for all user inputs
- **SQL Injection Prevention:** Prisma parameterized queries
- **XSS Protection:** React built-in escaping + CSP headers
- **Environment Secrets:** Encrypted environment variables

## Design System
- **Design Tokens:** Tailwind config with custom biophilic color palette
  - Earth tones: browns, greens, warm neutrals
  - Accent colors: sage, terracotta, soft sky blue
- **Typography:** Custom organic font stack (e.g., Inter for body, Spectral for headings)
- **Spacing Scale:** Consistent spacing system via Tailwind
- **Responsive Design:** Mobile-first approach with breakpoints

## Performance Optimization
- **Image Optimization:** Next.js Image component with automatic WebP/AVIF
- **Code Splitting:** Automatic via Next.js dynamic imports
- **Lazy Loading:** React Suspense for below-fold content
- **Bundle Analysis:** @next/bundle-analyzer (monitor bundle size)

---

This stack prioritizes:
- **Developer Experience:** Type safety, modern tooling, fast feedback loops
- **User Experience:** Performance, accessibility, responsive design
- **Scalability:** Cloud-native architecture, CDN optimization, caching
- **Security:** Industry-standard practices for authentication, data protection
- **Maintainability:** Clear separation of concerns, automated testing
