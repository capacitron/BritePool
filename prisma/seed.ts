import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const contractContent = `# BRITE POOL MINISTERIUM OF EMPOWERMENT
## MEMBERSHIP & PARTICIPATION AGREEMENT

**Version 1.0.0** | Effective Date: December 2025

---

## I. PURPOSE & INTENT

This Membership and Participation Agreement ("Agreement") establishes the terms and conditions under which you ("Member," "Steward," or "You") participate in BRITE POOL Ministerium of Empowerment ("BRITE POOL," "Ministerium," or "We").

BRITE POOL is a private ministerial unincorporated association dedicated to building sovereign futures through empowered communities. Our mission centers on transparent project management, member collaboration, and regenerative development initiatives.

By accepting this Agreement, you acknowledge and affirm that:

1. You are joining a private association of like-minded individuals
2. You understand and accept the principles of collective empowerment
3. You commit to transparent participation and honest communication
4. You respect the privacy and confidentiality of fellow members

---

## II. DEFINITIONS

For the purposes of this Agreement, the following terms shall have the meanings set forth below:

**"Sacred Ledger"** means the transparent system for tracking member contributions, participation hours, and equity unit calculations.

**"Equity Unit"** means a unit of participation credit earned at the rate of 1 unit per 10 hours of verified participation.

**"Committee"** means any of the five governing bodies: Governance, Wealth, Education, Health, and Operations.

**"Sanctuary"** means any physical location operated by or affiliated with BRITE POOL, including but not limited to the Aliento De Vida property.

**"Steward"** means a full member with voting rights and community participation privileges.

---

## III. MEMBERSHIP OBLIGATIONS

As a Member of BRITE POOL, you agree to:

### A. Conduct Standards
- Treat all fellow members with respect and dignity
- Communicate honestly and transparently
- Participate constructively in community activities
- Protect the privacy of fellow members and proprietary information

### B. Participation Requirements
- Log participation hours accurately and honestly
- Attend committee meetings as applicable to your role
- Respond to community communications in a timely manner
- Support the collective mission and values of BRITE POOL

### C. Financial Obligations
- Pay any applicable membership fees as required by your tier
- Contribute to collective initiatives as you are able
- Report any financial concerns or hardships promptly

---

## IV. NON-DISCLOSURE & CONFIDENTIALITY

### A. Confidential Information
You acknowledge that during your membership, you may receive or have access to confidential information including but not limited to:
- Member personal information and contact details
- Financial data and contribution records
- Strategic plans and development initiatives
- Proprietary systems and processes

### B. Non-Disclosure Obligations
You agree to:
- Keep all confidential information strictly private
- Not share member information with third parties
- Protect digital and physical documents containing sensitive data
- Report any suspected breaches immediately

### C. Duration
Your confidentiality obligations continue indefinitely, even after your membership ends.

---

## V. INTELLECTUAL PROPERTY

All content, systems, designs, and materials created by or for BRITE POOL remain the exclusive property of BRITE POOL. Members may not reproduce, distribute, or create derivative works without express written permission.

---

## VI. LIMITATION OF LIABILITY

BRITE POOL and its officers, directors, and members shall not be liable for any indirect, incidental, special, or consequential damages arising from your participation in the Ministerium.

---

## VII. TERMINATION

### A. Voluntary Withdrawal
You may terminate your membership at any time by providing written notice.

### B. Involuntary Termination
BRITE POOL reserves the right to terminate membership for:
- Violation of this Agreement
- Conduct detrimental to the community
- Non-payment of required fees
- Breach of confidentiality

---

## VIII. DISPUTE RESOLUTION

Any disputes arising from this Agreement shall be resolved through:
1. Direct communication between parties
2. Mediation by designated committee leaders
3. Final arbitration by the Board Chair Directors

---

## IX. AMENDMENTS

BRITE POOL reserves the right to amend this Agreement at any time. Members will be notified of changes and required to accept updated terms to continue participation.

---

## X. ACCEPTANCE

By clicking "Accept Contract" below, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions of this Membership and Participation Agreement.

You further affirm that you are entering into this Agreement voluntarily and with full understanding of your rights and obligations as a Member of BRITE POOL Ministerium of Empowerment.

---

**BRITE POOL Ministerium of Empowerment**
*Building Resources Investing Together for Empowerment*
`

async function main() {
  console.log('Starting seed...')

  const existingContract = await prisma.contractVersion.findFirst({
    where: { isActive: true },
  })

  if (!existingContract) {
    await prisma.contractVersion.create({
      data: {
        version: '1.0.0',
        content: contractContent,
        isActive: true,
      },
    })
    console.log('Created initial contract version 1.0.0')
  } else {
    console.log('Active contract already exists, skipping...')
  }

  // Ensure admin users exist in every environment (dev + production)
  const admins = [
    {
      email: 'jr@capacitron.com',
      name: 'Jonathan',
      password: '4-Honor',
    },
    {
      email: 'rebecca@whiterabbit.academy',
      name: 'Rebecca',
      password: 'Admin123!',
    },
  ]

  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 12)
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        passwordHash,
        role: 'WEB_STEWARD',
        status: 'ACTIVE',
        onboardingCompleted: true,
        emailVerified: new Date(),
      },
      create: {
        email: admin.email,
        name: admin.name,
        passwordHash,
        role: 'WEB_STEWARD',
        status: 'ACTIVE',
        onboardingCompleted: true,
        emailVerified: new Date(),
        covenantAcceptedAt: new Date(),
      },
    })
    console.log(`✓ Admin user ensured: ${admin.email}`)
  }

  const committees = [
    {
      name: 'Board of Directors',
      slug: 'board-of-directors',
      type: 'GOVERNANCE' as const,
      description: 'Oversees organizational strategy and governance',
    },
    {
      name: 'Operations Committee',
      slug: 'operations-committee',
      type: 'OPERATIONS' as const,
      description: 'Manages day-to-day operations',
    },
    {
      name: 'Wealth Building Committee',
      slug: 'wealth-building',
      type: 'WEALTH' as const,
      description: 'Develops wealth building opportunities',
    },
    {
      name: 'Health & Wellness Committee',
      slug: 'health-wellness',
      type: 'HEALTH' as const,
      description: 'Promotes health and wellness initiatives',
    },
    {
      name: 'Education Committee',
      slug: 'education-committee',
      type: 'EDUCATION' as const,
      description: 'Develops educational programs',
    },
  ]

  for (const committee of committees) {
    await prisma.committee.upsert({
      where: { name: committee.name },
      update: {},
      create: committee,
    })
  }
  console.log('✓ Committees seeded')

  const categories = [
    { name: 'General Discussion', slug: 'general', description: 'Open discussion for all members' },
    { name: 'Announcements', slug: 'announcements', description: 'Official announcements' },
    { name: 'Help & Support', slug: 'help-support', description: 'Get help from the community' },
    { name: 'Ideas & Suggestions', slug: 'ideas', description: 'Share your ideas' },
    { name: 'Events', slug: 'events', description: 'Discuss upcoming events' },
  ]

  for (const category of categories) {
    const existing = await prisma.forumCategory.findFirst({
      where: { OR: [{ slug: category.slug }, { name: category.name }] },
    })
    if (!existing) {
      await prisma.forumCategory.create({ data: category })
    }
  }
  console.log('✓ Forum categories seeded')

  // ── WGO Category Migration ──────────────────────────────────────
  // Migrate existing WGOs from old categories to new categories
  const categoryMigrations = [
    { oldTitle: 'Polar Tensor', newCategory: 'CRYPTO_AI_TRADING' },
    { oldTitle: 'Bellator', newCategory: 'NODES' },
    { oldTitle: 'MetaTerra', newCategory: 'NODES' },
    { oldTitle: 'Aurum', newCategory: 'CRYPTO_AI_TRADING' },
  ]

  for (const migration of categoryMigrations) {
    await prisma.wealthOpportunity.updateMany({
      where: { title: { contains: migration.oldTitle } },
      data: { category: migration.newCategory as any },
    })
  }
  console.log('✓ Existing WGO categories migrated')

  // ── Seed new DRAFT WGOs (4-8) ──────────────────────────────────
  // Find an admin user to be the creator
  const seedCreator = await prisma.user.findFirst({
    where: { role: 'WEB_STEWARD' },
  })

  if (seedCreator) {
    const draftWGOs = [
      {
        title: 'LiveGood',
        description:
          'LiveGood is a membership-based wellness and financial opportunity platform offering high-quality health products at member-only prices. Members can earn through product sales, team building, and a matrix compensation plan.',
        category: 'MEMBERSHIP',
        status: 'DRAFT',
        credibilityScore: 10,
        minimumInvestment: 10,
        wgoType: 'Crypto + Fiat',
        shortDescription: 'Matrix + Uni-Level hybrid with product sales and team commissions',
        presentationDays: 'Every Tuesday 5:00 PM PST / Thursday 12:00 PM PST',
      },
      {
        title: 'Affiliate Mentor',
        description:
          'Affiliate Mentor is an AI-powered marketing platform that automates affiliate campaigns using advanced AI tools. Members earn through automated marketing funnels, referral commissions, and AI-generated content strategies.',
        category: 'AI_MARKETING',
        status: 'DRAFT',
        credibilityScore: 9,
        minimumInvestment: 25,
        wgoType: 'Fiat (Stripe / PayPal)',
        shortDescription: 'Recurring affiliate commissions + AI-automated marketing funnels',
        presentationDays: 'Webinar every Wednesday 6:00 PM EST',
      },
      {
        title: 'GGC — Crypto Gold Exchange',
        description:
          'GGC (Global Gold Coin) is a gold-backed cryptocurrency platform enabling members to trade, stake, and invest in tokenized gold assets. Combines the stability of gold with blockchain transparency.',
        category: 'GOLD_RWA',
        status: 'DRAFT',
        credibilityScore: 8,
        minimumInvestment: 100,
        wgoType: 'Crypto only (USDT / BTC)',
        shortDescription: 'Gold-backed token staking + RWA trading yields',
        presentationDays: 'Bi-weekly Thursday 7:00 PM CST',
      },
      {
        title: 'LoomX',
        description:
          'LoomX is a crypto AI trading platform offering automated trading bots and portfolio management. Members invest and earn through algorithmic trading strategies across multiple exchanges.',
        category: 'CRYPTO_AI_TRADING',
        status: 'DRAFT',
        credibilityScore: 5,
        minimumInvestment: 100,
        wgoType: 'Crypto only',
        shortDescription: 'AI algo-trading pools with variable APY returns',
        presentationDays: 'Monthly AMA — first Saturday',
      },
      {
        title: 'Coop Income',
        description:
          'Coop Income is a crowd-funding cooperative where members pool resources for collective investments. Returns are distributed proportionally based on contribution levels.',
        category: 'CROWD_FUNDING',
        status: 'DRAFT',
        credibilityScore: 4,
        minimumInvestment: 5,
        wgoType: 'Fiat (Cash App / Zelle)',
        shortDescription: 'Cooperative pooled investing with proportional profit sharing',
        presentationDays: 'Open Zoom — Sundays 3:00 PM EST',
      },
    ]

    for (const wgo of draftWGOs) {
      const existing = await prisma.wealthOpportunity.findFirst({
        where: { title: wgo.title },
      })
      if (!existing) {
        await prisma.wealthOpportunity.create({
          data: {
            ...wgo,
            category: wgo.category as any,
            status: wgo.status as any,
            creatorId: seedCreator.id,
            involvements: {
              create: {
                userId: seedCreator.id,
                role: 'LEADER',
                status: 'ACTIVE',
              },
            },
          },
        })
        console.log(`  ✓ Created DRAFT WGO: ${wgo.title}`)
      } else {
        console.log(`  ⊘ WGO already exists: ${wgo.title}`)
      }
    }
    console.log('✓ DRAFT WGOs seeded')
  }

  // ── Seed Comparison Matrix ──────────────────────────────────────
  const matrixRows = [
    {
      theme: 'Revenue Model',
      sortOrder: 1,
      similarity:
        'All platforms offer passive or semi-passive income streams with referral-based earning structures and tiered compensation plans.',
      difference:
        'LiveGood uses a matrix + uni-level hybrid, Affiliate Mentor relies on recurring affiliate commissions, GGC focuses on gold-backed staking yields, LoomX uses AI algo-trading pools, and Coop Income distributes cooperative pooled returns.',
    },
    {
      theme: 'AI & Technology',
      sortOrder: 2,
      similarity:
        'Multiple platforms integrate AI-driven tools — Polar Tensor and LoomX for trading, Affiliate Mentor for marketing automation, and Bellator/MetaTerra for node infrastructure.',
      difference:
        'Polar Tensor and LoomX are fully AI-automated trading. Affiliate Mentor uses AI for content and funnel generation. Bellator and MetaTerra run decentralized node infrastructure. LiveGood, GGC, and Coop Income have minimal or no AI integration.',
    },
    {
      theme: 'Payment & Accessibility',
      sortOrder: 3,
      similarity:
        'All platforms accept some form of digital payment and have low-to-moderate entry costs, making them accessible to a wide range of members.',
      difference:
        'LiveGood and Coop Income accept fiat (Cash App, Zelle, Stripe). GGC and LoomX are crypto-only (USDT/BTC). Affiliate Mentor uses Stripe/PayPal. Polar Tensor, Aurum, and Bellator accept both crypto and fiat.',
    },
    {
      theme: 'Transparency',
      sortOrder: 4,
      similarity:
        'Most platforms provide some level of public-facing documentation, dashboards, or reporting for members to track performance.',
      difference:
        'Polar Tensor and Bellator publish real-time dashboards with verifiable on-chain data. LiveGood provides corporate earnings reports. LoomX and Coop Income have limited public transparency. GGC publishes gold reserve audits quarterly.',
    },
    {
      theme: 'Communication',
      sortOrder: 5,
      similarity:
        'All platforms maintain active community channels (Telegram, Discord, or Zoom) with regular scheduled calls or presentations.',
      difference:
        'LiveGood has the most frequent schedule (2x/week). Affiliate Mentor runs weekly webinars. GGC and Coop Income hold bi-weekly or monthly events. LoomX relies primarily on monthly AMAs with less frequent direct communication.',
    },
  ]

  for (const row of matrixRows) {
    const existing = await prisma.wGOComparisonMatrix.findFirst({
      where: { theme: row.theme },
    })
    if (!existing) {
      await prisma.wGOComparisonMatrix.create({ data: row })
      console.log(`  ✓ Created matrix row: ${row.theme}`)
    } else {
      console.log(`  ⊘ Matrix row exists: ${row.theme}`)
    }
  }
  console.log('✓ Comparison matrix seeded')

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
