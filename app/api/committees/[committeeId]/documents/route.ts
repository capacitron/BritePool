import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createDocumentSchema } from '@/lib/validations/committee'

// Get documents for a committee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Check if user is a member
    const membership = await prisma.committeeMember.findUnique({
      where: {
        userId_committeeId: {
          userId: session.user.id,
          committeeId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this committee' }, { status: 403 })
    }

    const documents = await prisma.committeeDocument.findMany({
      where: {
        committeeId,
        isShared: true,
        ...(category ? { category: category as any } : {})
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// Upload a new document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { committeeId } = await params

    // Check if user is a member
    const membership = await prisma.committeeMember.findUnique({
      where: {
        userId_committeeId: {
          userId: session.user.id,
          committeeId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this committee' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createDocumentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const document = await prisma.committeeDocument.create({
      data: {
        committeeId,
        uploadedById: session.user.id,
        ...parsed.data
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
