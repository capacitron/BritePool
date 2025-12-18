import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MediaDetailClient } from './MediaDetailClient'

interface MediaDetailPageProps {
  params: Promise<{ itemId: string }>
}

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { itemId } = await params

  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id: itemId },
    include: {
      uploadedBy: {
        select: { id: true, name: true }
      }
    }
  })

  if (!mediaItem) {
    notFound()
  }

  const formattedItem = {
    id: mediaItem.id,
    url: mediaItem.url,
    thumbnailUrl: mediaItem.thumbnailUrl,
    mediumUrl: mediaItem.mediumUrl,
    filename: mediaItem.filename,
    filesize: mediaItem.filesize,
    mimeType: mediaItem.mimeType,
    type: mediaItem.type,
    category: mediaItem.category,
    tags: mediaItem.tags,
    uploadedBy: mediaItem.uploadedBy,
    createdAt: mediaItem.createdAt.toISOString(),
  }

  return (
    <MediaDetailClient
      mediaItem={formattedItem}
      userId={session.user.id}
      userRole={session.user.role}
    />
  )
}
