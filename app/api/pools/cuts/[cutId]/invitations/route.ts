import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { randomUUID } from 'crypto'

// Admin roles that can manage pool invitations
const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

// Helper to check if user can manage invitations for a cut
async function canManageInvitations(
  userId: string,
  userRole: string,
  cutId: string
): Promise<boolean> {
  // Admins can always manage
  if (ADMIN_ROLES.includes(userRole)) {
    return true
  }

  // Check if user is the pool creator
  const cut = await prisma.poolCut.findUnique({
    where: { id: cutId },
    include: {
      pool: {
        select: { creatorId: true },
      },
    },
  })

  return cut?.pool.creatorId === userId
}

// GET /api/pools/cuts/[cutId]/invitations - List invitations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'pools-invitations', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params

    // Check authorization
    const canManage = await canManageInvitations(session.user.id, session.user.role, cutId)
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch invitations for this cut
    const invitations = await prisma.poolInvitation.findMany({
      where: { cutId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invitations)
  } catch (error) {
    logError(error, { action: 'fetch_invitations' })
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

// POST /api/pools/cuts/[cutId]/invitations - Send invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'pools-invitations', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params
    const body = await request.json()

    // Validate request body
    const { email, expiresInDays = 7 } = body
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check authorization
    const canManage = await canManageInvitations(session.user.id, session.user.role, cutId)
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify the cut exists
    const cut = await prisma.poolCut.findUnique({
      where: { id: cutId },
    })
    if (!cut) {
      return NextResponse.json({ error: 'Cut not found' }, { status: 404 })
    }

    // Check for existing pending invitation for this email/cut
    const existingInvitation = await prisma.poolInvitation.findFirst({
      where: {
        cutId,
        email: email.toLowerCase(),
        status: 'PENDING',
      },
    })
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 409 }
      )
    }

    // Generate unique token and expiration date
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Create the invitation
    const invitation = await prisma.poolInvitation.create({
      data: {
        cutId,
        email: email.toLowerCase(),
        token,
        expiresAt,
        status: 'PENDING',
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    logError(error, { action: 'create_invitation' })
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}

// DELETE /api/pools/cuts/[cutId]/invitations - Revoke invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = await rateLimit(request, 'pools-invitations', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cutId } = await params
    const body = await request.json()

    // Validate request body
    const { invitationId } = body
    if (!invitationId || typeof invitationId !== 'string') {
      return NextResponse.json({ error: 'invitationId is required' }, { status: 400 })
    }

    // Check authorization
    const canManage = await canManageInvitations(session.user.id, session.user.role, cutId)
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify the invitation exists and belongs to this cut
    const invitation = await prisma.poolInvitation.findFirst({
      where: {
        id: invitationId,
        cutId,
      },
    })
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Delete the invitation
    await prisma.poolInvitation.delete({
      where: { id: invitationId },
    })

    return NextResponse.json({ success: true, message: 'Invitation revoked' })
  } catch (error) {
    logError(error, { action: 'revoke_invitation' })
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 })
  }
}
