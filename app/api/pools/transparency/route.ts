import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/api-utils'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'

// GET /api/pools/transparency - Get aggregated pool data for transparency page
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute
    const rateLimitResult = rateLimit(request, 'pools-transparency', RateLimitConfigs.moderate)
    if (rateLimitResult) return rateLimitResult

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Pools feature not yet implemented - return no active pool
    return NextResponse.json({
      hasPool: false,
      message: 'No active pool found',
    })
  } catch (error) {
    logError(error, { action: 'fetch_transparency_data' })
    return NextResponse.json({ error: 'Failed to fetch transparency data' }, { status: 500 })
  }
}
