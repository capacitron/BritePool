# BritePool — Development Reference

> Next.js 15 | Prisma | Tailwind | TypeScript

## Database

- **Single DB**: Neon PostgreSQL via `DATABASE_URL` in `.env`
- **ORM**: Prisma v5.22.0 — schema at `prisma/schema.prisma`
- **Client singleton**: `lib/prisma.ts`
- **Seed**: `npx tsx prisma/seed.ts`

```bash
npx prisma db push       # Push schema changes
npx prisma generate      # Regenerate client
npx prisma studio        # Visual DB browser
```

## Scripts

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run test:run         # Vitest (single run)
npm run test:e2e         # Playwright
```

## Next.js App Router — Dynamic Route Rules

- **ONE slug name per path level** — never `[id]` and `[userId]` in the same parent
- Check existing routes before creating: `find app -type d -name "\[*\]" | sort`
- Standard names: `[id]`, `[slug]`, `[committeeId]`, `[eventId]`

## Code Style

- Files under 500 lines
- Never hardcode secrets
- Separate concerns, clean architecture
- Do what was asked, nothing more
