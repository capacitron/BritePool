import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contractVersionId, version } = body

    if (!contractVersionId || !version) {
      return NextResponse.json(
        { error: 'Contract version ID and version are required' },
        { status: 400 }
      )
    }

    const contract = await prisma.contractVersion.findFirst({
      where: { 
        id: contractVersionId,
        isActive: true 
      },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract version not found or not active' },
        { status: 404 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        covenantAcceptedAt: new Date(),
        covenantVersion: version,
        covenantIpAddress: ipAddress.split(',')[0].trim(),
      },
    })

    return NextResponse.json({
      success: true,
      acceptedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error accepting contract:', error)
    return NextResponse.json(
      { error: 'Failed to accept contract' },
      { status: 500 }
    )
  }
}
