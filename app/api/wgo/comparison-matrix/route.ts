import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/roles'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { z } from 'zod'

export const runtime = 'nodejs'

const updateMatrixSchema = z.object({
  id: z.string(),
  similarity: z.string().max(2000).optional(),
  difference: z.string().max(2000).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'wgo-matrix', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await prisma.wGOComparisonMatrix.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: rows })
  } catch (error) {
    logError(error, { action: 'fetch_comparison_matrix' })
    return NextResponse.json({ error: 'Failed to fetch comparison matrix' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'wgo-matrix', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = isAdmin(session.user.role)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateMatrixSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, similarity, difference } = parsed.data
    const updateData: Record<string, string> = {}
    if (similarity !== undefined) updateData.similarity = similarity
    if (difference !== undefined) updateData.difference = difference

    const row = await prisma.wGOComparisonMatrix.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(row)
  } catch (error) {
    logError(error, { action: 'update_comparison_matrix' })
    return NextResponse.json({ error: 'Failed to update comparison matrix' }, { status: 500 })
  }
}
