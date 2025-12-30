import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER']

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// POST - Create forum category for a WGO
export async function POST(
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
        { error: 'Only administrators can create forum categories' },
        { status: 403 }
      )
    }

    const { wgoId } = await params

    // Find the WGO
    const wgo = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId },
      include: {
        forumCategory: true
      }
    })

    if (!wgo) {
      return NextResponse.json({ error: 'WGO not found' }, { status: 404 })
    }

    // Check if already has a forum category
    if (wgo.forumCategoryId) {
      return NextResponse.json({
        message: 'Forum category already exists',
        forumCategory: wgo.forumCategory
      })
    }

    // Create forum category
    const slug = `wgo-${generateSlug(wgo.name)}`

    // Check if slug already exists
    const existingCategory = await prisma.forumCategory.findUnique({
      where: { slug }
    })

    let forumCategory
    if (existingCategory) {
      // Link to existing category
      forumCategory = existingCategory
    } else {
      // Create new category
      forumCategory = await prisma.forumCategory.create({
        data: {
          name: `WGO: ${wgo.name}`,
          slug,
          description: `Discussion forum for ${wgo.name} wealth generation opportunity participants`,
        }
      })
    }

    // Update the WGO with the forum category
    await prisma.wealthOpportunity.update({
      where: { id: wgoId },
      data: { forumCategoryId: forumCategory.id }
    })

    return NextResponse.json({
      message: 'Forum category created successfully',
      forumCategory
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating forum category:', error)
    return NextResponse.json(
      { error: 'Failed to create forum category' },
      { status: 500 }
    )
  }
}

// DELETE - Remove forum category link from WGO (doesn't delete the category)
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
        { error: 'Only administrators can unlink forum categories' },
        { status: 403 }
      )
    }

    const { wgoId } = await params

    const wgo = await prisma.wealthOpportunity.findUnique({
      where: { id: wgoId }
    })

    if (!wgo) {
      return NextResponse.json({ error: 'WGO not found' }, { status: 404 })
    }

    // Unlink the forum category (but don't delete it)
    await prisma.wealthOpportunity.update({
      where: { id: wgoId },
      data: { forumCategoryId: null }
    })

    return NextResponse.json({ message: 'Forum category unlinked successfully' })
  } catch (error) {
    console.error('Error unlinking forum category:', error)
    return NextResponse.json(
      { error: 'Failed to unlink forum category' },
      { status: 500 }
    )
  }
}
