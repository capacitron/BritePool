import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateWGOSchema = z.object({
  name: z.string().min(1).max(200).optional(),
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
  ]).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'PAUSED', 'CLOSED', 'SUSPENDED']).optional(),
  riskTolerance: z.number().int().min(1).max(10).optional(),
  minimumInvestment: z.number().positive().optional().nullable(),
  potentialReturns: z.string().max(500).optional(),
  compoundingType: z.string().max(500).optional(),
  memberBenefits: z.string().max(1000).optional(),
  yearsOperating: z.number().int().min(0).optional().nullable(),
  verifiedBy: z.string().max(200).optional(),
  disclaimer: z.string().max(2000).optional(),
  termsUrl: z.string().url().optional().or(z.literal('')),
  totalMembers: z.number().int().min(0).optional(),
  communityRating: z.number().min(0).max(5).optional(),
})

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wgoId } = await params

    const opportunity = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Error fetching WGO:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can update opportunities' },
        { status: 403 }
      )
    }

    const { wgoId } = await params
    const body = await request.json()
    const parsed = updateWGOSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existing = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const data = parsed.data

    // Only update fields that are provided
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.logo !== undefined) updateData.logo = data.logo || null
    if (data.website !== undefined) updateData.website = data.website || null
    if (data.affiliateLink !== undefined) updateData.affiliateLink = data.affiliateLink || null
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.category !== undefined) updateData.category = data.category
    if (data.status !== undefined) updateData.status = data.status
    if (data.riskTolerance !== undefined) updateData.riskTolerance = data.riskTolerance
    if (data.minimumInvestment !== undefined) updateData.minimumInvestment = data.minimumInvestment
    if (data.potentialReturns !== undefined) updateData.potentialReturns = data.potentialReturns || null
    if (data.compoundingType !== undefined) updateData.compoundingType = data.compoundingType || null
    if (data.memberBenefits !== undefined) updateData.memberBenefits = data.memberBenefits || null
    if (data.yearsOperating !== undefined) updateData.yearsOperating = data.yearsOperating
    if (data.verifiedBy !== undefined) updateData.verifiedBy = data.verifiedBy || null
    if (data.disclaimer !== undefined) updateData.disclaimer = data.disclaimer || null
    if (data.termsUrl !== undefined) updateData.termsUrl = data.termsUrl || null
    if (data.totalMembers !== undefined) updateData.totalMembers = data.totalMembers
    if (data.communityRating !== undefined) updateData.communityRating = data.communityRating

    const opportunity = await prisma.wealthOpportunity.update({
      where: { id: wgoId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Error updating WGO:', error)
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wgoId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can delete opportunities' },
        { status: 403 }
      )
    }

    const { wgoId } = await params

    const existing = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    await prisma.wealthOpportunity.delete({
      where: { id: wgoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting WGO:', error)
    return NextResponse.json(
      { error: 'Failed to delete opportunity' },
      { status: 500 }
    )
  }
}
