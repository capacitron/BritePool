import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WGODetailClient } from './WGODetailClient'

interface PageProps {
  params: Promise<{ wgoId: string }>
}

export default async function WGODetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { wgoId } = await params

  const opportunity = await prisma.wealthOpportunity.findUnique({
    where: { id: wgoId },
    include: {
      createdBy: {
        select: { id: true, name: true }
      }
    }
  })

  if (!opportunity) {
    notFound()
  }

  const formattedOpportunity = {
    ...opportunity,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
  }

  return (
    <WGODetailClient
      opportunity={formattedOpportunity}
      userRole={session.user.role}
    />
  )
}
