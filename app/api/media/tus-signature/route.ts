import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createVideoObject, generateTusSignature, isStreamConfigured } from '@/lib/bunny'

/**
 * POST /api/media/tus-signature
 * Create a Bunny Stream video object and return TUS upload credentials.
 * Client uses these to upload directly to Bunny via tus-js-client.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isStreamConfigured()) {
      return NextResponse.json({ error: 'Bunny Stream not configured.' }, { status: 503 })
    }

    const body = await request.json()
    const title = body.title || 'Untitled'
    const collectionId = body.collectionId

    // Step 1: Create video object in Bunny Stream
    const { guid } = await createVideoObject(title, collectionId)

    // Step 2: Generate TUS signature (expires in 1 hour)
    const expirationTime = Math.floor(Date.now() / 1000) + 3600
    const tusAuth = generateTusSignature(guid, expirationTime)

    return NextResponse.json({
      videoId: guid,
      tusEndpoint: 'https://video.bunnycdn.com/tusupload',
      authSignature: tusAuth.signature,
      authExpire: tusAuth.expirationTime,
      libraryId: tusAuth.libraryId,
      userId: session.user.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create upload session' },
      { status: 500 }
    )
  }
}
