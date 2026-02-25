import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { referrerId, userAgent } = await request.json()

    if (!referrerId || typeof referrerId !== 'string') {
      return NextResponse.json({ error: 'Invalid referrer' }, { status: 400 })
    }

    await prisma.referralClick.create({
      data: {
        referrerId,
        userAgent: userAgent?.slice(0, 256) || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
