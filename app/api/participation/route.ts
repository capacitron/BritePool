import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const logParticipationSchema = z.object({
  hours: z.number().min(0.25).max(24),
  description: z.string().min(1).max(1000),
  category: z.string().min(1).max(100),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status) {
      where.status = status
    }

    const [logs, profile] = await Promise.all([
      prisma.participationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userProfile.findUnique({
        where: { userId: session.user.id },
        select: { totalEquityUnits: true, totalHoursLogged: true }
      })
    ])

    const totalHours = logs
      .filter(log => log.status === 'APPROVED')
      .reduce((sum, log) => sum + log.hours, 0)

    const pendingHours = logs
      .filter(log => log.status === 'PENDING')
      .reduce((sum, log) => sum + log.hours, 0)

    const equityUnits = Math.floor(totalHours / 10)

    return NextResponse.json({
      logs,
      summary: {
        totalHours: profile?.totalHoursLogged ?? totalHours,
        pendingHours,
        equityUnits: profile?.totalEquityUnits ?? equityUnits,
        totalLogs: logs.length
      }
    })
  } catch (error) {
    console.error('Error fetching participation logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch participation logs' },
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

    const body = await request.json()
    const parsed = logParticipationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { hours, description, category } = parsed.data

    const log = await prisma.participationLog.create({
      data: {
        userId: session.user.id,
        hours,
        description,
        category,
        status: 'PENDING'
      }
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Error logging participation:', error)
    return NextResponse.json(
      { error: 'Failed to log participation' },
      { status: 500 }
    )
  }
}
