import { NextRequest, NextResponse } from 'next/server'

// Get weekly summaries for a committee
// NOTE: Committee chat summary feature is not yet implemented - Prisma models not available
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
): Promise<NextResponse> {
  // Return empty array as stub response
  const { committeeId } = await params

  return NextResponse.json([])
}

// Generate a new AI summary for the week
// NOTE: Committee chat summary feature is not yet implemented - Prisma models not available
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ committeeId: string }> }
): Promise<NextResponse> {
  return NextResponse.json({ error: 'Feature not yet implemented' }, { status: 501 })
}
