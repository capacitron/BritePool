# BRITE POOL Ministerium of Empowerment

A web-based platform helping empowered communities build sovereign futures through integrated membership management, learning systems, and transparent project tracking.

## Tech Stack

- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+ with biophilic design system
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5
- **Payments:** Stripe
- **Maps:** Mapbox GL JS
- **Media Storage:** AWS S3 or Cloudinary

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Set up database:**
   ```bash
   # Create PostgreSQL database
   createdb britepool

   # Run Prisma migrations
   npx prisma migrate dev

   # Generate Prisma Client
   npx prisma generate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
britepool/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Member dashboard
│   └── ...
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/               # Database schema
├── types/                # TypeScript types
└── public/               # Static assets
```

## Features

### Phase 1: Foundation (Completed)
- ✅ Project structure with TypeScript & Tailwind
- ✅ Biophilic design system configured
- ✅ Complete database schema with Prisma

### Phase 2-10: Implementation (Planned)
- Membership contract system
- User authentication & RBAC
- Communications (forums, messaging, announcements)
- Learning Management System
- Events calendar
- Stripe payments & subscriptions
- Committee management
- Sacred Ledger (participation tracking)
- Media gallery
- Interactive maps
- And more... (27 features total)

## Design System

BRITE POOL uses a custom biophilic design system inspired by nature:

**Colors:**
- Earth Brown (#8B6F47) - Primary brand
- Sage (#87A878) - Success & growth
- Terracotta (#D4725C) - CTAs
- Sky Soft (#B8D4E8) - Info states
- Stone Warm (#E8E3DA) - Light backgrounds
- Earth Dark (#3A3428) - Text

**Typography:**
- Headings: Spectral (serif)
- Body: Inter (sans-serif)

## Contributing

This project is managed by the BRITE POOL community. For questions or contributions, contact the Web Steward.

## License

Proprietary - BRITE POOL Ministerium of Empowerment
