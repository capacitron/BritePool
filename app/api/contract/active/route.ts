import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const contract = await prisma.contractVersion.findFirst({
      where: { isActive: true },
      orderBy: { publishedAt: 'desc' },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'No active contract found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: contract.id,
      version: contract.version,
      content: contract.content,
      publishedAt: contract.publishedAt,
    })
  } catch (error) {
    console.error('Error fetching active contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}
