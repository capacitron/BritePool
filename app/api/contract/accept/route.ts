import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Debug: Check what cookies are available
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const sessionCookie = allCookies.find(c => c.name.includes('authjs') || c.name.includes('next-auth'))

    console.log('Contract accept - Cookies debug:', {
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      hasSessionCookie: !!sessionCookie,
    })

    const session = await auth()

    console.log('Contract accept - Session debug:', {
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      hasUser: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : [],
      userId: session?.user?.id,
    })

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
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
