import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PoolDetailClient } from './PoolDetailClient'

interface PageProps {
  params: Promise<{ poolId: string }>
}

export default async function PoolDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { poolId } = await params

  return <PoolDetailClient poolId={poolId} userId={session.user.id} userRole={session.user.role} />
}
