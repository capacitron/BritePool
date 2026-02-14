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
