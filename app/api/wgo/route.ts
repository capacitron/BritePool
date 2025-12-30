import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createWGOSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  affiliateLink: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  category: z.enum([
    'PASSIVE_INCOME',
    'INVESTMENT_FUND',
    'STAKING_YIELD',
    'REAL_ESTATE',
    'BUSINESS_VENTURE',
    'EDUCATION_PROGRAM',
    'TRADING_PLATFORM',
    'SAVINGS_PROGRAM',
    'OTHER'
  ]),
  status: z.enum(['PENDING', 'ACTIVE', 'PAUSED', 'CLOSED', 'SUSPENDED']).optional(),
  riskTolerance: z.number().int().min(1).max(10),
  minimumInvestment: z.number().positive().optional(),
  potentialReturns: z.string().max(500).optional(),
  compoundingType: z.string().max(500).optional(),
  memberBenefits: z.string().max(1000).optional(),
  yearsOperating: z.number().int().min(0).optional(),
  verifiedBy: z.string().max(200).optional(),
  disclaimer: z.string().max(2000).optional(),
  termsUrl: z.string().url().optional().or(z.literal('')),
  createForumCategory: z.boolean().optional(), // Optionally create a forum category for discussions
})

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'ACTIVE'
    const minRisk = searchParams.get('minRisk')
    const maxRisk = searchParams.get('maxRisk')

    const where: Record<string, unknown> = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (minRisk) {
      where.riskTolerance = { ...((where.riskTolerance as object) || {}), gte: parseInt(minRisk) }
    }

    if (maxRisk) {
      where.riskTolerance = { ...((where.riskTolerance as object) || {}), lte: parseInt(maxRisk) }
    }

    const opportunities = await prisma.wealthOpportunity.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { riskTolerance: 'desc' }, // Higher trust first
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(opportunities)
  } catch (error) {
    console.error('Error fetching WGOs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can create opportunities' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createWGOSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      name,
      description,
      logo,
      website,
      affiliateLink,
      email,
      category,
      status,
      riskTolerance,
      minimumInvestment,
      potentialReturns,
      compoundingType,
      memberBenefits,
      yearsOperating,
      verifiedBy,
      disclaimer,
      termsUrl,
      createForumCategory
    } = parsed.data

    // Create forum category if requested
    let forumCategoryId: string | null = null
    if (createForumCategory) {
      const slug = `wgo-${generateSlug(name)}`
      // Check if forum category with this slug already exists
      const existingCategory = await prisma.forumCategory.findUnique({
        where: { slug }
      })

      if (!existingCategory) {
        const forumCategory = await prisma.forumCategory.create({
          data: {
            name: `WGO: ${name}`,
            slug,
            description: `Discussion forum for ${name} wealth generation opportunity participants`,
          }
        })
        forumCategoryId = forumCategory.id
      } else {
        forumCategoryId = existingCategory.id
      }
    }

    const opportunity = await prisma.wealthOpportunity.create({
      data: {
        name,
        description: description || null,
        logo: logo || null,
        website: website || null,
        affiliateLink: affiliateLink || null,
        email: email || null,
        category,
        status: status || 'PENDING',
        riskTolerance,
        minimumInvestment: minimumInvestment || null,
        potentialReturns: potentialReturns || null,
        compoundingType: compoundingType || null,
        memberBenefits: memberBenefits || null,
        yearsOperating: yearsOperating || null,
        verifiedBy: verifiedBy || null,
        disclaimer: disclaimer || null,
        termsUrl: termsUrl || null,
        createdById: session.user.id,
        forumCategoryId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        forumCategory: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error('Error creating WGO:', error)
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    )
  }
}
