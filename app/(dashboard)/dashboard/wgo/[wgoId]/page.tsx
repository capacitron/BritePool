import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
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

  return <WGODetailClient wgoId={wgoId} userId={session.user.id} userRole={session.user.role} />
}
