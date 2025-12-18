# BRITE POOL - Ministerium of Empowerment

## Overview
A Next.js 15 web application for the BRITE POOL community platform built with:
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM (v5.22)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Running the Application
The dev server runs on port 5000 with:
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

## Database
- Uses Replit's built-in PostgreSQL database
- Connection via `DATABASE_URL` environment variable
- Schema defined in `prisma/schema.prisma`

### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio

## Project Structure
```
app/           - Next.js App Router pages and layouts
lib/           - Shared utilities (Prisma client)
prisma/        - Database schema and migrations
agent-os/      - Product specs, roadmap, and standards
docs-temp/     - Original documentation and specs
```

## Recent Changes
- 2025-12-18: Initial setup for Replit environment
  - Configured Next.js to allow all dev origins for proxy compatibility
  - Downgraded Prisma from v7 to v5.22 for compatibility
  - Fixed MediaItem-MapLocation relation in schema
  - Set up PostgreSQL database and pushed schema
  - Configured deployment settings
