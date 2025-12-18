# BRITE POOL - Replit Deployment Guide

This guide will help you import and run BRITE POOL on Replit.com.

## Prerequisites

- Replit account
- GitHub account (recommended for version control)

## Step 1: Import to Replit

### Option A: Import from GitHub (Recommended)
1. Push this project to GitHub
2. Go to https://replit.com
3. Click "Create Repl"
4. Select "Import from GitHub"
5. Paste your repository URL
6. Select "Next.js" as the template
7. Click "Import from GitHub"

### Option B: Upload ZIP
1. Create a ZIP of this project (exclude `node_modules`, `.next`, `docs-temp`)
2. Go to https://replit.com
3. Click "Create Repl"
4. Select "Upload files"
5. Upload the ZIP file

## Step 2: Configure Replit Environment

Replit should auto-detect Next.js. If not, create `.replit` file:

```toml
run = "npm run dev"
entrypoint = "app/page.tsx"

[nix]
channel = "stable-23_11"

[deployment]
run = ["npm", "run", "start"]
deploymentTarget = "cloudrun"

[[ports]]
localPort = 3000
externalPort = 80
```

## Step 3: Set Up PostgreSQL Database

1. In your Repl, go to "Tools" → "Database"
2. Enable PostgreSQL
3. Copy the connection string provided
4. Add to Secrets (see Step 4)

## Step 4: Configure Environment Variables (Secrets)

In Replit, go to "Tools" → "Secrets" and add these variables:

**Required:**
```
DATABASE_URL=<from Replit PostgreSQL>
NEXTAUTH_URL=https://your-repl-name.your-username.repl.co
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

**Optional (for full functionality):**
```
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_MAPBOX_TOKEN=pk....
```

See `.env.example` for complete list.

## Step 5: Install Dependencies & Initialize Database

In the Replit Shell, run:

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Push database schema
npm run db:push
```

## Step 6: Run the Application

Click the "Run" button in Replit, or in Shell:

```bash
npm run dev
```

Your app will be available at: `https://your-repl-name.your-username.repl.co`

## Step 7: Initial Setup

1. Visit your Replit URL
2. Register the first admin account (will be assigned WEB_STEWARD role)
3. Accept the membership covenant
4. Start building your community!

## Database Management

View your database in Replit:
- Go to "Tools" → "Database"
- Or run: `npm run db:studio` (opens Prisma Studio)

## Troubleshooting

### Port Issues
If the app doesn't load, check that port 3000 is exposed in `.replit` configuration.

### Database Connection
Ensure `DATABASE_URL` in Secrets matches the PostgreSQL connection string from Replit.

### Build Errors
Run `npm install` again to ensure all dependencies are installed.

## Production Deployment from Replit

1. Click "Deploy" button in Replit
2. Choose deployment target (Replit uses Cloud Run)
3. Configure production environment variables
4. Deploy!

**Important:** Change all secrets/API keys for production!

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS (Biophilic Design System)
- **Auth:** NextAuth.js v5
- **Payments:** Stripe
- **Email:** Resend
- **Maps:** Mapbox

## Support

For issues, check:
- Replit Console for errors
- Database logs in Replit Database tool
- `npm run build` output for build errors

---

Built with Agent OS • Ministerium of Empowerment
