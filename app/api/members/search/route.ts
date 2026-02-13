import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ members: [] })
    }

    const members = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          { status: 'ACTIVE' },
          { deletedAt: null },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    })

    const sanitized = members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role.replace(/_/g, ' '),
    }))

    return NextResponse.json({ members: sanitized })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
